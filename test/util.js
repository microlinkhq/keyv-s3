const { S3Client } = require('@aws-sdk/client-s3')
const KeyvS3 = require('..')

const {
  S3_REGION,
  S3_BUCKET_NAME,
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY
} = process.env

const s3client = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY
  }
})

module.exports.keyvS3 = new KeyvS3({ namespace: S3_BUCKET_NAME, s3client })
