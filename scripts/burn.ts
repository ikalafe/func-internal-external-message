import { NetworkProvider } from '@ton/blueprint';
import { Address } from '@ton/core';
import { Main } from '../wrappers/Main';
import { Opcode } from '../helper/Opcode';
import { createKeys } from '../helper/keys';
import { sign } from '@ton/crypto';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = await Address.parse(args.length > 0 ? args[0] : await ui.input('Contract Address'));

    const main = provider.open(Main.createFromAddress(address));

    const seqno = await main.getSeqno();
    const keyPair = await createKeys();

    await main.sendExternalMessage({
        opCode: Opcode.selfdestruct,
        signFunc: (buf) => sign(buf, keyPair.secretKey),
        seqno: seqno,
    });

    ui.write('Successfully Burned ✅')
}
