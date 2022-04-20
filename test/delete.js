'use strict'

const test = require('ava')

const { keyvS3 } = require('./util')

;[{ keyv: keyvS3, provider: 'S3' }].forEach(({ provider, keyv }) => {
  test.serial.before(async () => {
    await Promise.all([keyv.delete('foo')])
  })

  test(`${provider} » if key exists, returns true`, async t => {
    await keyv.set('foo', 'bar', 100)
    t.is(await keyv.delete('foo'), true)
  })

  // this tests is skipped `DeleteObjectCommand` doesn't return
  // information related with file presence and check for a file
  // before delete it is expensive
  test.skip(`${provider} » if key don't exist, returns false`, async t => {
    t.is(await keyv.delete('notexistkey'), false)
  })
})
