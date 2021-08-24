'use strict'

const delay = require('delay')
const test = require('ava')

const keyvS3 = require('./util')

test.serial.before(async () => {
  await Promise.all([
    keyvS3.delete('foo'),
    keyvS3.delete('foo2'),
    keyvS3.delete('foo3')
  ])
})

test("if key doesn't exist, returns undefined", async t => {
  t.is(await keyvS3.get(Date.now()), undefined)
})

test('if key exists, returns the value', async t => {
  const key = 'foo2'
  const value = 'bar2'
  const ttl = 5000

  await keyvS3.set(key, value, ttl)
  t.is(await keyvS3.get(key), value)
})

test('if key expires, returns undefined', async t => {
  const ttl = 100
  await keyvS3.set('foo3', 'bar3', ttl)
  await delay(ttl)
  t.is(await keyvS3.get('foo3'), undefined)
})
