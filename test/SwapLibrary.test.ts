import { expect } from "chai"
import { ethers } from "hardhat"
import {keccak256} from "ethers/lib/utils";
import {expandTo18Decimals, getCreate2Address} from "./utilities";

describe("SwapLibrary", function () {
  before(async function () {
    this.signers = await ethers.getSigners()
    this.deployer = this.signers[0]
    this.minter = this.signers[1]
    this.SwapFactory = await ethers.getContractFactory("SwapFactory")
    this.ERC20Mock = await ethers.getContractFactory("ERC20Mock", this.minter)
    this.SwapPair = await ethers.getContractFactory("SwapPair")
    this.SwapLibraryDelegate = await ethers.getContractFactory("SwapLibraryDelegate")
  })

  beforeEach(async function () {
    this.swapLibrary = await this.SwapLibraryDelegate.deploy()
    this.factory = await this.SwapFactory.deploy(this.deployer.address)
    this.tokenA = await this.ERC20Mock.deploy("Token", "T", expandTo18Decimals(10000000000))
    this.tokenB = await this.ERC20Mock.deploy("Token", "T", expandTo18Decimals(10000000000))
    const pair = await this.factory.createPair(this.tokenA.address, this.tokenB.address)
    this.lpToken = await this.SwapPair.attach((await pair.wait()).events[0].args.pair)
  })

  it("getPair return correct create2 address", async function () {
    expect(await this.factory.pairCodeHash()).to.equal(keccak256(this.SwapPair.bytecode))

    expect(this.lpToken.address).to.equal(
        await this.swapLibrary.pairFor(this.factory.address,
            this.tokenA.address,
            this.tokenB.address))

    expect(this.lpToken.address).to.equal(
        getCreate2Address(this.factory.address,
            [this.tokenA.address, this.tokenB.address],
            this.SwapPair.bytecode))

  })

})
