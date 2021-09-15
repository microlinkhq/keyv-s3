'use strict'

const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand
} = require('@aws-sdk/client-s3')

const EventEmitter = require('events')
const pReflect = require('p-reflect')
const got = require('got')

class KeyvS3 extends EventEmitter {
  constructor ({ namespace, ttl, gotOpts, s3client, ...opts }) {
    super()
    this.Bucket = namespace
    this.ttl = ttl
    this.s3client = s3client || new S3Client(opts)
    this.got = got.extend({
      ...gotOpts,
      retry: opts.maxRetries,
      timeout: opts.httpOptions ? opts.httpOptions.timeout : undefined
    })
  }

  fileUrl (key) {
    return new URL(
      `${key.toString().replace(`${this.Bucket}:`, '')}.json`,
      `https://${this.Bucket}`
    ).toString()
  }

  async get (key) {
    const { value, reason, isRejected } = await pReflect(
      this.got(this.fileUrl(key), {
        responseType: 'json'
      })
    )

    if (isRejected) {
      if (reason.response) {
        if ([403, 520, 530].includes(reason.response.statusCode)) {
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
          Key: `${key}.json`,
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

  async delete (Key, opts) {
    const { isRejected, reason } = await pReflect(
      this.s3client.send(
        new DeleteObjectCommand({
          Key,
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
