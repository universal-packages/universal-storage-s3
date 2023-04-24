import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { BlobDescriptor, EngineInterface } from '@universal-packages/storage'
import { S3EngineOptions } from './S3Engine.types'
import { IncomingMessage } from 'http'

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

  public async store<PutObjectCommandInput>(token: string, descriptor: BlobDescriptor, options: PutObjectCommandInput): Promise<void> {
    const command = new PutObjectCommand({
      ACL: this.options.acl,
      ...options,
      Bucket: this.options.bucket,
      Key: token,
      ContentType: descriptor.mimetype,
      ContentDisposition: `filename="${descriptor.filename}"`,
      Body: descriptor.data
    })

    await this.client.send(command)
  }

  public async retrieve(token: string): Promise<Buffer> {
    const stream = await this.retrieveStream(token)

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

  public async retrieveStream<S = IncomingMessage>(token: string): Promise<S> {
    const command = new GetObjectCommand({ Bucket: this.options.bucket, Key: token })
    const { Body } = await this.client.send(command)
    return Body as any
  }

  public retrieveUri(token: string): string {
    return `https://${this.options.bucket}.s3.amazonaws.com/${token}`
  }

  public async dispose(token: string): Promise<void> {
    const command = new DeleteObjectCommand({ Bucket: this.options.bucket, Key: token })
    await this.client.send(command)
  }
}
