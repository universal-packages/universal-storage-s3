import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { Storage } from '@universal-packages/storage'
import { S3Engine } from '../src'
import EventEmitter from 'events'

const stream = new EventEmitter()
const sendMock = jest.fn().mockImplementation((): any => ({ Body: stream }))

jest.mock('@aws-sdk/client-s3', (): any => ({
  S3Client: class {
    send: jest.Mock = sendMock
  },
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn()
}))

describe('Registry::S3Engine', (): void => {
  it('behaves as expected', async (): Promise<void> => {
    const engine = new S3Engine({ bucket: 'universal-development', acl: 'public-read' })
    const storage = new Storage({ engine })

    expect(storage).toMatchObject({ engine: expect.any(S3Engine) })

    const token = await storage.store({ data: Buffer.from('Hola'), filename: 'test.txt' })

    expect(PutObjectCommand).toHaveBeenCalledWith({
      ACL: 'public-read',
      Body: Buffer.from('Hola'),
      Bucket: 'universal-development',
      ContentDisposition: 'filename="test.txt"',
      ContentType: undefined,
      Key: token
    })

    const retrievePromise = storage.retrieve(token)

    setTimeout(() => stream.emit('end'), 100)

    await retrievePromise

    expect(GetObjectCommand).toHaveBeenCalledWith({
      Bucket: 'universal-development',
      Key: token
    })

    expect(await storage.retrieveStream(token)).toBe(stream)

    expect(storage.retrieveUri(token)).toBe(`https://universal-development.s3.amazonaws.com/${token}`)
  })
})
