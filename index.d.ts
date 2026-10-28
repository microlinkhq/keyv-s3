import type { S3Client } from '@aws-sdk/client-s3'
import type { Got, Options as GotOptions } from '@kikobeats/got'

declare namespace KeyvS3 {
  interface KeyvS3Options {
    namespace: string
    hostname?: string
    ttl?: number
    gotOpts?: GotOptions
    s3client?: S3Client
    got?: Got
    maxAttempts?: number
    requestHandler?: {
      socketTimeout?: number
    }
    [key: string]: unknown
  }

  interface PutObjectOptions {
    Key?: string
    Body?: string
    ContentType?: string
    Bucket?: string
    ACL?: string
    Expires?: Date
    [key: string]: unknown
  }

  interface DeleteObjectOptions {
    Key?: string
    Bucket?: string
    [key: string]: unknown
  }

  type KeyvS3Class = KeyvS3
}

declare class KeyvS3 {
  constructor (options: KeyvS3.KeyvS3Options)
  filename (key: unknown): string
  fileUrl (filename: string): string
  get (key: unknown): Promise<unknown>
  set (key: unknown, value: unknown, ttl?: number, opts?: KeyvS3.PutObjectOptions): Promise<boolean>
  delete (key: unknown, opts?: KeyvS3.DeleteObjectOptions): Promise<boolean>
}

export = KeyvS3
