import { Address, toNano } from '@ton/core';
import { Main } from '../wrappers/Main';
import { compile, NetworkProvider } from '@ton/blueprint';
import { createKeys } from '../helper/keys';

export async function run(provider: NetworkProvider) {
    const main = provider.open(
        Main.createFromConfig(
            {
                seqno: 0,
                publicKey: (await createKeys()).publicKey,
                ownerAddress: provider.sender().address as Address,
            },
            await compile('Main'),
        ),
    );

    await main.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(main.address);

    // run methods on `main`
}
