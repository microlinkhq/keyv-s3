'use strict'

const delay = require('delay')
const test = require('ava')
const got = require('got')

const keyvS3 = require('./util')

test.serial.before(() =>
  Promise.all([keyvS3.delete('foo'), keyvS3.delete('fooz')])
)

test('set with expiration', async t => {
  const key = 'foo'
  const ttl = 100

  t.is(await keyvS3.set(key, 'bar2', ttl), true)
  const { headers } = await got.head(keyvS3.fileUrl(key))

  t.is(!!headers.expires, true)

  await delay(ttl)

  t.is(await keyvS3.get(key), undefined)
})

test('set with no expiration', async t => {
  const key = 'fooz'

  t.is(await keyvS3.set(key, 'bar2'), true)
  const { headers } = await got.head(keyvS3.fileUrl(key))

  t.is(!!headers.expires, false)
  t.is(await keyvS3.get(key), 'bar2')
})
