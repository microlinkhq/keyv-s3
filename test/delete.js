'use strict'

const test = require('ava')

const { keyvS3 } = require('./util')

test.serial.before(async () => {
  await Promise.all([keyvS3.delete('foo')])
})

test('if key exists, returns true', async t => {
  await keyvS3.set('foo', 'bar')
  t.is(await keyvS3.delete('foo'), true)
})

test.skip("if key don't exist, returns false", async t => {
  t.is(await keyvS3.delete('notexistkey'), false)
})
