const { S3Client } = require('@aws-sdk/client-s3')
const KeyvS3 = require('..')

const {
  S3_REGION,
  S3_BUCKET_NAME,
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,
  B2_BUCKET_NAME,
  B2_BUCKET_HOSTNAME,
  B2_REGION,
  B2_SECRET_ACCESS_KEY,
  B2_ACCESS_KEY_ID
} = process.env

module.exports.keyvS3 = new KeyvS3({
  namespace: S3_BUCKET_NAME,
  s3client: new S3Client({
    region: S3_REGION,
    credentials: {
      accessKeyId: S3_ACCESS_KEY_ID,
      secretAccessKey: S3_SECRET_ACCESS_KEY
    }
  })
})

module.exports.keyvB2 = new KeyvS3({
  namespace: B2_BUCKET_NAME,
  hostname: B2_BUCKET_HOSTNAME,
  s3client: new S3Client({
    region: B2_REGION,
    endpoint: `https://s3.${B2_REGION}.backblazeb2.com`,
    credentials: {
      accessKeyId: B2_ACCESS_KEY_ID,
      secretAccessKey: B2_SECRET_ACCESS_KEY
    }
  })
})
