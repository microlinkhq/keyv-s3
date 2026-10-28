'use strict'

const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand
} = require('@aws-sdk/client-s3')

const pReflect = require('p-reflect')

const UNSAFE_PATH_CHARACTERS = /[^!$&'()*+,\-./0-9:;=@A-Z[\]_a-z|~]/gu
const SLASH_AFTER_DOT_SEGMENT = /(?<=(?:^|\/)\.{1,2})\//g

const REPLACEMENT_CHARACTER = '%EF%BF%BD'

const isLoneSurrogate = character =>
  character.length === 1 && character >= '\ud800' && character <= '\udfff'

const percentEncode = character =>
  isLoneSurrogate(character)
    ? REPLACEMENT_CHARACTER
    : encodeURIComponent(character)

const toUrlPath = objectKey =>
  objectKey
    .replace(UNSAFE_PATH_CHARACTERS, percentEncode)
    .replace(SLASH_AFTER_DOT_SEGMENT, '%2F')

const MISSING_STATUS_CODES = [403, 404, 520, 530]

// How many ".." segments climb above the decoded path root.
// "." and empty segments do not count: S3 treats them the same way.
const rootEscapeDepth = pathname => {
  let depth = 0
  let escaped = 0
  for (const segment of decodeURIComponent(pathname).split('/')) {
    if (segment === '' || segment === '.') continue
    depth += segment === '..' ? -1 : 1
    if (depth < 0) escaped = Math.max(escaped, -depth)
  }
  return escaped
}

const readApiObject = async (client, bucket, filename) => {
  const { value, reason, isRejected } = await pReflect(
    client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: filename
      })
    )
  )

  if (isRejected) {
    const statusCode = reason.$metadata?.httpStatusCode
    if (
      reason.name === 'NoSuchKey' ||
      MISSING_STATUS_CODES.includes(statusCode)
    ) {
      return undefined
    }
    throw reason
  }

  const body = JSON.parse(await value.Body.transformToString())
  const expires = value.Expires
    ? new Date(value.Expires).getTime()
    : Number.POSITIVE_INFINITY

  return Date.now() <= expires ? body : undefined
}

class KeyvS3 {
  constructor ({ namespace, hostname, ttl, gotOpts, s3client, got, ...opts }) {
    this.Bucket = namespace
    this.ttl = ttl
    this.hostname = hostname ?? namespace
    this.s3client = s3client ?? new S3Client(opts)
    this.got =
      got ??
      require('@kikobeats/got').extend({
        ...gotOpts,
        retry: opts.maxAttempts ?? gotOpts?.retry,
        timeout: opts.requestHandler?.socketTimeout ?? gotOpts?.timeout
      })
  }

  filename (key) {
    const id = key.toString().replace(`${this.Bucket}:`, '')
    return `${id}.json`
  }

  fileUrl (filename) {
    return new URL(
      `./${toUrlPath(filename)}`,
      `https://${this.hostname}`
    ).toString()
  }

  async get (key) {
    const filename = this.filename(key)
    const fileUrl = this.fileUrl(filename)
    // Path-style writes keep the bucket as a leading segment, so a key that
    // climbs one level above the public root is still stored. The public URL
    // has no bucket segment, and S3 rejects it with 400.
    if (rootEscapeDepth(new URL(fileUrl).pathname) === 1) {
      return readApiObject(this.s3client, this.Bucket, filename)
    }

    const { value, reason, isRejected } = await pReflect(
      this.got(fileUrl, {
        responseType: 'json'
      })
    )

    if (isRejected) {
      if (reason.response) {
        if (MISSING_STATUS_CODES.includes(reason.response.statusCode)) {
          return undefined
        }
      }

      throw reason
    }

    const { statusCode, headers, body } = value

    if (statusCode !== 200) return undefined

    const expires = headers.expires
      ? new Date(headers.expires).getTime()
      : Number.POSITIVE_INFINITY

    return Date.now() <= expires ? body : undefined
  }

  async set (key, value, ttl = this.ttl, opts) {
    const { reason, isRejected } = await pReflect(
      this.s3client.send(
        new PutObjectCommand({
          Key: this.filename(key),
          Body: JSON.stringify(value, null, 2),
          ContentType: 'application/json',
          Bucket: this.Bucket,
          ACL: 'public-read',
          Expires: ttl ? new Date(new Date().getTime() + ttl) : undefined,
          ...opts
        })
      )
    )

    if (isRejected) throw reason
    return true
  }

  async delete (key, opts) {
    const { isRejected, reason } = await pReflect(
      this.s3client.send(
        new DeleteObjectCommand({
          Key: this.filename(key),
          Bucket: this.Bucket,
          ...opts
        })
      )
    )

    if (isRejected) throw reason
    return true
  }
}

module.exports = KeyvS3
