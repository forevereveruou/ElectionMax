import { ethers } from "ethers";
import { GenericStringStorage } from "./GenericStringStorage";

export type EIP712 = {
  domain: any;
  types: { UserDecryptRequestVerification: any[] };
  message: any;
  primaryType: string;
};

export type FhevmInstance = {
  createEIP712: (
    publicKey: string,
    contracts: string[],
    start: number,
    durationDays: number
  ) => EIP712;
  generateKeypair: () => { publicKey: string; privateKey: string };
};

export class FhevmDecryptionSignature {
  constructor(
    public publicKey: string,
    public privateKey: string,
    public signature: string,
    public startTimestamp: number,
    public durationDays: number,
    public userAddress: `0x${string}`,
    public contractAddresses: `0x${string}`[],
    public eip712: EIP712
  ) {}

  isValid() {
    return Date.now() / 1000 < this.startTimestamp + this.durationDays * 86400;
  }

  static async new(
    instance: FhevmInstance,
    contractAddresses: string[],
    publicKey: string,
    privateKey: string,
    signer: ethers.Signer
  ) {
    const userAddress = (await signer.getAddress()) as `0x${string}`;
    const startTimestamp = Math.floor(Date.now() / 1000);
    const durationDays = 365;
    const eip712 = instance.createEIP712(
      publicKey,
      contractAddresses,
      startTimestamp,
      durationDays
    );
    const signature = await signer.signTypedData(
      eip712.domain,
      { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
      eip712.message
    );
    return new FhevmDecryptionSignature(
      publicKey,
      privateKey,
      signature,
      startTimestamp,
      durationDays,
      userAddress,
      contractAddresses as `0x${string}`[],
      eip712
    );
  }

  toJSON() {
    return { ...this };
  }

  static fromJSON(data: any) {
    return new FhevmDecryptionSignature(
      data.publicKey,
      data.privateKey,
      data.signature,
      data.startTimestamp,
      data.durationDays,
      data.userAddress,
      data.contractAddresses,
      data.eip712
    );
  }

  async save(storage: GenericStringStorage, key: string) {
    await storage.setItem(key, JSON.stringify(this));
  }

  static async load(storage: GenericStringStorage, key: string) {
    const s = await storage.getItem(key);
    if (!s) return null;
    try {
      const obj = FhevmDecryptionSignature.fromJSON(JSON.parse(s));
      return obj.isValid() ? obj : null;
    } catch {
      return null;
    }
  }
}


