import { DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Storage } from '@universal-packages/storage'
import EventEmitter from 'events'

import { S3Engine } from '../src'

const stream = new EventEmitter()
const sendMock = jest.fn().mockImplementation((): any => ({ Body: stream }))

jest.mock('@aws-sdk/client-s3', (): any => ({
  S3Client: class {
    send: jest.Mock = sendMock
  },
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
  ListObjectsV2Command: jest.fn()
}))
jest.mock('@aws-sdk/s3-request-presigner')

describe('Storage::S3Engine', (): void => {
  it('behaves as expected', async (): Promise<void> => {
    const engine = new S3Engine({ bucket: 'universal-development', acl: 'public-read' })
    const storage = new Storage({ engine })

    expect(storage).toMatchObject({ engine: expect.any(S3Engine) })

    const key = await storage.store({ data: Buffer.from('Hola'), name: 'test.txt' })

    expect(PutObjectCommand).toHaveBeenCalledWith({
      ACL: 'public-read',
      Body: Buffer.from('Hola'),
      Bucket: 'universal-development',
      ContentDisposition: 'filename="test.txt"',
      ContentType: undefined,
      Key: key
    })

    const retrievePromise = storage.retrieve(key)

    setTimeout(() => stream.emit('end'), 100)

    await retrievePromise

    expect(GetObjectCommand).toHaveBeenCalledWith({
      Bucket: 'universal-development',
      Key: key
    })

    expect(await storage.retrieveStream(key)).toBe(stream)

    expect(await storage.retrieveUri(key)).toBe(`https://universal-development.s3.amazonaws.com/${key}`)

    await storage.dispose(key)

    expect(ListObjectsV2Command).toHaveBeenCalledWith({
      Bucket: 'universal-development',
      Prefix: `${key}-V`
    })

    expect(DeleteObjectCommand).toHaveBeenCalledWith({
      Bucket: 'universal-development',
      Key: key
    })

    await storage.retrieveUri(key, { expiresIn: 100 })

    expect(GetObjectCommand).toHaveBeenCalledWith({
      Bucket: 'universal-development',
      Key: key
    })
    expect(getSignedUrl).toHaveBeenCalledWith(expect.any(S3Client), expect.any(GetObjectCommand), { expiresIn: 100 })
  })
})
