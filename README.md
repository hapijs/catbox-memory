catbox-memory
=============

Memory adapter for catbox

| Lead Maintainer  |
|:-:|
|[hueniverse](https://github.com/hueniverse)|
|![hueniverse](https://secure.gravatar.com/avatar/28d0cb94cd9afcc9763dd64fea80a187?s=128)|

### Options

- `maxByteSize` - sets an upper limit on the number of bytes that can be stored in the
  cached. Once this limit is reached no additional items will be added to the cache
  until some expire. The utilized memory calculation is a rough approximation and must
  not be relied on. Defaults to `104857600` (100MB).

