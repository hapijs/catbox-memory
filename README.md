<a href="http://hapijs.com"><img src="https://raw.githubusercontent.com/hapijs/assets/master/images/family.png" width="180px" align="right" /></a>

# @hapi/catbox-memory

Memory adapter for [catbox](https://github.com/hapijs/catbox).
This adapter is not designed to share a common cache between multiple processes (e.g. in a cluster
mode). It uses a single interval timeout to look for expired records and clean them from memory.

[![Build Status](https://api.travis-ci.org/hapijs/catbox-memory.svg)](https://travis-ci.org/hapijs/catbox-memory)
