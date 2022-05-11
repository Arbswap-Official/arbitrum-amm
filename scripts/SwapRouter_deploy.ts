import {ethers, network} from "hardhat"
import {loadDeployedAddress, loadWETH9AddressOrDeployToLocal, saveDeployedAddress} from "./utilities"

async function main() {
  const factoryAddress = await loadDeployedAddress(network.name, "SwapFactory");
  if (!factoryAddress) {
    throw Error("Factory is not deployed yet.")
  }
  const [deployer] = await ethers.getSigners()
  console.log("Using deployer " + deployer.address)
  console.log("Using SwapFactory at: " + factoryAddress)
  let wethAddress = await loadWETH9AddressOrDeployToLocal(deployer);
  console.log("Using WETH9 at: " + wethAddress)

  const SwapRouter = await ethers.getContractFactory("SwapRouter", deployer)
  const swapRouter = await SwapRouter.deploy(factoryAddress, wethAddress)
  console.log("SwapRouter deployed to:", swapRouter.address)
  await saveDeployedAddress(network.name, "SwapRouter", swapRouter.address)

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })