export type FhevmEncryptedInput = {
  add32: (value: number) => void;
  encrypt: () => Promise<{ handles: (string | Uint8Array)[]; inputProof: string | Uint8Array }>;
};

export type FhevmInstance = {
  createEncryptedInput: (
    contractAddress: string,
    userAddress: string
  ) => FhevmEncryptedInput;
  userDecrypt: (
    items: Array<{ handle: string; contractAddress: string }>,
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    userAddress: string,
    startTimestamp: number,
    durationDays: number
  ) => Promise<Record<string, number | string | bigint | boolean>>;
  generateKeypair: () => { publicKey: string; privateKey: string };
};


