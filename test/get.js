'use strict'

const delay = require('delay')
const test = require('ava')

const { keyvS3 } = require('./util')

;[{ keyv: keyvS3, provider: 'S3' }].forEach(({ provider, keyv }) => {
  test.serial.before(async () => {
    await Promise.all([
      keyv.delete('foo'),
      keyv.delete('foo2'),
      keyv.delete('foo3')
    ])
  })

  test(`${provider} » if key doesn't exist, returns undefined`, async t => {
    t.is(await keyv.get(Date.now()), undefined)
  })

  test(`${provider} » if key exists, returns the value`, async t => {
    const key = 'foo2'
    const value = 'bar2'
    const ttl = 5000

    await keyv.set(key, value, ttl)
    t.is(await keyv.get(key), value)
  })

  test(`${provider} » if key expires, returns undefined`, async t => {
    const ttl = 100
    await keyv.set('foo3', 'bar3', ttl)
    await delay(ttl)
    t.is(await keyv.get('foo3'), undefined)
  })
})
