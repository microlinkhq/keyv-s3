'use strict'

const test = require('ava')

const { keyvB2, keyvS3 } = require('./util')

;[
  { keyv: keyvS3, provider: 'AWS S3' },
  { keyv: keyvB2, provider: 'Backblaze B2' }
].forEach(({ provider, keyv }) => {
  const cleanup = () => Promise.all([keyv.delete('foo')])

  test.before(cleanup)
  test.after.always(cleanup)

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
