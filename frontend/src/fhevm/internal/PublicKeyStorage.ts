import { openDB } from "idb";

type FhevmStoredPublicKey = {
  publicKeyId: string;
  publicKey: Uint8Array;
};

type FhevmStoredPublicParams = {
  publicParamsId: string;
  publicParams: Uint8Array;
};

async function getDB() {
  if (typeof window === "undefined") return undefined;
  return openDB("fhevm", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("paramsStore")) {
        db.createObjectStore("paramsStore", { keyPath: "acl" });
      }
      if (!db.objectStoreNames.contains("publicKeyStore")) {
        db.createObjectStore("publicKeyStore", { keyPath: "acl" });
      }
    },
  });
}

export async function publicKeyStorageGet(aclAddress: `0x${string}`): Promise<{
  publicKey?: { id: string | null; data: Uint8Array | null };
  publicParams: { "2048": FhevmStoredPublicParams } | null;
}> {
  const db = await getDB();
  if (!db) return { publicParams: null };

  const pk = await db.get("publicKeyStore", aclAddress);
  const pp = await db.get("paramsStore", aclAddress);

  const publicKey = pk?.value
    ? { id: (pk.value as FhevmStoredPublicKey).publicKeyId, data: (pk.value as FhevmStoredPublicKey).publicKey }
    : undefined;
  const publicParams = pp?.value
    ? { "2048": (pp.value as FhevmStoredPublicParams) }
    : null;
  return { ...(publicKey && { publicKey }), publicParams };
}

export async function publicKeyStorageSet(
  aclAddress: `0x${string}`,
  publicKey: FhevmStoredPublicKey | null,
  publicParams: FhevmStoredPublicParams | null
) {
  const db = await getDB();
  if (!db) return;
  if (publicKey) await db.put("publicKeyStore", { acl: aclAddress, value: publicKey });
  if (publicParams) await db.put("paramsStore", { acl: aclAddress, value: publicParams });
}


