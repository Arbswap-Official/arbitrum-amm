import { ethers, network } from "hardhat";
import { expandTo18Decimals, expandTo6Decimals, saveDeployedAddress } from "../utilities";
import { Contract, ContractFactory } from "ethers";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address: ", deployer.address, "\nNetwork: ", network.name);

  //   deploy general ERC20 token
  const tokenName: string = "MANA";
  const tokenFullname: string = "Decentraland";

  const erc20TokenContract: ContractFactory = await ethers.getContractFactory(
    "ERC20Mock",
    deployer
  );
  const erc20Token: Contract = await erc20TokenContract.deploy(
    tokenFullname,
    tokenName,
    expandTo18Decimals(10000000000),
    {
      gasPrice: 1_000_000_000,
      gasLimit: 1_000_000_000,
    }
  );
  const deployedAddress: string = erc20Token.address;

  // for usdt/usdc where decimals are 6
  // const erc20dec6TokenContract: ContractFactory = await ethers.getContractFactory(
  //   "TetherMock",
  //   deployer
  // );
  // const erc20dec6Token = await erc20dec6TokenContract.deploy(
  //   tokenFullname,
  //   tokenName,
  //   expandTo6Decimals(10_000_000_000)
  // );
  // const deployedAddress: string = erc20dec6Token.address;

  console.log(`${tokenName} is deployed to: `, deployedAddress);
  saveDeployedAddress(network.name, `erc20-${tokenName.toLowerCase()}`, deployedAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
