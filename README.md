<div align="center">
  <img src="https://cdn.microlink.io/logo/banner.png"">
</div>

![Last version](https://img.shields.io/github/tag/microlinkhq/keyv-s3.svg?style=flat-square)
[![Build Status](https://img.shields.io/travis/com/microlinkhq/keyv-s3/master.svg?style=flat-square)](https://travis-ci.com/microlinkhq/keyv-s3)
[![Coverage Status](https://img.shields.io/coveralls/microlinkhq/keyv-s3.svg?style=flat-square)](https://coveralls.io/github/microlinkhq/keyv-s3)
[![Dependency status](https://img.shields.io/david/microlinkhq/keyv-s3.svg?style=flat-square)](https://david-dm.org/microlinkhq/keyv-s3)
[![Dev Dependencies Status](https://img.shields.io/david/dev/microlinkhq/keyv-s3.svg?style=flat-square)](https://david-dm.org/microlinkhq/keyv-s3#info=devDependencies)
[![NPM Status](https://img.shields.io/npm/dm/keyv-s3.svg?style=flat-square)](https://www.npmjs.org/package/keyv-s3)

> [Amazon S3](https://aws.amazon.com/s3) storage adapter for [Keyv](https://github.com/lukechilds/keyv).

## Motivation

[Microlink API](https://microlink.io/api) has a built-in cache layer for speed up consecutive API calls, caching the response based in a configurable [ttl](https://microlink.io/docs/api/parameters/ttl). You can read more about how it works in our [blog post](https://microlink.io/blog/edge-cdn/).

Until now, we delegate into [Redis](https://github.com/lukechilds/keyv-redis) for serving the cache layer because it's fast; However, it's also expensive when you have a certain size.

The service is serving [+5M API calls per month](http://analytics.microlink.io), where every request is creating a cache entry; That means running out of space could be done relatively fast.

We wanted a cache layer that met the following premises:

- Infinite space.
- Failover tolerant.
- Cheap at scale.

Knowing what we wanted, and keeping in mind [Microlink API](https://microlink.io/api) response payload is JSON, we found [Amazon S3](https://aws.amazon.com/s3) bucket excellent storage.

## Install

```bash
$ npm install aws-sdk keyv-s3 --save
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

## License

**keyv-s3** © [microlink.io](https://microlink.io), released under the [MIT](https://github.com/microlinkhq/keyv-s3/blob/master/LICENSE.md) License.<br>
Authored and maintained by [microlink.io](https://microlink.io) with help from [contributors](https://github.com/microlinkhq/keyv-s3/contributors).

> [microlink.io](https://microlink.io) · GitHub [microlink.io](https://github.com/microlinkhq) · Twitter [@microlinkhq](https://twitter.com/microlinkhq)
