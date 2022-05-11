import { ethers, network } from "hardhat";
import { loadDeployedAddress, saveDeployedAddress } from "../utilities";
import { testnet as testnetAddresses } from "./addresses";
import { WETH } from "../utilities/constants";

async function main() {
  const [deployer] = await ethers.getSigners();
  const factoryAddress = await loadDeployedAddress(network.name, "SwapFactory");
  if (!factoryAddress) {
    throw Error("Factory is not deployed yet.");
  }
  console.log("Using SwapFactory at: " + factoryAddress);
  // Contract address
  const { ERC20_FTT_add: fttAddress } = testnetAddresses;
  console.log("Using FTT at: " + fttAddress);

  const ftmAddress = await loadDeployedAddress(network.name, "erc20-ftm");
  console.log("Using ftm at: " + ftmAddress);

  if (!ftmAddress) {
    throw Error("No ftm deployed in " + network.name);
  }
  const SwapFactory = await ethers.getContractFactory("SwapFactory");
  const swapFactory = SwapFactory.attach(factoryAddress);

  let pair = await swapFactory.createPair(ftmAddress, fttAddress);
  let pairAddress = (await pair.wait()).events[0].args.pair;
  console.log("Pair created at " + pairAddress);
  saveDeployedAddress(network.name, "ftm-ftt", pairAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
