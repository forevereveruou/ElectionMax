import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const CONTRACT_NAME = "FHEVoteApp";

const outdir = path.resolve("./src/abi");
if (!fs.existsSync(outdir)) fs.mkdirSync(outdir, { recursive: true });

function readPreviousAddress(chainId) {
  try {
    const addrFile = path.join(outdir, `${CONTRACT_NAME}Addresses.ts`);
    if (!fs.existsSync(addrFile)) return undefined;
    const content = fs.readFileSync(addrFile, "utf-8");
    const re = new RegExp(`"${chainId}"\\s*:\\s*\\{\\s*address:\\s*\"(0x[a-fA-F0-9]{40})\"`);
    const m = content.match(re);
    return m?.[1];
  } catch {
    return undefined;
  }
}

// 尝试多种相对路径以兼容从 frontend 目录执行脚本（ESM 下不使用 __dirname）
const candidateDirs = [
  path.resolve("../deployments"),
  path.resolve("../../deployments"),
  path.resolve(process.cwd(), "../deployments"),
  path.resolve(process.cwd(), "../../deployments"),
];
const deploymentsDir = candidateDirs.find((p) => fs.existsSync(p)) || path.resolve("../deployments");
const isDev = process.env.NODE_ENV !== "production";
const allowMismatch = isDev || String(process.env.GENABI_ALLOW_MISMATCH || "").trim() === "1";

function readDeployment(chainName, chainId) {
  const dir = path.join(deploymentsDir, chainName);
  const file = path.join(dir, `${CONTRACT_NAME}.json`);
  if (!fs.existsSync(file)) return undefined;
  const json = JSON.parse(fs.readFileSync(file, "utf-8"));
  return { abi: json.abi, address: json.address };
}

function deployOnHardhatNode() {
  if (process.platform === "win32") return; // 与模板一致：Windows 不自动起节点
  try {
    // 可在根目录提供与模板一致的自动脚本；VoteApp 暂不内置
  } catch (e) {
    console.error("auto-deploy failed", e);
  }
}

const localhost = readDeployment("localhost", 31337) || (deployOnHardhatNode(), readDeployment("localhost", 31337));
if (!localhost) {
  console.error(`Unable to locate ${path.join(deploymentsDir, "localhost", `${CONTRACT_NAME}.json`)}. Run \`npm run deploy\` first.`);
  process.exit(1);
}

const sepolia = readDeployment("sepolia", 11155111) || { abi: localhost.abi, address: readPreviousAddress(11155111) || "0x0000000000000000000000000000000000000000" };

if (JSON.stringify(localhost.abi) !== JSON.stringify(sepolia.abi)) {
  if (!allowMismatch) {
    console.error("Deployments on localhost and Sepolia differ. Consider re-deploying to keep ABI in sync.");
    console.error("Set GENABI_ALLOW_MISMATCH=1 to proceed with localhost ABI.");
    process.exit(1);
  } else {
    console.warn("[genabi] ABI mismatch detected. Proceeding with localhost ABI (development mode or GENABI_ALLOW_MISMATCH=1).");
  }
}

const tsAbi = `export const ${CONTRACT_NAME}ABI = ${JSON.stringify({ abi: localhost.abi }, null, 2)} as const;\n`;
const tsAddresses = `export const ${CONTRACT_NAME}Addresses = {\n  "11155111": { address: "${sepolia.address}", chainId: 11155111, chainName: "sepolia" },\n  "31337": { address: "${localhost.address}", chainId: 31337, chainName: "hardhat" },\n};\n`;

fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}ABI.ts`), tsAbi, "utf-8");
fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}Addresses.ts`), tsAddresses, "utf-8");
console.log("Generated FHEVoteAppABI.ts and FHEVoteAppAddresses.ts");


