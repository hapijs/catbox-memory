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
  
### What to Use catbox-memory for and When to Use It

**catbox-memory** is a memory caching module for **catbox**.

**catbox** is a multi-strategy key-value object store. It allows a developer to more easily manage server side caching and storage rules.

However, **catbox** does not include an external memory cache. That's where **catbox-memory** comes in. **catbox-memory** can be used to cache objects to memory.

**catbox-memory** can be particularly helpful if you're trying to increase the efficiency of a legacy API system. The module can be used to cache the results of several API/database calls to memory, reducing bandwidth and server load and increasing the speed of an application.