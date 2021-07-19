'use strict'

const test = require('ava')

const keyvS3 = require('.')

test.serial.before(async () => {
  await keyvS3.delete('foo')
})

test('do nothing', async t => {
  t.is(await keyvS3.clear(), undefined)
})
