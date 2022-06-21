'use strict'

const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand
} = require('@aws-sdk/client-s3')

const EventEmitter = require('events')
const pReflect = require('p-reflect')

class KeyvS3 extends EventEmitter {
  constructor ({ namespace, hostname, ttl, gotOpts, s3client, got, ...opts }) {
    super()
    this.Bucket = namespace
    this.ttl = ttl
    this.hostname = hostname != null ? hostname : namespace
    this.s3client = s3client != null ? s3client : new S3Client(opts)
    this.got =
      got != null
        ? got
        : require('got').extend({
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
    return new URL(filename, `https://${this.hostname}`).toString()
  }

  async get (key) {
    const { value, reason, isRejected } = await pReflect(
      this.got(this.fileUrl(this.filename(key)), {
        responseType: 'json'
      })
    )

    if (isRejected) {
      if (reason.response) {
        if ([403, 404, 520, 530].includes(reason.response.statusCode)) {
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
