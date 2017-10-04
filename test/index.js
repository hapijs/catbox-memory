'use strict';

// Load modules

const Catbox = require('catbox');
const Code = require('code');
const Hoek = require('hoek');
const Lab = require('lab');
const Memory = require('..');


// Declare internals

const internals = {};


// Test shortcuts

const { describe, it } = exports.lab = Lab.script();
const expect = Code.expect;


describe('Memory', () => {

    it('throws an error if not created with new', async () => {

        const fn = () => Memory();
        expect(fn).to.throw(Error);
    });

    it('creates a new connection', async () => {

        const client = new Catbox.Client(Memory);
        await client.start();
        expect(client.isReady()).to.equal(true);
    });

    it('closes the connection', async () => {

        const client = new Catbox.Client(Memory);
        await client.start();
        expect(client.isReady()).to.equal(true);
        client.stop();
        expect(client.isReady()).to.equal(false);
    });

    it('gets an item after setting it', async () => {

        const client = new Catbox.Client(Memory);
        await client.start();
        const key = { id: 'x', segment: 'test' };
        await client.set(key, '123', 500);
        const result = await client.get(key);
        expect(result.item).to.equal('123');
    });

    it('buffers can be set and retrieved when allowMixedContent is true', async () => {

        const buffer = new Buffer('string value');
        const client = new Catbox.Client(new Memory({ allowMixedContent: true }));

        await client.start();
        const key = { id: 'x', segment: 'test' };
        await client.set(key, buffer, 500);
        const result = await client.get(key);
        expect(result.item instanceof Buffer).to.equal(true);
        expect(result.item).to.equal(buffer);
    });

    it('buffers are copied before storing when allowMixedContent is true', async () => {

        const buffer = new Buffer('string value');
        const client = new Catbox.Client(new Memory({ allowMixedContent: true }));

        await client.start();
        const key = { id: 'x', segment: 'test' };
        await client.set(key, buffer, 500);
        const result = await client.get(key);
        expect(result.item).to.not.shallow.equal(buffer);
    });

    it('buffers are stringified when allowMixedContent is not true', async () => {

        const buffer = new Buffer('string value');
        const client = new Catbox.Client(new Memory());

        await client.start();
        const key = { id: 'x', segment: 'test' };
        await client.set(key, buffer, 500);
        const result = await client.get(key);
        expect(result.item instanceof Buffer).to.equal(false);
        expect(result.item).to.equal(JSON.parse(JSON.stringify(buffer)));
    });

    it('gets an item after setting it (no memory limit)', async () => {

        const client = new Catbox.Client(new Memory({ maxByteSize: 0 }));

        await client.start();
        const key = { id: 'x', segment: 'test' };
        await client.set(key, '123', 500);
        const result = await client.get(key);
        expect(result.item).to.equal('123');
        await client.set(key, '345', 500);
        const data = await client.get(key);
        expect(data.item).to.equal('345');
    });

    it('fails setting an item circular references', async () => {

        const client = new Catbox.Client(Memory);
        await client.start();

        const key = { id: 'x', segment: 'test' };
        const value = { a: 1 };

        value.b = value;
        await expect(client.set(key, value, 10)).to.reject('Converting circular structure to JSON');
    });

    it('fails setting an item with very long ttl', async () => {

        const client = new Catbox.Client(Memory);

        await client.start();

        const key = { id: 'x', segment: 'test' };
        await expect(client.set(key, '123', Math.pow(2, 31))).to.reject('Invalid ttl (greater than 2147483647)');
    });

    it('ignored starting a connection twice chained', async () => {

        const client = new Catbox.Client(Memory);
        await client.start();
        expect(client.isReady()).to.equal(true);
        await client.start();
        expect(client.isReady()).to.equal(true);
    });

    it('returns not found on get when using null key', async () => {

        const client = new Catbox.Client(Memory);
        await client.start();
        const result = await client.get(null);
        expect(result).to.equal(null);
    });

    it('returns not found on get when item expired', async () => {

        const client = new Catbox.Client(Memory);
        await client.start();
        const key = { id: 'x', segment: 'test' };
        await client.set(key, 'x', 1);
        await Hoek.wait(2);
        const result = await client.get(key);
        expect(result).to.equal(null);
    });

    it('errors on set when using null key', async () => {

        const client = new Catbox.Client(Memory);
        await client.start();
        await expect(client.set(null, {}, 1000)).to.reject();
    });

    it('errors on get when using invalid key', async () => {

        const client = new Catbox.Client(Memory);
        await client.start();
        await expect(client.get({})).to.reject();
    });

    it('errors on set when using invalid key', async () => {

        const client = new Catbox.Client(Memory);
        await client.start();
        await expect(client.set({}, {}, 1000)).to.reject();
    });

    it('ignores set when using non-positive ttl value', async () => {

        const client = new Catbox.Client(Memory);
        await client.start();
        const key = { id: 'x', segment: 'test' };
        await expect(client.set(key, 'y', 0)).to.not.reject();
    });

    it('errors on get when stopped', async () => {

        const client = new Catbox.Client(Memory);
        client.stop();
        const key = { id: 'x', segment: 'test' };
        await expect(client.connection.get(key)).to.reject();
    });

    it('errors on set when stopped', async () => {

        const client = new Catbox.Client(Memory);
        client.stop();
        const key = { id: 'x', segment: 'test' };
        await expect(client.connection.set(key, 'y', 1)).to.reject();
    });

    it('errors on missing segment name', async () => {

        const config = {
            expiresIn: 50000
        };

        const fn = () => {

            const client = new Catbox.Client(Memory);
            const cache = new Catbox.Policy(config, client, '');    // eslint-disable-line no-unused-vars
        };

        expect(fn).to.throw(Error);
    });

    it('errors on bad segment name', async () => {

        const config = {
            expiresIn: 50000
        };

        const fn = () => {

            const client = new Catbox.Client(Memory);
            const cache = new Catbox.Policy(config, client, 'a\u0000b');    // eslint-disable-line no-unused-vars
        };

        expect(fn).to.throw(Error);
    });

    describe('start()', () => {

        it('creates an empty cache object', async () => {

            const memory = new Memory();
            expect(memory.cache).to.not.exist();
            await memory.start();
            expect(memory.cache).to.exist();
        });
    });

    describe('stop()', () => {

        it('sets the cache object to null', async () => {

            const memory = new Memory();
            expect(memory.cache).to.not.exist();
            await memory.start();
            expect(memory.cache).to.exist();
            memory.stop();
            expect(memory.cache).to.not.exist();
        });
    });

    describe('get()', () => {

        it('errors on invalid json in cache', async () => {

            const key = {
                segment: 'test',
                id: 'test'
            };

            const memory = new Memory();
            expect(memory.cache).to.not.exist();

            await memory.start();

            expect(memory.cache).to.exist();
            await memory.set(key, 'myvalue', 10);

            expect(memory.cache[key.segment][key.id].item).to.equal('"myvalue"');
            memory.cache[key.segment][key.id].item = '"myvalue';
            await expect(memory.get(key)).to.reject('Bad value content');
        });

        it('returns not found on missing segment', async () => {

            const key = {
                segment: 'test',
                id: 'test'
            };

            const memory = new Memory();
            expect(memory.cache).to.not.exist();

            await memory.start();
            expect(memory.cache).to.exist();
            const result = await memory.get(key);
            expect(result).to.be.null();
        });
    });

    describe('set()', () => {

        it('adds an item to the cache object', async () => {

            const key = {
                segment: 'test',
                id: 'test'
            };

            const memory = new Memory();
            expect(memory.cache).to.not.exist();

            await memory.start();
            expect(memory.cache).to.exist();
            await memory.set(key, 'myvalue', 10);
            expect(memory.cache[key.segment][key.id].item).to.equal('"myvalue"');
        });

        it('returns null when item does not exist', async () => {

            const differentKeyInSameSegment = {
                segment: 'test',
                id: 'different'
            };

            const key = {
                segment: 'test',
                id: 'test'
            };

            const memory = new Memory();
            expect(memory.cache).to.not.exist();

            await memory.start();

            expect(memory.cache).to.exist();

            await memory.set(differentKeyInSameSegment, 'myvalue', 10);

            const result = await memory.get(key);

            expect(result).to.equal(null);
        });

        it('removes an item from the cache object when it expires', async () => {

            const key = {
                segment: 'test',
                id: 'test'
            };

            const memory = new Memory();
            expect(memory.cache).to.not.exist();

            await memory.start();

            expect(memory.cache).to.exist();
            await memory.set(key, 'myvalue', 10);

            expect(memory.cache[key.segment][key.id].item).to.equal('"myvalue"');
            await Hoek.wait(15);

            await memory.get(key);
        });

        it('errors when the maxByteSize has been reached', async () => {

            const key = {
                segment: 'test',
                id: 'test'
            };

            const memory = new Memory({ maxByteSize: 4 });
            expect(memory.cache).to.not.exist();

            await memory.start();

            expect(memory.cache).to.exist();
            await expect(memory.set(key, 'myvalue', 10)).to.reject();
        });

        it('increments the byte size when an item is inserted and errors when the limit is reached', async () => {

            const key1 = {
                segment: 'test',
                id: 'test'
            };

            const key2 = {
                segment: 'test',
                id: 'test2'
            };

            // maxByteSize is slightly larger than the first key so we are left with a small
            // amount of free space, but not enough for the second key to be created.
            const memory = new Memory({ maxByteSize: 200 });
            expect(memory.cache).to.not.exist();

            await memory.start();

            expect(memory.cache).to.exist();
            await memory.set(key1, 'my', 10);

            expect(memory.cache[key1.segment][key1.id].item).to.equal('"my"');

            await expect(memory.set(key2, 'myvalue', 10)).to.reject();
        });

        it('increments the byte size when an object is inserted', async () => {

            const key1 = {
                segment: 'test',
                id: 'test'
            };

            const itemToStore = {
                my: {
                    array: [1, 2, 3],
                    bool: true,
                    string: 'test'
                }
            };

            const memory = new Memory({ maxByteSize: 2000 });
            expect(memory.cache).to.not.exist();

            await memory.start();

            expect(memory.cache).to.exist();
            await memory.set(key1, itemToStore, 10);

            expect(memory.byteSize).to.equal(204);
            expect(memory.cache[key1.segment][key1.id].byteSize).to.equal(204);
            expect(memory.cache[key1.segment][key1.id].item).to.exist();
        });

        it('leaves the byte size unchanged when an object overrides existing key with same size', async () => {

            const key1 = {
                segment: 'test',
                id: 'test'
            };
            const itemToStore = {
                my: {
                    array: [1, 2, 3],
                    bool: true,
                    string: 'test'
                }
            };

            const memory = new Memory({ maxByteSize: 2000 });
            expect(memory.cache).to.not.exist();

            await memory.start();

            expect(memory.cache).to.exist();
            await memory.set(key1, itemToStore, 10);

            expect(memory.cache[key1.segment][key1.id].byteSize).to.equal(204);
            expect(memory.cache[key1.segment][key1.id].item).to.exist();
            await memory.set(key1, itemToStore, 10);

            expect(memory.cache[key1.segment][key1.id].byteSize).to.equal(204);
            expect(memory.cache[key1.segment][key1.id].item).to.exist();
        });
    });

    describe('drop()', () => {

        it('drops an existing item', async () => {

            const client = new Catbox.Client(Memory);
            await client.start();
            const key = { id: 'x', segment: 'test' };
            await client.set(key, '123', 500);
            const result = await client.get(key);
            expect(result.item).to.equal('123');
            await client.drop(key);
        });

        it('drops an item from a missing segment', async () => {

            const client = new Catbox.Client(Memory);
            await client.start();
            const key = { id: 'x', segment: 'test' };
            await client.drop(key);
        });

        it('drops a missing item', async () => {

            const client = new Catbox.Client(Memory);
            await client.start();
            const key = { id: 'x', segment: 'test' };
            await client.set(key, '123', 500);
            const result = await client.get(key);
            expect(result.item).to.equal('123');
            await client.drop({ id: 'y', segment: 'test' });
        });

        it('errors on drop when using invalid key', async () => {

            const client = new Catbox.Client(Memory);
            await client.start();
            await expect(client.drop({})).to.reject();
        });

        it('errors on drop when using null key', async () => {

            const client = new Catbox.Client(Memory);
            await client.start();
            await expect(client.drop(null)).to.reject();
        });

        it('errors on drop when stopped', async () => {

            const client = new Catbox.Client(Memory);
            client.stop();
            const key = { id: 'x', segment: 'test' };
            await expect(client.connection.drop(key)).to.reject();
        });

        it('errors when cache item dropped while stopped', async () => {

            const client = new Catbox.Client(Memory);
            client.stop();
            await expect(client.drop('a')).to.reject();
        });
    });

    describe('validateSegmentName()', () => {

        it('errors when the name is empty', async () => {

            const memory = new Memory();
            const result = memory.validateSegmentName('');

            expect(result).to.be.instanceOf(Error);
            expect(result.message).to.equal('Empty string');
        });

        it('errors when the name has a null character', async () => {

            const memory = new Memory();
            const result = memory.validateSegmentName('\u0000test');

            expect(result).to.be.instanceOf(Error);
        });

        it('returns null when there are no errors', async () => {

            const memory = new Memory();
            const result = memory.validateSegmentName('valid');

            expect(result).to.not.be.instanceOf(Error);
            expect(result).to.equal(null);
        });
    });
});
