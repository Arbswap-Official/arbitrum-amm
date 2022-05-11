import {ethers, network} from "hardhat"
import {loadDeployedAddress, saveDeployedAddress} from "./utilities"
import {WETH} from "./utilities/constants";

async function main() {
  const [deployer] = await ethers.getSigners()
  const factoryAddress = await loadDeployedAddress(network.name, "SwapFactory");
  if (!factoryAddress) {
    throw Error("Factory is not deployed yet.")
  }
  console.log("Using SwapFactory at: " + factoryAddress)
  let linkAddress = "0x615fbe6372676474d9e6933d310469c9b68e9726";
  console.log("Using LINK at: " + linkAddress)

  let wethAddress = WETH[network.name];
  console.log("Using WETH at: " + wethAddress)

  if(!wethAddress){
    throw Error("No WETH deployed in " + network.name)
  }
  const SwapFactory = await ethers.getContractFactory("SwapFactory")
  const swapFactory = SwapFactory.attach(factoryAddress);

  let pair = await swapFactory.createPair(wethAddress, linkAddress);
  let pairAddress = (await pair.wait()).events[0].args.pair;
  console.log("Pair created at " + pairAddress)
  saveDeployedAddress(network.name, "weth-link", pairAddress)

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })