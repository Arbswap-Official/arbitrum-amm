import { ethers, network } from "hardhat";
import {
  expandTo18Decimals,
  loadDeployedAddress,
  saveDeployedAddress,
} from "../utilities";
import { DateTime, Duration } from "luxon";
import { BigNumber, Contract, ContractFactory } from "ethers";

function bn2n(val) {
  return BigNumber.from(val).toString();
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("deployer address", deployer.address);
  const swapFactory_add: string = "0x491fd0B4c07333F57EA22D45358A0b0971a50d55";
  const swapRouter_add: string = "0x0a968b282AB73CAf329BF4C1C16C580d0F781113";
  const ERC20_USDT_add: string = "0x48a4052198F268833B6f577c6ac06087cFE3F688";
  const ERC20_WETH_add: string = "0xB47e6A5f8b33b3F17603C83a0535A9dcD7E32681";
  const ERC20_UNI_add: string = "0x049251A7175071316e089D0616d8B6aaCD2c93b8";
  const SwapPair_ETH_USDT_add: string = "0xB504B71FF1a2e93CF5E342044303868E44581170";
  const SwapPair_ETH_UNI_add: string = "0x273a9a82cEc0836562FEDD85c88e6d8bC02e680e";

  const ethToken = await ethers.getContractAt("ERC20Mock", ERC20_WETH_add);
  const tetherToken = await ethers.getContractAt("ERC20Mock", ERC20_USDT_add);
  const uniToken = await ethers.getContractAt("ERC20Mock", ERC20_UNI_add);
  const ethUsdtToken = await ethers.getContractAt("SwapPair", SwapPair_ETH_USDT_add);
  const swapRouter = await ethers.getContractAt("SwapRouter", swapRouter_add);

  // const token0 = await ethUsdtToken.token0();
  // const token1 = await ethUsdtToken.token1();
  // const reserves = await ethUsdtToken.getReserves()
  // const reserve0 = bn2n(reserves[0])
  // const reserve1 = bn2n(reserves[1])
  // console.log('token0', token0, ' reserve0', reserve0)
  // console.log('token1', token1, ' reserve1', reserve1)
  // const ratio = reserves[0].div(reserves[1])
  // const ratioNum = ratio.toNumber();
  // console.log('ratio', ratioNum);
  // const quote = await swapRouter.quote(expandTo18Decimals(10), reserve0, reserve1);
  // console.log('quote', bn2n(quote));

  /* Add Liquidity */
  // console.log("Adding liquidity to ETH-USDT Pool")
  // const ethIn: number = 0.00000001;
  // const usdtIn: number = 0.000001;
  // const addLiquidityTran = await swapRouter.connect(deployer).addLiquidityETH(
  //     tetherToken.address,
  //     expandTo18Decimals(usdtIn),
  //     expandTo18Decimals(ethIn),
  //     expandTo18Decimals(ethIn),
  //     deployer.address,
  //     BigNumber.from(Math.floor(DateTime.now().plus(Duration.fromObject({days: 1})).toSeconds())), {
  //         gasPrice: 1_000_000_000,
  //         gasLimit: 8_000_000,
  //         value: expandTo18Decimals(ethIn)
  //     }
  // )
  // const result = await addLiquidityTran.wait()
  // console.log('result', result)

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
  // console.log('add liq result', addLiquidityResult);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
