import type { S3ClientConfig } from '@aws-sdk/client-s3'
import type { Got } from 'got'

export interface KeyvS3Options {
  namespace?: string
  hostname?: string
  ttl?: number
  gotOpts?: Record<string, unknown>
  s3client?: S3Client
  got?: Got
  maxAttempts?: number
  requestHandler?: {
    socketTimeout?: number
  }
  [key: string]: unknown
}

export interface KeyvS3 {
  new (options?: KeyvS3Options): KeyvS3Instance
}

export interface KeyvS3Instance {
  Bucket: string
  ttl?: number
  hostname: string
  filename(key: string | number): string
  fileUrl(filename: string): string
  get(key: string | number): Promise<unknown>
  set(key: string | number, value: unknown, ttl?: number, opts?: Record<string, unknown>): Promise<boolean>
  delete(key: string | number, opts?: Record<string, unknown>): Promise<boolean>
}

export default KeyvS3
