import { crc32 } from "zlib";

export const Opcode = {
    selfdestruct: crc32("selfdestruct"),
    deposit: crc32("deposit"),
    withdrawFunds: crc32("withdraw_funds"),
    changeOwner: crc32("change_owner"),
    transferMsgToOwner: crc32("transfer_msg_to_owner"),
}