import {ethers, network} from "hardhat"
import {loadDeployedAddress, saveDeployedAddress} from "./utilities"
import {WETH} from "./utilities/constants";
import { DateTime, Duration } from "luxon";
import { BigNumber } from "ethers";

async function main() {
    const [deployer] = await ethers.getSigners()

    const SwapRouter = await ethers.getContractFactory("SwapRouter", deployer)
    const swapRouter = SwapRouter.attach("0x0a968b282AB73CAf329BF4C1C16C580d0F781113")

    const TetherToken = await ethers.getContractFactory("ERC20Mock", deployer);
    const tetherToken = TetherToken.attach("0x48a4052198F268833B6f577c6ac06087cFE3F688")
    console.log("USDT is deployed to: ", tetherToken.address);

    const approveTx = await tetherToken.connect(deployer).approve(swapRouter.address, ethers.utils.parseEther("10000000"));
    await approveTx.wait();

    console.log("Adding liquidity to USDT-ETH Pool")
    await swapRouter.connect(deployer).addLiquidityETH(
        tetherToken.address,
        ethers.utils.parseEther("10"),
        ethers.utils.parseEther("0.01"),
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