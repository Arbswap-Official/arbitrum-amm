import { ethers, network } from "hardhat";
import {
  expandTo18Decimals,
  loadDeployedAddress,
  saveDeployedAddress,
} from "../utilities";
import { DateTime, Duration } from "luxon";
import { BigNumber, Contract, ContractFactory } from "ethers";
import { testnet as testnetAddresses } from "./addresses";

function bn2n(val) {
  return BigNumber.from(val).toString();
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("deployer address", deployer.address);

  const swapFactoryAddress = await loadDeployedAddress(network.name, "SwapFactory");
  const swapRouterAddress = await loadDeployedAddress(network.name, "SwapRouter");
  const SwapRouter = await ethers.getContractFactory("SwapRouter", deployer);
  const swapRouter = SwapRouter.attach(swapRouterAddress);

  const swapPairFTMFTTAddress = await loadDeployedAddress(network.name, "ftm-ftt");
  const alp = await ethers.getContractAt("SwapPair", swapPairFTMFTTAddress);
  const alptoken0address = await alp.token0();
  const alptoken1address = await alp.token1();
  const token0 = await ethers.getContractAt("ERC20Mock", alptoken0address);
  const token1 = await ethers.getContractAt("ERC20Mock", alptoken1address);
  const token0Name = await token0.symbol();
  const token1Name = await token1.symbol();

  // Number of LP Token
  const amountInput = 30;

  console.log(`Removing liquidity for ${token0Name}-${token1Name} pair...`);
  const addLiquidity = await swapRouter.connect(deployer).removeLiquidity(
    alptoken0address, // tokenA
    alptoken1address, // tokenB
    expandTo18Decimals(amountInput), // liquidity
    expandTo18Decimals(1), //amountAMin
    expandTo18Decimals(1), //amountBMin
    deployer.address, // to
    BigNumber.from(
      Math.floor(
        DateTime.now()
          .plus(Duration.fromObject({ days: 1 }))
          .toSeconds()
      )
    ) // deadline
  );
  // const addLiquidityResult = await swapRouter.addLiquidity(
  //     uniToken.address,
  //     tetherToken.address,
  //     expandTo18Decimals(0.0001),
  //     expandTo18Decimals(0.002),
  //     expandTo18Decimals(0.0001),
  //     expandTo18Decimals(0.002),
  //     deployer.address,
  //     BigNumber.from(Math.floor(DateTime.now().plus(Duration.fromObject({days: 1})).toSeconds())), {
  //         gasPrice: 1_000_000_000,
  //         gasLimit: 8_000_000,
  //     }
  // )
  const addLiquidityResult = await addLiquidity.wait();
  console.log("add liquidity result", addLiquidityResult);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
