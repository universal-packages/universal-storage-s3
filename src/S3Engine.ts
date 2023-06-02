import { DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { RequestPresigningArguments } from '@aws-sdk/types'
import { BlobDescriptor, EngineInterface } from '@universal-packages/storage'
import { IncomingMessage } from 'http'

import { S3EngineOptions } from './S3Engine.types'

export default class S3Engine implements EngineInterface {
  public readonly options: S3EngineOptions

  private readonly client: S3Client

  public constructor(options: S3EngineOptions) {
    this.options = { region: 'us-east-1', ...options }

    this.client = new S3Client({
      region: this.options.region,
      credentials: {
        accessKeyId: this.options.accessKeyId,
        secretAccessKey: this.options.secretAccessKey
      }
    })
  }

  public async store<PutObjectCommandInput>(key: string, descriptor: BlobDescriptor, options: PutObjectCommandInput): Promise<void> {
    const command = new PutObjectCommand({
      ACL: this.options.acl,
      ...options,
      Bucket: this.options.bucket,
      Key: key,
      ContentType: descriptor.mimetype,
      ContentDisposition: `filename="${descriptor.name}"`,
      Body: descriptor.data
    })

    await this.client.send(command)
  }

  public async retrieve(key: string): Promise<Buffer> {
    const stream = await this.retrieveStream(key)

    return new Promise((resolve, reject): void => {
      const chunks: Buffer[] = []

      stream.on('data', (chunk: Buffer): void => {
        chunks.push(chunk)
      })

      stream.on('end', (): void => {
        resolve(Buffer.concat(chunks))
      })

      stream.on('error', (error: Error): void => {
        reject(error)
      })
    })
  }

  public async retrieveStream<S = IncomingMessage>(key: string): Promise<S> {
    const command = new GetObjectCommand({ Bucket: this.options.bucket, Key: key })
    const { Body } = await this.client.send(command)
    return Body as any
  }

  public async retrieveUri(key: string, options?: RequestPresigningArguments): Promise<string> {
    if (options) {
      const command = new GetObjectCommand({ Bucket: this.options.bucket, Key: key })
      return await getSignedUrl(this.client, command, options)
    } else {
      return `https://${this.options.bucket}.s3.amazonaws.com/${key}`
    }
  }

  public async dispose(key: string): Promise<void> {
    const command = new DeleteObjectCommand({ Bucket: this.options.bucket, Key: key })
    await this.client.send(command)
  }

  public async disposeDirectory(key: string): Promise<void> {
    const listCommand = new ListObjectsV2Command({ Bucket: this.options.bucket, Prefix: key })
    const { Contents } = await this.client.send(listCommand)

    if (Contents) {
      const deleteListCommand = new DeleteObjectsCommand({ Bucket: this.options.bucket, Delete: { Objects: Contents.map(({ Key }) => ({ Key })) } })
      await this.client.send(deleteListCommand)
    }

    const deleteCommand = new DeleteObjectCommand({ Bucket: this.options.bucket, Key: key })
    await this.client.send(deleteCommand)
  }
}
