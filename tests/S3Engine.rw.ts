import { Storage } from '@universal-packages/storage'
import fs from 'fs'
import { S3Engine } from '../src'

async function main(): Promise<void> {
  const engine = new S3Engine({
    bucket: 'capptis-development',
    acl: 'public-read',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  })
  const storage = new Storage({ engine })

  const key = await storage.store({ data: fs.readFileSync('./tests/__fixtures__/test.128.png'), name: 'test.txt' })

  console.log(key)

  await storage.storeVersion(key, { width: 64 })

  setTimeout(async () => {
    await storage.dispose(key)
  }, 10000)
}

main()
