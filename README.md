catbox-memory
=============

Memory adapter for catbox

Lead Maintainer - [Colin Ihrig](https://github.com/cjihrig)

Current version: [![Current Version](https://img.shields.io/npm/v/catbox-memory.svg)](https://www.npmjs.org/package/catbox-memory) [![Build Status](https://api.travis-ci.org/hapijs/catbox-memory.svg)](https://travis-ci.org/hapijs/catbox-memory)

### Options

- `maxByteSize` - sets an upper limit on the number of bytes that can be stored in the
  cache. Once this limit is reached no additional items will be added to the cache
  until some expire. The utilized memory calculation is a rough approximation and must
  not be relied on. Defaults to `104857600` (100MB).
- `allowMixedContent` - by default, all data is cached as JSON strings, and converted
  to an object using `JSON.parse()` on retrieval. By setting this option to `true`,
  `Buffer` data can be stored alongside the stringified data. `Buffer`s are not
  stringified, and are copied before storage to prevent the value from changing while
  in the cache. Defaults to `false`.
- `intervalTime` - sets in milliseconds how often the cache gets checked to see if any
  keys need to be expired. It will most likely not remove all expired keys in one
  interval as only a small amount of keys are checked. If the key is expired and is
  retrieved, it will not be returned by catbox as it is expired even if it still
  exists in memory.
- `numberOfKeysToCheck` - sets the sample size that will be checked. Any keys found
  to be expired in that sample will be deleted. If enough keys are found to be deleted
  then more keys will be checked.
- `continueRatio` - sets the percentage of keys in the sample size that need to be
  expired for the program to continue checking for more expired keys.
