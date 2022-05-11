import { ethers, network } from "hardhat"
import {loadDeployedAddress, saveDeployedAddress} from "./utilities"

async function main() {
  const factoryAddress = await loadDeployedAddress(network.name, "SwapFactory");
  if (factoryAddress) {
    console.log("Factory is already deployed at " + factoryAddress)
    return
  }
  const [deployer] = await ethers.getSigners()
  console.log("Using deployer " + deployer.address)
  const SwapFactory = await ethers.getContractFactory("SwapFactory", deployer)
  const swapFactory = await SwapFactory.deploy(deployer.address)
  console.log("SwapFactory deployed to:", swapFactory.address)
  await saveDeployedAddress(network.name, "SwapFactory", swapFactory.address)
  let pairCodeHash = await swapFactory.pairCodeHash();
  console.log("pairCodeHash: " + pairCodeHash)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })