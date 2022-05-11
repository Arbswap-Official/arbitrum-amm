import { ethers, network } from "hardhat";
import { loadDeployedAddress, saveDeployedAddress } from "../utilities";
import { BigNumber } from "ethers";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("deployer address", deployer.address);

  // const USDT = await ethers.getContractFactory("USDT")
  // const swapFactory = await SwapFactory.attach(factoryAddress);
  // const factoryAddress = await loadDeployedAddress(network.name, "SwapFactory");

  // console.log("Using SwapFactory at: " + factoryAddress)
  // let wethAddress = await loadWETH9AddressOrDeployToLocal(deployer);
  // console.log("Using WETH9 at: " + wethAddress)

  // let convAddress = CONV[network.name];
  // console.log("Using CONV at: " + convAddress)

  // if(!convAddress){
  // throw Error("No CONV deployed in " + network.name)
  // }
  // const convAddress = "0x0D9A56bE3539D41F059Ae27d3EF7812f5F14Af08";
  // const wethAddress = "0xCFD18eE0ADb8BF0C5928306a1AAaE87b5501530d";
  // const SwapRouter = await ethers.getContractFactory("SwapRouter")
  //   const SwapFactory = await ethers.getContractAt(
  //     "SwapFactory",
  //     "0x491fd0B4c07333F57EA22D45358A0b0971a50d55"
  //   );
  //   const numOfPairsBig = await SwapFactory.allPairsLength();
  //   const numOfPairs = BigNumber.from(numOfPairsBig).toNumber();
  //   console.log("number of pairs", numOfPairs);
  //   const pair0 = await SwapFactory.allPairs(0);
  //   const pair1 = await SwapFactory.allPairs(1);
  //   // const pair2 = await SwapFactory.allPairs(2);
  //   console.log("0th", pair0, "\n1th", pair1);
  // const swapRouter = await SwapRouter.attach("0xcf4291089EF31a6944B0F3168712421F776188c0");
  // const convAmount = BigNumber.from('200000000000000000000');
  // const ethAmount = BigNumber.from('200000000000000000000');
  // const lpTokenReceiver = "0x3f4494E3a4decb219da8d102f04AFaA52aF457ED";
  // const deadline = ((new Date()).getTime() + 300000).toString()
  // const deadlineInSec = deadline.substring(0, deadline.length - 3);

  // let transaction = await swapRouter.addLiquidityETH(convAddress, convAmount, convAmount, convAmount, lpTokenReceiver, deadlineInSec, {
  //     value: ethAmount
  // });
  // let pairAddress = (await pair.wait()).events[0].args.pair;
  // console.log("Pair created at " + pairAddress)
  // saveDeployedAddress(network.name, "conv-eth", pairAddress)

  // approve to stake
  // const convergenceToken = await ethers.getContractAt("ConvergenceToken", '0x0d9a56be3539d41f059ae27d3ef7812f5f14af08');
  // const eth = await ethers.getContractAt("WETH9", '0xCFD18eE0ADb8BF0C5928306a1AAaE87b5501530d');
  // conv-usdt
  const swapPairFTMFTTAddress = await loadDeployedAddress(network.name, "ftm-ftt");
  const alp = await ethers.getContractAt("SwapPair", swapPairFTMFTTAddress);
  const alpName = await alp.name();
  const alptoken0address = await alp.token0();
  const alptoken1address = await alp.token1();
  const token0 = await ethers.getContractAt("ERC20Mock", alptoken0address);
  const token1 = await ethers.getContractAt("ERC20Mock", alptoken1address);
  const token0Name = await token0.symbol();
  const token1Name = await token1.symbol();
  console.log("ALP name: ", alpName);
  console.log("token0name", token0Name, "token1name", token1Name);

  // const alp = await ethers.getContractAt("SwapERC20", '0x273a9a82cEc0836562FEDD85c88e6d8bC02e680e');

  // const transaction = await convergenceToken.approve('0x82097aa137cdB2Fa4Aa2444716f6d853c5c49dB3',BigNumber.from('9999999999990000000000000000000000'));
  // const transaction = await usdt.approve('0xcf4291089EF31a6944B0F3168712421F776188c0',BigNumber.from('99999999999990000000000000000000000'));
  // const transaction = await convergenceToken.approve('0xcf4291089EF31a6944B0F3168712421F776188c0',BigNumber.from('99999999999990000000000000000000000'));
  // const transaction = await eth.approve('0xcf4291089EF31a6944B0F3168712421F776188c0',BigNumber.from('99999999999990000000000000000000000'));
  // const information = await clp.rewardDispatcher();
  // console.log(information);
  // console.log('issue?')
  // Approved
  // SwapRouter: '0xcf4291089EF31a6944B0F3168712421F776188c0',
  // StakingPools: '0x82097aa137cdB2Fa4Aa2444716f6d853c5c49dB3',
  // CONV: swaprouter and stakingpool
  // WETH: swaprouter and stakingpool
  // USDT: swaprouter and stakingpool
  // CLP:
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
