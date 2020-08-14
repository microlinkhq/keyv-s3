'use strict'

const delay = require('delay')
const test = require('ava')

const { keyvS3 } = require('./util')

test.serial.before(async () => {
  await Promise.all([
    keyvS3.delete('foo'),
    keyvS3.delete('foo2'),
    keyvS3.delete('foo3')
  ])
})

test("if key doesn't exist, returns undefined", async t => {
  t.is(await keyvS3.get('foo'), undefined)
})

test('if key exists, returns the value', async t => {
  await keyvS3.set('foo2', 'bar2')
  t.is((await keyvS3.get('foo2')).toString(), 'bar2')
})

test('if key expires, returns undefined', async t => {
  const ttl = 100
  await keyvS3.set('foo3', 'bar3', ttl)
  await delay(ttl)
  t.is(await keyvS3.get('foo3'), undefined)
})
