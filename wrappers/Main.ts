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

    async sendChangeOwner(provider: ContractProvider, via: Sender, opts: { value: bigint; newOwner: Address }) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(Opcode.changeOwner, 32).storeAddress(opts.newOwner).endCell(),
        });
    }

    async sendExternalMessage(
        provider: ContractProvider,
        opts: {
            opCode: number;
            seqno: number;
            signFunc: (buf: Buffer) => Buffer;
        },
    ) {
        const messageToSign = beginCell().storeUint(opts.seqno, 32).storeUint(opts.opCode, 32).endCell();

        const signature = opts.signFunc(messageToSign.hash());

        await provider.external(beginCell().storeBuffer(signature).storeSlice(messageToSign.asSlice()).endCell());
    }

    async getBalance(provider: ContractProvider): Promise<bigint> {
        const result = await provider.get('get_smc_balance', []);
        return result.stack.readBigNumber();
    }

    async getSeqno(provider: ContractProvider): Promise<number> {
        const result = await provider.get('get_seqno', []);
        return result.stack.readNumber();
    }
}
