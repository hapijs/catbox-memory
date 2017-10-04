'use strict';

// Load modules

const Hoek = require('hoek');


// Declare internals

const internals = {};


internals.defaults = {
    maxByteSize: 100 * 1024 * 1024,          // 100MB
    allowMixedContent: false
};


// Provides a named reference for memory debugging

internals.MemoryCacheSegment = function MemoryCacheSegment() { };


internals.MemoryCacheEntry = function MemoryCacheEntry(key, value, ttl, allowMixedContent) {

    let valueByteSize = 0;

    if (allowMixedContent && Buffer.isBuffer(value)) {
        this.item = new Buffer(value.length);
        // copy buffer to prevent value from changing while in the cache
        value.copy(this.item);
        valueByteSize = this.item.length;
    }
    else {
        // stringify() to prevent value from changing while in the cache
        this.item = JSON.stringify(value);
        valueByteSize = Buffer.byteLength(this.item);
    }

    this.stored = Date.now();
    this.ttl = ttl;
    this.timeout = this.stored + ttl;

    // Approximate cache entry size without value: 144 bytes
    this.byteSize = 144 + valueByteSize + Buffer.byteLength(key.segment) + Buffer.byteLength(key.id);

};


exports = module.exports = internals.Connection = function MemoryCache(options) {

    Hoek.assert(this.constructor === internals.Connection, 'Memory cache client must be instantiated using new');
    Hoek.assert(!options || options.maxByteSize === undefined || options.maxByteSize >= 0, 'Invalid cache maxByteSize value');
    Hoek.assert(!options || options.allowMixedContent === undefined || typeof options.allowMixedContent === 'boolean', 'Invalid allowMixedContent value');

    this.settings = Hoek.applyToDefaults(internals.defaults, options || {});
    this.cache = null;
};


internals.Connection.prototype.start = async function () {

    if (!this.cache) {
        this.cache = {};
        this.byteSize = 0;
    }
};


internals.Connection.prototype.stop = function () {

    this.cache = null;
    this.byteSize = 0;
};


internals.Connection.prototype.isReady = function () {

    return !!this.cache;
};


internals.Connection.prototype.validateSegmentName = function (name) {

    if (!name) {
        return new Error('Empty string');
    }

    if (name.indexOf('\u0000') !== -1) {
        return new Error('Includes null character');
    }

    return null;
};


internals.Connection.prototype.get = async function (key) {

    if (!this.cache) {
        throw new Error('Connection not started');
    }

    const segment = this.cache[key.segment];
    if (!segment) {
        return null;
    }

    const envelope = segment[key.id];

    if (!envelope) {
        return null;
    }

    if (Date.now() > envelope.timeout) {
        this.drop(key);
        return null;
    }

    let item = null;
    if (Buffer.isBuffer(envelope.item)) {
        item = envelope.item;
    }
    else {
        item = internals.parseJSON(envelope.item);
    }

    const result = {
        item,
        stored: envelope.stored,
        ttl: envelope.ttl
    };

    return result;
};


internals.Connection.prototype.set = async function (key, value, ttl) {

    if (!this.cache) {
        throw new Error('Connection not started');
    }

    if (ttl > 2147483647) {                                                         // Math.pow(2, 31)
        throw new Error('Invalid ttl (greater than 2147483647)');
    }

    const envelope = new internals.MemoryCacheEntry(key, value, ttl, this.settings.allowMixedContent);
    this.cache[key.segment] = this.cache[key.segment] || new internals.MemoryCacheSegment();
    const segment = this.cache[key.segment];
    const cachedItem = segment[key.id];

    if (cachedItem && Date.now() < cachedItem.timeout) {
        this.byteSize -= cachedItem.byteSize;                   // If the item existed, decrement the byteSize as the value could be different
    }

    if (this.settings.maxByteSize &&
        (this.byteSize + envelope.byteSize > this.settings.maxByteSize)) {

        throw new Error('Cache size limit reached');
    }

    segment[key.id] = envelope;
    this.byteSize += envelope.byteSize;
};


internals.Connection.prototype.drop = async function (key) {

    if (!this.cache) {
        throw new Error('Connection not started');
    }

    const segment = this.cache[key.segment];
    if (segment) {
        const item = segment[key.id];

        if (item) {
            this.byteSize -= item.byteSize;
        }

        delete segment[key.id];
    }
};


internals.parseJSON = function (json) {

    let obj = null;

    try {
        obj = JSON.parse(json);
    }
    catch (err) {
        throw new Error('Bad value content');
    }

    return obj;
};
