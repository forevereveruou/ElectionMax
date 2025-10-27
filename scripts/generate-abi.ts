import fs from "fs";
import path from "path";

const CONTRACT_NAME = "FHEVoteApp";

async function run() {
  const repoRoot = process.cwd();
  const deploymentsDir = path.join(repoRoot, "deployments");
  const frontendDir = path.join(repoRoot, "frontend", "src", "abi");
  const allowMismatch = String(process.env.GENABI_ALLOW_MISMATCH || "").trim() === "1";

  fs.mkdirSync(frontendDir, { recursive: true });

  function readPreviousAddress(chainId: number): string | undefined {
    try {
      const addrFile = path.join(frontendDir, `${CONTRACT_NAME}Addresses.ts`);
      if (!fs.existsSync(addrFile)) return undefined;
      const content = fs.readFileSync(addrFile, "utf8");
      const re = new RegExp(`"${chainId}"\\s*:\\s*\\{\\s*address:\\s*\"(0x[a-fA-F0-9]{40})\"`);
      const m = content.match(re);
      return m?.[1];
    } catch {
      return undefined;
    }
  }

  function readDeployment(chainName: string, chainId: number) {
    const file = path.join(deploymentsDir, chainName, `${CONTRACT_NAME}.json`);
    if (!fs.existsSync(file)) return undefined as unknown as { abi: any[]; address: string } | undefined;
    const json = JSON.parse(fs.readFileSync(file, "utf8"));
    return { abi: json.abi as any[], address: json.address as string };
  }

  const localhost = readDeployment("localhost", 31337);
  if (!localhost) throw new Error("No localhost deployment found. Run `npx hardhat deploy --network localhost`.");

  const sepoliaDeployed = readDeployment("sepolia", 11155111);
  const sepolia = sepoliaDeployed ?? { abi: localhost.abi, address: readPreviousAddress(11155111) ?? "0x0000000000000000000000000000000000000000" };

  if (JSON.stringify(localhost.abi) !== JSON.stringify(sepolia.abi)) {
    if (!allowMismatch) {
      throw new Error("ABI mismatch between localhost and sepolia. Please redeploy to keep ABI in sync.");
    } else {
      // 放宽：以本地 ABI 为准继续生成，但保留 sepolia 地址（若有）
      console.warn(
        "[genabi] ABI mismatch detected. Proceeding with localhost ABI due to GENABI_ALLOW_MISMATCH=1."
      );
    }
  }

  const tsAbi = `export const ${CONTRACT_NAME}ABI = ${JSON.stringify({ abi: localhost.abi }, null, 2)} as const;\n`;
  const tsAddresses = `export const ${CONTRACT_NAME}Addresses = {\n  "11155111": { address: "${sepolia.address}", chainId: 11155111, chainName: "sepolia" },\n  "31337": { address: "${localhost.address}", chainId: 31337, chainName: "hardhat" },\n};\n`;

  fs.writeFileSync(path.join(frontendDir, `${CONTRACT_NAME}ABI.ts`), tsAbi, "utf8");
  fs.writeFileSync(path.join(frontendDir, `${CONTRACT_NAME}Addresses.ts`), tsAddresses, "utf8");
  console.log("Generated ABI and Addresses for FHEVoteApp.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});


