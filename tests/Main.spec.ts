import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { Main } from '../wrappers/Main';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { KeyPair, mnemonicNew, mnemonicToPrivateKey } from '@ton/crypto';
import { send } from 'process';

async function randomKey(): Promise<KeyPair> {
    let mnemonics = await mnemonicNew();
    return mnemonicToPrivateKey(mnemonics);
}

describe('Main', () => {
    let code: Cell;
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let main: SandboxContract<Main>;
    let kp: KeyPair;
    let owner: SandboxContract<TreasuryContract>;

    beforeAll(async () => {
        code = await compile('Main');
    });

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        kp = await randomKey();
        owner = await blockchain.treasury('owner');

        main = blockchain.openContract(
            Main.createFromConfig(
                {
                    ownerAddress: owner.address,
                    publicKey: kp.publicKey,
                    seqno: 0,
                },
                code,
            ),
        );

        deployer = await blockchain.treasury('deployer');

        const deployResult = await main.sendDeploy(deployer.getSender(), toNano('0.5'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: main.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and main are ready to use
    });

    it('should accept deposit', async () => {
        const sender = await blockchain.treasury('sender');

        const depositResult = await main.sendDeploy(sender.getSender(), toNano('2'));

        expect(depositResult.transactions).toHaveTransaction({
            from: sender.address,
            to: main.address,
            success: true,
        });

        const balance = await main.getBalance();

        expect(balance).toBeGreaterThan(toNano('1.99'));
    });

    it('should not allow to withdraw in case of sender is not an owner', async () => {
        const sender = await blockchain.treasury('sender');

        await main.sendDeploy(sender.getSender(), toNano('2'));

        const withdrawResult = await main.sendWithdraw(sender.getSender(), {
            value: toNano(0.5),
            withdrawAmount: toNano('1'),
        });

        expect(withdrawResult.transactions).toHaveTransaction({
            from: sender.address,
            to: main.address,
            success: false,
            exitCode: 411,
        });
    });
});
