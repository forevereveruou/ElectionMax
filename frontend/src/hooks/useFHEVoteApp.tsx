"use client";

import { ethers } from "ethers";
import { useCallback, useMemo, useRef, useState } from "react";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";

type FhevmInstance = any;

export function useFHEVoteApp(params: {
  instance: FhevmInstance | undefined;
  provider: ethers.Eip1193Provider | undefined;
  contractAddress: `0x${string}` | undefined;
  abi: any[];
}) {
  const { instance, provider, contractAddress, abi } = params;
  const [message, setMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const rpcProvider = useMemo(() => (provider ? new ethers.BrowserProvider(provider) : undefined), [provider]);
  const signerRef = useRef<ethers.JsonRpcSigner | undefined>(undefined);
  const storage = useMemo(() => new GenericStringStorage("fhevm-vote"), []);

  const getSigner = useCallback(async () => {
    if (!rpcProvider) return undefined;
    if (signerRef.current) return signerRef.current;
    signerRef.current = await rpcProvider.getSigner();
    return signerRef.current;
  }, [rpcProvider]);

  const getContract = useCallback(
    async (withSigner: boolean) => {
      if (!contractAddress || !rpcProvider) return undefined;
      const signer = withSigner ? await getSigner() : undefined;
      return new ethers.Contract(contractAddress, abi, signer ?? rpcProvider);
    },
    [abi, contractAddress, getSigner, rpcProvider]
  );

  const createPoll = useCallback(
    async (title: string, description: string, options: string[], deadline: number): Promise<boolean> => {
      // 前置条件：合约地址、提供者、签名者（创建投票不依赖 FHE 实例）
      if (!contractAddress) {
        setMessage("缺少合约地址：请切换到已部署合约的网络");
        return false;
      }
      if (!rpcProvider) {
        setMessage("未检测到钱包提供者，请先连接或安装钱包（如 MetaMask）");
        return false;
      }
      const signer = await getSigner();
      if (!signer) {
        setMessage("钱包未授权或未连接，请点击右上角 Connect Wallet");
        return false;
      }
      const c = new ethers.Contract(contractAddress, abi, signer);
      setIsBusy(true);
      try {
        let tx: ethers.TransactionResponse;
        try {
          // Try gas estimation first
          const est: bigint = await (c as any).estimateGas.createPoll(title, description, options, deadline);
          const gasLimit: bigint = (est * 12n) / 10n; // +20%
          tx = await (c as any).createPoll(title, description, options, deadline, { gasLimit });
        } catch {
          // Fallback: send directly with conservative gasLimit (avoid browser-side estimateGas errors)
          tx = await (c as any).createPoll(title, description, options, deadline, { gasLimit: 800000n });
        }
        await tx.wait();
        setMessage("Poll created successfully");
        return true;
      } catch (e: any) {
        const reason = e?.shortMessage || e?.message || "Transaction failed";
        setMessage(`Failed to create poll: ${reason}`);
        return false;
      } finally {
        setIsBusy(false);
      }
    },
    [abi, contractAddress, getSigner, rpcProvider]
  );

  const vote = useCallback(
    async (pollId: bigint, optionIndex: number, optionCount: number) => {
      if (!instance) return;
      const c = await getContract(true);
      const signer = await getSigner();
      if (!c || !signer || !contractAddress) return;
      setIsBusy(true);
      try {
        const input = instance.createEncryptedInput(contractAddress, signer.address);
        for (let i = 0; i < optionCount; i++) {
          input.add32(i === optionIndex ? 1 : 0);
        }
        const enc = await input.encrypt();
        const tx = await c.vote(pollId, enc.handles, enc.inputProof);
        await tx.wait();
        setMessage("Vote submitted successfully");
      } catch (e: any) {
        const reason = e?.shortMessage || e?.message || "Transaction failed";
        setMessage(`Failed to vote: ${reason}`);
      } finally {
        setIsBusy(false);
      }
    },
    [contractAddress, getContract, getSigner, instance]
  );

  const requestPublicResultsAccess = useCallback(
    async (pollId: bigint) => {
      const c = await getContract(true);
      if (!c) return;
      setIsBusy(true);
      try {
        const tx = await c.grantDecryptForAllOptions(pollId);
        await tx.wait();
        setMessage("Decryption access requested successfully");
      } finally {
        setIsBusy(false);
      }
    },
    [getContract]
  );

  const deletePoll = useCallback(
    async (pollId: bigint): Promise<boolean> => {
      if (!contractAddress) {
        setMessage("缺少合约地址：请切换到已部署合约的网络");
        return false;
      }
      const c = await getContract(true);
      if (!c) {
        setMessage("未检测到钱包提供者，请先连接或安装钱包（如 MetaMask）");
        return false;
      }
      if (typeof (c as any).deletePoll !== "function") {
        setMessage("当前网络的合约版本不支持删除功能，请重新部署最新合约并更新前端地址/ABI");
        return false;
      }
      setIsBusy(true);
      try {
        let tx: ethers.TransactionResponse;
        try {
          const est: bigint = await (c as any).estimateGas.deletePoll(pollId);
          const gasLimit: bigint = (est * 12n) / 10n;
          tx = await (c as any).deletePoll(pollId, { gasLimit });
        } catch {
          tx = await (c as any).deletePoll(pollId, { gasLimit: 300000n });
        }
        await tx.wait();
        setMessage("Poll deleted successfully");
        return true;
      } catch (e: any) {
        const reason = e?.shortMessage || e?.message || "Transaction failed";
        setMessage(`Failed to delete poll: ${reason}`);
        return false;
      } finally {
        setIsBusy(false);
      }
    },
    [contractAddress, getContract]
  );

  const decryptResults = useCallback(
    async (pollId: bigint, optionCount: number) => {
      if (!instance || !contractAddress) return [] as bigint[];
      const c = await getContract(false);
      const signer = await getSigner();
      if (!c || !signer) return [] as bigint[];

      const handles: string[] = [];
      for (let i = 0; i < optionCount; i++) {
        const h = await c.getOptionEncryptedCount(pollId, i);
        handles.push(h);
      }

      const storageKey = `${contractAddress}:${await signer.getAddress()}:poll:${pollId}`;
      let sig = await FhevmDecryptionSignature.load(storage, storageKey);
      if (!sig) {
        const { publicKey, privateKey } = instance.generateKeypair();
        sig = await FhevmDecryptionSignature.new(
          instance,
          [contractAddress],
          publicKey,
          privateKey,
          signer
        );
        await sig.save(storage, storageKey);
      }

      const res = await instance.userDecrypt(
        handles.map((h: string) => ({ handle: h, contractAddress })),
        sig.privateKey,
        sig.publicKey,
        sig.signature,
        sig.contractAddresses,
        sig.userAddress,
        sig.startTimestamp,
        sig.durationDays
      );

      return handles.map((h) => BigInt(res[h] ?? 0));
    },
    [contractAddress, getContract, getSigner, instance, storage]
  );

  return { createPoll, vote, decryptResults, requestPublicResultsAccess, deletePoll, isBusy, message } as const;
}


