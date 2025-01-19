import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/ton';
import { Opcode } from '../helper/Opcode';

export type MainConfig = {
    seqno: number;
    publicKey: Buffer;
    ownerAddress: Address;
};

export function mainConfigToCell(config: MainConfig): Cell {
    return beginCell()
        .storeUint(config.seqno, 32)
        .storeBuffer(config.publicKey)
        .storeAddress(config.ownerAddress)
        .endCell();
}

export class Main implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromAddress(address: Address) {
        return new Main(address);
    }

    static createFromConfig(config: MainConfig, code: Cell, workchain = 0) {
        const data = mainConfigToCell(config);
        const init = { code, data };
        return new Main(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendDeposit(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(Opcode.deposit, 32).endCell(),
        });
    }

    async getBalance(provider: ContractProvider): Promise<bigint> {
        const result = provider.get('get_smc_balance', []);
        return (await result).stack.readBigNumber();
    }

    async sendWithdraw(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            withdrawAmount: bigint;
        },
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(Opcode.withdrawFunds, 32).storeCoins(opts.withdrawAmount).endCell(),
        });
    }
}
