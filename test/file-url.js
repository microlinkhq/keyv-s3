'use strict'

const test = require('ava').default

const KeyvS3 = require('..')

const HOSTNAME = 'cache.example.com'

const legacyFileUrl = (filename, hostname = HOSTNAME) => {
  try {
    return new URL(filename, `https://${hostname}`).toString()
  } catch {
    return undefined
  }
}

const objectKeyOf = (fileUrl, hostname = HOSTNAME) => {
  if (fileUrl === undefined) return undefined
  const url = new URL(fileUrl)
  const base = new URL('./', `https://${hostname}`)
  if (url.origin !== base.origin) return undefined
  if (url.search !== '' || url.hash !== '') return undefined
  if (!url.pathname.startsWith(base.pathname)) return undefined
  try {
    return decodeURIComponent(url.pathname.slice(base.pathname.length))
  } catch {
    return undefined
  }
}

const createStubbedKeyv = (opts = {}) => {
  const requests = []
  const got = async url => {
    requests.push(url)
    return { statusCode: 200, headers: {}, body: 'value' }
  }
  const keyv = new KeyvS3({ namespace: HOSTNAME, got, ...opts })
  return { keyv, requests }
}

const createRandom = seed => () => {
  seed = (seed * 1103515245 + 12345) % 2147483648
  return seed / 2147483648
}

const randomKey = (random, alphabet) => {
  const length = 1 + Math.floor(random() * 12)
  let key = ''
  for (let index = 0; index < length; index++) {
    key += alphabet[Math.floor(random() * alphabet.length)]
  }
  return key
}

const ORDINARY_KEYS = [
  'foo',
  'foo2',
  'FOO_bar-baz.qux~1',
  'a/b/c',
  'a//b',
  'trailing/',
  'v1.2.3',
  '...',
  'user@host',
  "!$&'()*+,;=:@",
  'a b',
  'ünïcödé',
  '日本語/キー',
  '😀',
  'a"b<c>d`e{f}g',
  'curly{brace}',
  '1234567890'
]

test('ordinary keys map to the exact same URL as before', t => {
  const { keyv } = createStubbedKeyv()
  for (const key of ORDINARY_KEYS) {
    const filename = keyv.filename(key)
    t.is(objectKeyOf(legacyFileUrl(filename)), filename, key)
    t.is(keyv.fileUrl(filename), legacyFileUrl(filename), key)
  }
})

test('every key the old mapping resolved correctly keeps its URL', t => {
  const { keyv } = createStubbedKeyv()
  const alphabet = [
    ...'abcXYZ019-_.~/:@!$&\'()*+,;= "<>`{}',
    'ü',
    '😀',
    '%',
    '?',
    '#',
    '\\',
    '\t',
    '\n',
    '\u0000',
    '\u007f',
    '\ud800'
  ]
  const random = createRandom(42)
  let compatible = 0
  for (let iteration = 0; iteration < 20000; iteration++) {
    const filename = keyv.filename(randomKey(random, alphabet))
    const legacy = legacyFileUrl(filename)
    if (objectKeyOf(legacy) === filename) {
      compatible++
      t.is(keyv.fileUrl(filename), legacy, JSON.stringify(filename))
    }
  }
  t.true(compatible > 1000)
})

test('every key maps to its own object under the configured host', t => {
  const { keyv } = createStubbedKeyv()
  const alphabet = [...'ab./\\?#%:@ 2eE', '\t', '\n', '\u0000', 'ü', '😀']
  const random = createRandom(7)
  for (let iteration = 0; iteration < 20000; iteration++) {
    const filename = keyv.filename(randomKey(random, alphabet))
    const fileUrl = keyv.fileUrl(filename)
    t.is(new URL(fileUrl).href, fileUrl, JSON.stringify(filename))
    t.is(
      objectKeyOf(fileUrl),
      filename.toWellFormed(),
      JSON.stringify(filename)
    )
  }
})

test('a key cannot change the host', async t => {
  const { keyv, requests } = createStubbedKeyv()
  for (const key of [
    '//evil.com/p',
    '\\\\evil.com/p',
    '/\\evil.com/p',
    'https://evil.com/p',
    'http://evil.com/p',
    'javascript:alert(1)',
    'file:///etc/passwd'
  ]) {
    await keyv.get(key)
    const { hostname } = new URL(requests.pop())
    t.is(hostname, HOSTNAME, key)
  }
})

test('a key cannot add a query or fragment', async t => {
  const { keyv, requests } = createStubbedKeyv()
  await keyv.get('a?b')
  t.is(requests.pop(), `https://${HOSTNAME}/a%3Fb.json`)
  await keyv.get('a#b')
  t.is(requests.pop(), `https://${HOSTNAME}/a%23b.json`)
})

test('a key reads the object it was written to', async t => {
  const { keyv, requests } = createStubbedKeyv()
  const cases = [
    ['/foo', `https://${HOSTNAME}//foo.json`],
    ['a/../b', `https://${HOSTNAME}/a/..%2Fb.json`],
    ['./a', `https://${HOSTNAME}/.%2Fa.json`],
    ['../../x', `https://${HOSTNAME}/..%2F..%2Fx.json`],
    ['a%20b', `https://${HOSTNAME}/a%2520b.json`],
    ['a\\b', `https://${HOSTNAME}/a%5Cb.json`],
    ['a\tb', `https://${HOSTNAME}/a%09b.json`]
  ]
  for (const [key, expected] of cases) {
    await keyv.get(key)
    t.is(requests.pop(), expected, key)
  }
})

test('a key stays under the base path of the hostname', t => {
  for (const hostname of [
    'f000.backblazeb2.com/file/bucket/',
    'f000.backblazeb2.com/file/bucket',
    'localhost:9000/bucket/'
  ]) {
    const { keyv } = createStubbedKeyv({ hostname })
    t.is(
      keyv.fileUrl(keyv.filename('foo/bar')),
      legacyFileUrl('foo/bar.json', hostname),
      hostname
    )
    for (const key of ['../other/secret', '/other/secret', '//evil.com/x']) {
      const filename = keyv.filename(key)
      t.is(objectKeyOf(keyv.fileUrl(filename), hostname), filename, key)
    }
  }
})
