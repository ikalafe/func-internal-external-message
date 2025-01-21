import { NetworkProvider } from '@ton/blueprint';
import { Address, toNano } from '@ton/core';
import { Main } from '../wrappers/Main';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('Contract Address'));

    const main = provider.open(Main.createFromAddress(address));

    await main.sendWithdraw(provider.sender(), { value: toNano('0.5'), withdrawAmount: toNano('5') });

    ui.write('Successfully Withdrawed ✅');
}