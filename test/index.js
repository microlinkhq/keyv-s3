const AWS = require('aws-sdk')

const KeyvS3 = require('..')

const {
  S3_BUCKET_NAME,
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,
  S3_ENDPOINT
} = process.env

module.exports = new KeyvS3({
  namespace: S3_BUCKET_NAME,
  endpoint: new AWS.Endpoint(S3_ENDPOINT),
  accessKeyId: S3_ACCESS_KEY_ID,
  secretAccessKey: S3_SECRET_ACCESS_KEY
})
