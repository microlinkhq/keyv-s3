'use strict'

const delay = require('delay')
const test = require('ava')

const { keyvB2, keyvS3 } = require('./util')

;[
  { keyv: keyvS3, provider: 'AWS S3' },
  { keyv: keyvB2, provider: 'Backblaze B2' }
].forEach(({ provider, keyv }) => {
  const cleanup = () =>
    Promise.all([keyv.delete('foo'), keyv.delete('foo2'), keyv.delete('foo3')])

  test.before(cleanup)
  test.after.always(cleanup)

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
