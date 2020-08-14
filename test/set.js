'use strict'

const delay = require('delay')
const test = require('ava')
const got = require('got')

const { fileUrl, keyvS3 } = require('./util')

test.serial.before(async () => {
  await keyvS3.delete('foo')
  await keyvS3.delete('foo2')
})

test('set with no expiration', async t => {
  const key = 'foo'
  t.is(await keyvS3.set(key, 'bar'), true)
  const { headers } = await got.head(fileUrl(key))
  t.is(headers.expires, undefined)
})

test('set with expiration', async t => {
  const key = 'foo2'
  const ttl = 100

  t.is(await keyvS3.set(key, 'bar2', ttl), true)
  const { headers } = await got.head(fileUrl(key))

  t.is(!!headers.expires, true)

  await delay(ttl)
  t.is(await keyvS3.get(key), undefined)
})
