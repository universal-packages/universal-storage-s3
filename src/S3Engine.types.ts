import { ObjectCannedACL } from '@aws-sdk/client-s3'

export interface S3EngineOptions {
  bucket: string
  accessKeyId?: string
  secretAccessKey?: string
  region?: string
  acl?: ObjectCannedACL
}
