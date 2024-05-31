import { Client } from '@hapi/catbox';
import { Engine as CatboxMemory } from '..';

type MyValue = {
    a: string;
    b: number;
};

const client = new CatboxMemory<boolean>({
    cloneBuffersOnGet: false,
    maxByteSize: 1024,
    minCleanupIntervalMsec: 1000,
});

const client2 = new CatboxMemory<MyValue>();

const catboxMemoryOptions: CatboxMemory.Options = {
    cloneBuffersOnGet: false,
    maxByteSize: 1024,
    minCleanupIntervalMsec: 1000,
};

const client3 = new Client<string>(CatboxMemory, catboxMemoryOptions);

(async () => {

    const x = await client.get({
        id: 'x',
        segment: 's',
    })

    x?.item === true;

    const y = await client2.get({
        id: 'y',
        segment: 's',
    })

    y?.item.a === 'a';
    y?.item.b === 1;

    const z = await client3.get({
        id: 'z',
        segment: 's',
    });

    z?.item === 'z';
})()