const KeyvS3 = require('..')

const { S3_BUCKET_NAME, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env

module.exports = new KeyvS3({
  region: 'us-east-1',
  namespace: S3_BUCKET_NAME,
  accessKeyId: S3_ACCESS_KEY_ID,
  secretAccessKey: S3_SECRET_ACCESS_KEY
})
