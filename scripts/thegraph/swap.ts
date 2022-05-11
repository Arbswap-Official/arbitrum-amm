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

  // FTM -> FTT
  const amountInput = 5000;
  const routePath: Array<string> = [alptoken0address, alptoken1address];

  console.log("reserve0 is: ", bn2n(reserve0), "\nreserve1 is: ", bn2n(reserve1));
  console.log(
    `Adding amount out for ${token0Name}-${token1Name} pair with amount in ${amountInput}...`
  );
  const amountOut = await swapRouter.getAmountOut(
    expandTo18Decimals(amountInput),
    reserve0,
    reserve1
  );

  console.log(
    `Swapping ${amountInput} of ${token0Name} for ${bn2n(amountOut)} of ${token1Name} ...`
  );
  const swapResult = await swapRouter.connect(deployer).swapExactTokensForTokens(
    expandTo18Decimals(amountInput), // payAmount,
    amountOut, // receiveAmount,
    routePath,
    deployer.address, // to
    BigNumber.from(
      Math.floor(
        DateTime.now()
          .plus(Duration.fromObject({ days: 1 }))
          .toSeconds()
      )
    ) // deadline
  );

  const swapResultWaited = await swapResult.wait();
  console.log("swap result", swapResultWaited);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
