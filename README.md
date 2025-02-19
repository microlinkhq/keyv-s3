<div align="center">
  <img src="https://github.com/microlinkhq/cdn/raw/master/dist/logo/banner.png#gh-light-mode-only" alt="microlink logo">
  <img src="https://github.com/microlinkhq/cdn/raw/master/dist/logo/banner-dark.png#gh-dark-mode-only" alt="microlink logo">
  <br>
  <br>
</div>

![Last version](https://img.shields.io/github/tag/microlinkhq/keyv-s3.svg?style=flat-square)
[![Coverage Status](https://img.shields.io/coveralls/microlinkhq/keyv-s3.svg?style=flat-square)](https://coveralls.io/github/microlinkhq/keyv-s3)
[![NPM Status](https://img.shields.io/npm/dm/keyv-s3.svg?style=flat-square)](https://www.npmjs.org/package/keyv-s3)

> [Amazon S3](https://aws.amazon.com/s3) storage adapter for [Keyv](https://github.com/lukechilds/keyv).

## Motivation

[Microlink API](https://microlink.io/api) has a built-in cache layer for speed up consecutive API calls, caching the response based in a configurable [ttl](https://microlink.io/docs/api/parameters/ttl). You can read more about how it works in our [blog post](https://microlink.io/blog/edge-cdn/).

Until now, we delegate into [Redis](https://github.com/lukechilds/keyv-redis) for serving the cache layer because it's fast; However, it's also expensive when you have a certain size.

The service is serving [more than 8 millions API calls per month](http://analytics.microlink.io), where every request is creating a cache entry; That means running out of space could be done relatively fast.

We wanted a cache layer that met the following premises:

- Infinite space.
- Failover tolerant.
- Cheap at scale.

Knowing what we wanted, and keeping in mind [Microlink API](https://microlink.io/api) response payload is JSON, we found [Amazon S3](https://aws.amazon.com/s3) bucket excellent storage.

## Install

```bash
$ npm install @aws-sdk/client-s3 keyv-s3 --save
```

## Usage

First, you need to create a S3 bucket to be used as you cache layer

![](https://i.imgur.com/YkslBcd.png)

You need to setup a properly bucket name to be possible access via HTTP.

For doing that, we setup a CNAME over the bucket name, in our case we use [CloudFlare](https://www.cloudflare.com).

![](https://i.imgur.com/GpCxX1G.png)

That's a necessary step because querying via S3 API is slower than query directly to the bucket.

Also, CloudFlare gives us an extra perfomance boost since it's on top of the Bucket domain associated, caching successive calls and save your S3 quota.

In case you are using CloudFlare as well, we have the following page rule associated:

![](https://i.imgur.com/dANGotv.png)

Now you can connect with your S3 caching layer from code:

```js
const KeyvS3 = require('keyv-s3')

const keyvS3 = new KeyvS3({
  region: 'us-east-1',
  namespace: 'c.microlink.io',
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
})
```

You can interact with `keyvS3` using [keyv instance methods](https://keyv.js.org).

## Backblaze B2 support

For using [Backblaze B2](https://www.backblaze.com/b2/cloud-storage.html) as provider, you have to provide `s3client` with Blackbaze B2 endpoint.

Also, since Backblaze B2 buckets name doesn't allow a dot, you should to specify the `hostname` to be used for mapping the bucket:

```js
const keyvS3 = new KeyvS3({
  region: 'us-east-1',
  namespace: 'c-microlink-io',
  hostname: 'c.microlink.io',
  s3client: new S3Client({
    region: process.env.B2_REGION,
    endpoint: `https://s3.${process.env.B2_REGION}.backblazeb2.com`,
    credentials: {
      accessKeyId: process.env.B2_ACCESS_KEY_ID,
      secretAccessKey: process.env.B2_SECRET_ACCESS_KEY
    }
  })
})
```

## License

**keyv-s3** © [microlink.io](https://microlink.io), released under the [MIT](https://github.com/microlinkhq/keyv-s3/blob/master/LICENSE.md) License.<br>
Authored and maintained by [Kiko Beats](https://kikobeats.com) with help from [contributors](https://github.com/microlinkhq/keyv-s3/contributors).

> [microlink.io](https://microlink.io) · GitHub [microlink.io](https://github.com/microlinkhq) · X [@microlinkhq](https://x.com/microlinkhq)
