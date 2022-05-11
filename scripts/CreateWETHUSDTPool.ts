import {ethers, network} from "hardhat"
import {loadDeployedAddress, loadWETH9AddressOrDeployToLocal, saveDeployedAddress} from "./utilities"
import {WETH, TETHER} from "./utilities/constants";

async function main() {
  const [deployer] = await ethers.getSigners()
  const factoryAddress = await loadDeployedAddress(network.name, "SwapFactory");
  if (!factoryAddress) {
    throw Error("Factory is not deployed yet.")
  }
  console.log("Using SwapFactory at: " + factoryAddress)
  let tetherAddress = TETHER[network.name];
  console.log("Using TETHER at: " + tetherAddress)

  if(!tetherAddress){
    throw Error("No TETHER defined in " + network.name)
  }

  let wethAddress = WETH[network.name];
  console.log("Using WETH at: " + wethAddress)

  if(!wethAddress){
    throw Error("No WETH deployed in " + network.name)
  }
  const SwapFactory = await ethers.getContractFactory("SwapFactory")
  const swapFactory = SwapFactory.attach(factoryAddress);

  let pair = await swapFactory.createPair(wethAddress, tetherAddress);
  let pairAddress = (await pair.wait()).events[0].args.pair;
  console.log("Pair created at " + pairAddress)
  saveDeployedAddress(network.name, "weth-usdt", pairAddress)

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })