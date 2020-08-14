'use strict'

const addMilliseconds = require('date-fns/addMilliseconds')
const getTime = require('date-fns/getTime')
const pReflect = require('p-reflect')
const EventEmitter = require('events')
const AWS = require('aws-sdk')

class KeyvRedis extends EventEmitter {
  constructor (opts) {
    super()
    this.Bucket = opts.bucket
    this.s3 = new AWS.S3(opts)
  }

  async get (Key, opts) {
    const { value, reason, isRejected } = await pReflect(
      this.s3
        .getObject({
          Key,
          Bucket: this.Bucket,
          ...opts
        })
        .promise()
    )

    if (isRejected) {
      if (reason.code === 'NoSuchKey') return undefined
      throw reason
    }

    if (!value.Expires) return value.Body
    const isExpired = getTime(value.LastModified) > getTime(value.Expires)
    return isExpired ? undefined : value.Body
  }

  async set (Key, Body, ttl, opts) {
    const Expires = ttl ? addMilliseconds(new Date(), ttl) : undefined
    const { reason, isRejected } = await pReflect(
      this.s3
        .putObject({
          Key,
          Body,
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

module.exports = KeyvRedis
