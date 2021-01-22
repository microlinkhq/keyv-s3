'use strict'

const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand
} = require('@aws-sdk/client-s3')
const { addMilliseconds, getTime } = require('date-fns')
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
    return new URL(`${key}.json`, `https://${this.Bucket}`).toString()
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
      ? getTime(new Date(headers.expires))
      : undefined

    const isExpired = expires ? Date.now() > expires : true

    if (isExpired) return undefined

    return body
  }

  async set (key, value, ttl = this.ttl, opts) {
    if (!ttl) throw new TypeError('ttl is mandatory.')

    const Expires = addMilliseconds(new Date(), ttl)

    const { reason, isRejected } = await pReflect(
      this.s3client.send(
        new PutObjectCommand({
          Key: `${key}.json`,
          Body: JSON.stringify(value, null, 2),
          ContentType: 'application/json',
          Bucket: this.Bucket,
          ACL: 'public-read',
          Expires,
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
