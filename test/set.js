'use strict'

const delay = require('delay')
const test = require('ava')
const got = require('got')

const { keyvS3 } = require('./util')

;[{ keyv: keyvS3, provider: 'S3' }].forEach(({ provider, keyv }) => {
  test.serial.before(() =>
    Promise.all([keyv.delete('foo'), keyv.delete('fooz')])
  )

  test(`${provider} » set with expiration`, async t => {
    const key = 'foo'
    const ttl = 100

    t.is(await keyv.set(key, 'bar2', ttl), true)

    const fileUrl = keyv.fileUrl(keyv.filename(key))
    const { headers } = await got.head(fileUrl)

    t.is(!!headers.expires, true)

    await delay(ttl)

    t.is(await keyv.get(key), undefined)
  })

  test(`${provider} » set with no expiration`, async t => {
    const key = 'fooz'

    t.is(await keyv.set(key, 'bar2'), true)

    const fileUrl = keyv.fileUrl(keyv.filename(key))
    const { headers } = await got.head(fileUrl)

    t.is(!!headers.expires, false)
    t.is(await keyv.get(key), 'bar2')
  })
})
