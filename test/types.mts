import KeyvS3 from '../index.js'
import { S3Client } from '@aws-sdk/client-s3'
import type { DeleteObjectOptions, KeyvS3Class, KeyvS3Options, PutObjectOptions } from '../index.js'

const options: KeyvS3Options = {
  namespace: 'c.microlink.io',
  hostname: 'c.microlink.io',
  ttl: 60_000,
  s3client: new S3Client({ region: 'us-east-1' })
}
const putOptions: PutObjectOptions = { ACL: 'private' }
const deleteOptions: DeleteObjectOptions = { Bucket: 'c.microlink.io' }

const store: KeyvS3Class = new KeyvS3(options)
const url: string = store.fileUrl(store.filename('key'))
const stored: Promise<boolean> = store.set('key', { url }, 1000, putOptions)
const removed: Promise<boolean> = store.delete('key', deleteOptions)
const value: Promise<unknown> = store.get('key')

// @ts-expect-error module.exports is the class itself, it has no `default` property
console.log(KeyvS3.default, stored, removed, value)
