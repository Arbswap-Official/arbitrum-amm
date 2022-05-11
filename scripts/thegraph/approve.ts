import { ethers, network } from "hardhat";
import { expandTo18Decimals, loadDeployedAddress } from "../utilities";
import { testnet as testnetAddresses } from "./addresses";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("deployer address", deployer.address);

  // Contract address
  const {
    ERC20_WETH_add,
    ERC20_USDT_add,
    ERC20_UNI_add,
    ERC20_FTT_add,
    SwapPair_ETH_USDT_add,
  } = testnetAddresses;
  const swapFactoryAddress = await loadDeployedAddress(network.name, "SwapFactory");
  const swapRouterAddress = await loadDeployedAddress(network.name, "SwapRouter");
  const ERC20_FTM_add = await loadDeployedAddress(network.name, "erc20-ftm");
  const swapPair_FTM_FTT_add = await loadDeployedAddress(network.name, "ftm-ftt");

  // Contract
  const ethToken = await ethers.getContractAt("ERC20Mock", ERC20_WETH_add);
  const tetherToken = await ethers.getContractAt("ERC20Mock", ERC20_USDT_add);
  const uniToken = await ethers.getContractAt("ERC20Mock", ERC20_UNI_add);
  const fttToken = await ethers.getContractAt("ERC20Mock", ERC20_FTT_add);
  const ftmToken = await ethers.getContractAt("ERC20Mock", ERC20_FTM_add);
  const ftmFttToken = await ethers.getContractAt("SwapPair", swapPair_FTM_FTT_add);

  // Approve token
  const ethSwapFactoryResult = await ethToken
    .connect(deployer)
    .approve(swapFactoryAddress, expandTo18Decimals(100_000_000_000_000));
  console.log("Result of Approving SwapFactory to use ETH: ", ethSwapFactoryResult);
  const ethSwapRouterResult = await ethToken
    .connect(deployer)
    .approve(swapRouterAddress, expandTo18Decimals(100_000_000_000_000));
  console.log("Result of Approving SwapRouter to use ETH: ", ethSwapRouterResult);

  const usdtSwapFactoryResult = await tetherToken
    .connect(deployer)
    .approve(swapFactoryAddress, expandTo18Decimals(1_000_000_000_000));
  console.log("Result of Approving SwapFactory to use USDT: ", usdtSwapFactoryResult);
  const usdtSwapRouterResult = await tetherToken
    .connect(deployer)
    .approve(swapRouterAddress, expandTo18Decimals(1_000_000_000_000));
  console.log("Result of Approving SwapRouter to use USDT: ", usdtSwapRouterResult);

  const uniSwapFactoryResult = await uniToken
    .connect(deployer)
    .approve(swapFactoryAddress, expandTo18Decimals(100_000_000_000_000));
  console.log("Result of Approving SwapFactory to use UNI: ", uniSwapFactoryResult);
  const uniSwapRouterResult = await uniToken
    .connect(deployer)
    .approve(swapRouterAddress, expandTo18Decimals(100_000_000_000_000));
  console.log("Result of Approving SwapRouter to use UNI: ", uniSwapRouterResult);

  const fttSwapFactoryResult = await fttToken
    .connect(deployer)
    .approve(swapFactoryAddress, expandTo18Decimals(100_000_000_000_000));
  console.log("Result of Approving SwapFactory to use FTT: ", fttSwapFactoryResult);
  const fttSwapRouterResult = await fttToken
    .connect(deployer)
    .approve(swapRouterAddress, expandTo18Decimals(100_000_000_000_000));
  console.log("Result of Approving SwapRouter to use FTT: ", fttSwapRouterResult);

  const ftmSwapFactoryResult = await ftmToken
    .connect(deployer)
    .approve(swapFactoryAddress, expandTo18Decimals(100_000_000_000_000));
  console.log("Result of Approving SwapFactory to use FTM: ", ftmSwapFactoryResult);
  const ftmSwapRouterResult = await ftmToken
    .connect(deployer)
    .approve(swapRouterAddress, expandTo18Decimals(100_000_000_000_000));
  console.log("Result of Approving SwapRouter to use FTM: ", ftmSwapRouterResult);

  const ftmFttSwapFactoryResult = await ftmFttToken
    .connect(deployer)
    .approve(swapFactoryAddress, expandTo18Decimals(100_000_000_000_000));
  console.log(
    "Result of Approving SwapFactory to use FTM-FTT LP Token: ",
    ftmFttSwapFactoryResult
  );
  const ftmFttSwapRouterResult = await ftmFttToken
    .connect(deployer)
    .approve(swapRouterAddress, expandTo18Decimals(100_000_000_000_000));
  console.log(
    "Result of Approving SwapRouter to use FTM-FTT LP Token: ",
    ftmFttSwapRouterResult
  );

  console.log("All contracts are approved!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
