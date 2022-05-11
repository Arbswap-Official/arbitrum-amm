import { ethers, network } from "hardhat";
import {
  expandTo18Decimals,
  loadDeployedAddress,
  saveDeployedAddress,
} from "../utilities";
import { DateTime, Duration } from "luxon";
import { BigNumber, Contract, ContractFactory } from "ethers";
import { testnet as testnetAddresses } from "./addresses";

function bn2n(val: BigNumber): string {
  return BigNumber.from(val).toString();
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("deployer address", deployer.address);

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
  // const ethUsdtToken = await ethers.getContractAt("SwapPair", SwapPair_ETH_USDT_add);

  const SwapRouter = await ethers.getContractFactory("SwapRouter", deployer);
  const swapRouter = SwapRouter.attach(swapRouterAddress);

  const swapPairFTMFTTAddress = await loadDeployedAddress(network.name, "ftm-ftt");
  const alp = await ethers.getContractAt("SwapPair", swapPairFTMFTTAddress);
  const alptoken0address = await alp.token0();
  const alptoken1address = await alp.token1();
  const alpReserves = await alp.getReserves();

  const reserve0 = alpReserves[0];
  const reserve1 = alpReserves[1];
  const token0 = await ethers.getContractAt("ERC20Mock", alptoken0address);
  const token1 = await ethers.getContractAt("ERC20Mock", alptoken1address);
  const token0Name = await token0.symbol();
  const token1Name = await token1.symbol();

  // FTM
  const amountInput = 1;
  // const path: Array<string> = [alptoken0address, alptoken1address];

  console.log("reserve0 is: ", bn2n(reserve0), "\nreserve1 is: ", bn2n(reserve1));
  console.log(
    `Adding amount out for ${token0Name}-${token1Name} pair with amount in ${amountInput}...`
  );
  const amountOut = await swapRouter.getAmountOut(
    expandTo18Decimals(amountInput),
    reserve0,
    reserve1
  );
  // const amountOut = await swapRouter.getAmountsOut(expandTo18Decimals(amountInput), path);

  console.log("amountOut", amountOut);
  console.log("getAmountsOut result: ", bn2n(amountOut));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
