import type { S3Client } from '@aws-sdk/client-s3'
import type Got from 'got'

export interface KeyvS3Options {
  namespace: string
  hostname?: string
  ttl?: number
  gotOpts?: Got.Options
  s3client?: S3Client
  got?: Got
  maxAttempts?: number
  requestHandler?: {
    socketTimeout?: number
  }
  [key: string]: unknown
}

export interface PutObjectOptions {
  Key?: string
  Body?: string
  ContentType?: string
  Bucket?: string
  ACL?: string
  Expires?: Date
  [key: string]: unknown
}

export interface DeleteObjectOptions {
  Key?: string
  Bucket?: string
  [key: string]: unknown
}

export default class KeyvS3 {
  constructor (options: KeyvS3Options)
  filename (key: unknown): string
  fileUrl (filename: string): string
  get (key: unknown): Promise<unknown>
  set (key: unknown, value: unknown, ttl?: number, opts?: PutObjectOptions): Promise<boolean>
  delete (key: unknown, opts?: DeleteObjectOptions): Promise<boolean>
}

export { KeyvS3 as KeyvS3Class }
