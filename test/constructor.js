'use strict'

const test = require('ava')
const got = require('got')

const KeyvS3 = require('..')

test('provide `got`', t => {
  const myGot = got.extend({ retry: 1 })
  myGot.foo = 'bar'

  const keyvS3 = new KeyvS3({ got: myGot })
  t.is(keyvS3.got.foo, 'bar')
})

test('provide `gotOpts`', t => {
  const gotOpts = { timeout: { request: 1000 } }
  const keyvS3 = new KeyvS3({ gotOpts })
  t.is(keyvS3.got.defaults.options.timeout.request, 1000)
})

test('mimic `gotOpts` with specific `s3client` options', t => {
  const gotOpts = {}
  const keyvS3 = new KeyvS3({
    gotOpts,
    maxAttempts: 3,
    requestHandler: {
      socketTimeout: 1000
    }
  })

  t.is(Object.keys(gotOpts).length, 0)
  t.is(keyvS3.got.defaults.options.retry.limit, 3)
  t.is(keyvS3.got.defaults.options.timeout.request, 1000)
})
