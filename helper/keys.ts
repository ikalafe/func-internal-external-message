import { KeyPair, mnemonicToPrivateKey } from '@ton/crypto';
import { mnemonic } from './config/mnemonics';

export async function createKeys(): Promise<KeyPair> {
    let worlds = mnemonic.split(' ');
    return mnemonicToPrivateKey(worlds);
}
