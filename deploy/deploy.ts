import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  const vote = await deploy("FHEVoteApp", {
    from: deployer,
    args: [],
    log: true,
  });

  console.log("FHEVoteApp deployed:", vote.address);
};

export default func;
func.tags = ["FHEVoteApp"];


