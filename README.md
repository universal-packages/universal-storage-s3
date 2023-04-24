# Storage S3

[![npm version](https://badge.fury.io/js/@universal-packages%2Fstorage-s3.svg)](https://www.npmjs.com/package/@universal-packages/storage-s3)
[![Testing](https://github.com/universal-packages/universal-storage-s3/actions/workflows/testing.yml/badge.svg)](https://github.com/universal-packages/universal-storage-s3/actions/workflows/testing.yml)
[![codecov](https://codecov.io/gh/universal-packages/universal-storage-s3/branch/main/graph/badge.svg?token=CXPJSN8IGL)](https://codecov.io/gh/universal-packages/universal-storage-s3)

S3 engine for [universal-storage](https://github.com/universal-packages/universal-storage).

## Install

```shell
npm install @universal-packages/storage-s3

npm install @universal-packages/storage
```

## S3Engine

Just pass this engine to the registry to enable it to use ready as the storage engine.

```js
import { Storage } from '@universal-packages/universal-storage'
import { S3Engine } from '@universal-packages/universal-storage-s3'

const storage = new Storage({ engine: 's3', engineOptions: { region: 'us-east-1' } })

await registry.initialize()
```

### Options

- **`region`** ` String``String ` `Default: 'us-east-1'`
  AWS region to use.
- **`bucket`** `String`
  AWS bucket to use.
- **`accessKeyId`** `String` `Optional`
  AWS access key id.
- **`secretAccessKey`** `String` `Optional`
  AWS secret access key.
- **`acl`** `String` `Optional`
  AWS default ACL to use with every upload.

## Typescript

This library is developed in TypeScript and shipped fully typed.

## Contributing

The development of this library happens in the open on GitHub, and we are grateful to the community for contributing bugfixes and improvements. Read below to learn how you can take part in improving this library.

- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Contributing Guide](./CONTRIBUTING.md)

### License

[MIT licensed](./LICENSE).
