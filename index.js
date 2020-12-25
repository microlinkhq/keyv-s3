'use strict'

const { addMilliseconds, getTime } = require('date-fns')
const EventEmitter = require('events')
const pReflect = require('p-reflect')
const AWS = require('aws-sdk')
const got = require('got')

class KeyvS3 extends EventEmitter {
  constructor ({ namespace, ttl, ...opts }) {
    super()
    this.Bucket = namespace
    this.ttl = ttl
    this.s3 = new AWS.S3(opts)
    this.got = got.extend({
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
        if ([403, 520].includes(reason.response.statusCode)) {
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
      this.s3
        .putObject({
          Key: `${key}.json`,
          Body: JSON.stringify(value, null, 2),
          ContentType: 'application/json',
          Bucket: this.Bucket,
          ACL: 'public-read',
          Expires,
          ...opts
        })
        .promise()
    )

    if (isRejected) throw reason
    return true
  }

  async delete (Key, opts) {
    const { isRejected, reason } = await pReflect(
      this.s3
        .deleteObject({
          Key,
          Bucket: this.Bucket,
          ...opts
        })
        .promise()
    )

    if (isRejected) throw reason

    return true
  }
}

module.exports = KeyvS3
