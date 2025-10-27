import { JsonRpcProvider, isAddress } from "ethers";
import { RelayerSDKLoader, FhevmWindowType } from "./RelayerSDKLoader";
import { publicKeyStorageGet, publicKeyStorageSet } from "./PublicKeyStorage";

export class FhevmAbortError extends Error {}

type Status = "sdk-loading" | "sdk-loaded" | "sdk-initializing" | "sdk-initialized" | "creating";

async function getChainId(providerOrUrl: string | any): Promise<number> {
  if (typeof providerOrUrl === "string") {
    const p = new JsonRpcProvider(providerOrUrl);
    const n = await p.getNetwork();
    p.destroy();
    return Number(n.chainId);
  }
  const hex = await providerOrUrl.request({ method: "eth_chainId" });
  return parseInt(hex, 16);
}

async function getWeb3Client(rpcUrl: string) {
  const rpc = new JsonRpcProvider(rpcUrl);
  try {
    return await rpc.send("web3_clientVersion", []);
  } finally {
    rpc.destroy();
  }
}

async function tryFetchFHEVMHardhatNodeRelayerMetadata(rpcUrl: string) {
  const version = await getWeb3Client(rpcUrl);
  if (typeof version !== "string" || !version.toLowerCase().includes("hardhat")) return undefined;
  const rpc = new JsonRpcProvider(rpcUrl);
  try {
    return await rpc.send("fhevm_relayer_metadata", []);
  } catch {
    return undefined;
  } finally {
    rpc.destroy();
  }
}

export async function createFhevmInstance(params: {
  provider: string | any;
  mockChains?: Record<number, string>;
  signal: AbortSignal;
  onStatusChange?: (s: Status) => void;
}) {
  const { provider: providerOrUrl, mockChains, signal, onStatusChange } = params;
  const notify = (s: Status) => onStatusChange?.(s);
  const throwIfAborted = () => { if (signal.aborted) throw new FhevmAbortError(); };

  const chainId = await getChainId(providerOrUrl);
  const mocks = { 31337: "http://localhost:8545", ...(mockChains ?? {}) };
  const rpcUrl = typeof providerOrUrl === "string" ? providerOrUrl : mocks[chainId];

  if (rpcUrl) {
    const meta = await tryFetchFHEVMHardhatNodeRelayerMetadata(rpcUrl);
    if (meta) {
      try {
        const fhevmMock = await import("./mock/" + "fhevmMock");
        return await fhevmMock.fhevmMockCreateInstance({ rpcUrl, chainId, metadata: meta });
      } catch (e) {
        console.warn("[fhevm] mock path unavailable, falling back to SDK:", e);
        // fall through to SDK path
      }
    }
  }

  if (!("relayerSDK" in window)) {
    notify("sdk-loading");
    const loader = new RelayerSDKLoader({});
    await loader.load();
    notify("sdk-loaded");
  }

  const win = window as unknown as FhevmWindowType;
  if (!win.relayerSDK.__initialized__) {
    notify("sdk-initializing");
    await win.relayerSDK.initSDK();
    win.relayerSDK.__initialized__ = true;
    notify("sdk-initialized");
  }

  const acl = win.relayerSDK.SepoliaConfig.aclContractAddress;
  if (!isAddress(acl)) throw new Error("Bad ACL address");

  const pub = await publicKeyStorageGet(acl as `0x${string}`);
  const config = {
    ...win.relayerSDK.SepoliaConfig,
    network: providerOrUrl,
    publicKey: pub.publicKey,
    publicParams: pub.publicParams,
  };

  notify("creating");
  const instance = await win.relayerSDK.createInstance(config);
  await publicKeyStorageSet(
    acl as `0x${string}`,
    instance.getPublicKey(),
    instance.getPublicParams(2048)
  );
  throwIfAborted();
  return instance;
}


