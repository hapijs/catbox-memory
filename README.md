catbox-memory
=============

Memory adapter for catbox

Lead Maintainer - [Colin Ihrig](https://github.com/cjihrig)

Current version: **1.0.x** [![Build Status](https://api.travis-ci.org/hapijs/catbox-memory.svg)](https://travis-ci.org/hapijs/catbox-memory)

### Options

- `maxByteSize` - sets an upper limit on the number of bytes that can be stored in the
  cached. Once this limit is reached no additional items will be added to the cache
  until some expire. The utilized memory calculation is a rough approximation and must
  not be relied on. Defaults to `104857600` (100MB).
