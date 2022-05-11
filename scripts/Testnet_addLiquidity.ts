import {ethers, network} from "hardhat"
import {expandToNDecimals, loadDeployedAddress, saveDeployedAddress} from "./utilities"
import {WETH} from "./utilities/constants";
import { DateTime, Duration } from "luxon";
import { BigNumber } from "ethers";

async function main() {
    const [deployer] = await ethers.getSigners()

    const SwapRouter = await ethers.getContractFactory("SwapRouter", deployer)
    const swapRouter = SwapRouter.attach("0x97055288B1130088a05B9445fa3a80d9a8f79555")

    const TetherToken = await ethers.getContractFactory("ERC20Mock", deployer);
    const tetherToken = TetherToken.attach("0x48a4052198F268833B6f577c6ac06087cFE3F688")
    console.log("USDT is deployed to: ", tetherToken.address);

    const approveTx = await tetherToken.connect(deployer).approve(swapRouter.address, ethers.utils.parseEther("10000000"));
    await approveTx.wait();

    console.log("Adding liquidity to USDT-ETH Pool")
    await swapRouter.connect(deployer).addLiquidityETH(
        tetherToken.address,
        expandToNDecimals(0.3, 6),
        expandToNDecimals(0.3, 6),
        ethers.utils.parseEther("0.01"),
        deployer.address,
        BigNumber.from(Math.floor(DateTime.now().plus(Duration.fromObject({days: 1})).toSeconds())), {
            value: ethers.utils.parseEther("0.1")
        }
    )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });