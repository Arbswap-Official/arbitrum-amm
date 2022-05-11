import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners()
    let addrNounce = await ethers.provider.getTransactionCount(deployer.address);

    const TetherToken = await ethers.getContractFactory("TetherMock", deployer);
    const tetherToken = await TetherToken.deploy("Tether", "USDT", ethers.utils.parseEther("10000000000"), {
        nonce: addrNounce
    });
    addrNounce++;
    console.log("USDT Token is deployed to: ", tetherToken.address);

    console.log("All Done")

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
