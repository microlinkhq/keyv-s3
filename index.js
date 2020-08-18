'use strict'

const { addMilliseconds } = require('date-fns')
const getTime = require('date-fns/getTime')
const pReflect = require('p-reflect')
const EventEmitter = require('events')
const AWS = require('aws-sdk')
const got = require('got')

class KeyvS3 extends EventEmitter {
  constructor ({ namespace, ttl, ...opts }) {
    super()
    this.Bucket = namespace
    this.ttl = ttl
    this.s3 = new AWS.S3(opts)
  }

  fileUrl (key) {
    return new URL(`${key}.json`, `https://${this.Bucket}`).toString()
  }

  async get (key) {
    const { value, reason, isRejected } = await pReflect(
      got(this.fileUrl(key), {
        responseType: 'json'
      })
    )

    if (isRejected) {
      if (reason.response.statusCode === 403) return undefined
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
