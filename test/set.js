'use strict'

const delay = require('delay')
const test = require('ava')
const got = require('got')

const keyvS3 = require('.')

test.serial.before(async () => {
  await keyvS3.delete('foo')
})

test('set with expiration', async t => {
  const key = 'foo'
  const ttl = 100

  t.is(await keyvS3.set(key, 'bar2', ttl), true)
  const { headers } = await got.head(keyvS3.fileUrl(key))

  t.is(!!headers.expires, true)

  await delay(ttl)
  t.is(await keyvS3.get(key), undefined)
})
