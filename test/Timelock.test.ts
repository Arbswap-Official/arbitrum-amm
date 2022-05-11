import { ethers } from "hardhat";
import { expect } from "chai";
import {encodeParameters, latest, duration, increase, expandTo18Decimals} from "./utilities"

describe("Timelock", function () {
  before(async function () {
    this.signers = await ethers.getSigners()
    this.deployer = this.signers[0]
    this.bob = this.signers[1]
    this.carol = this.signers[2]
    this.Timelock = await ethers.getContractFactory("Timelock")
    this.SwapFactory = await ethers.getContractFactory("SwapFactory")
  })

  beforeEach(async function () {
    this.factory = await this.SwapFactory.deploy(this.deployer.address)
    this.timelock = await this.Timelock.deploy(this.bob.address, "259200")
  })

  it("should not allow non-owner to do operation", async function () {
    await this.factory.setFeeToSetter(this.timelock.address)
    await expect(this.factory.setFeeToSetter(this.carol.address)).to.be.revertedWith("Arbswap: FORBIDDEN")
    await expect(this.factory.connect(this.bob).setFeeToSetter(this.carol.address)).to.be.revertedWith("Arbswap: FORBIDDEN")

    await expect(
      this.timelock.queueTransaction(
        this.factory.address,
        "0",
        "setFeeToSetter(address)",
        encodeParameters(["address"], [this.carol.address]),
        (await latest()).add(duration.days(4))
      )
    ).to.be.revertedWith("Timelock::queueTransaction: Call must come from admin.")
  })

  it("should do the timelock thing", async function () {
    await this.factory.setFeeToSetter(this.timelock.address)
    const eta = (await latest()).add(duration.days(4))
    await this.timelock
      .connect(this.bob)
      .queueTransaction(this.factory.address, "0", "setFeeToSetter(address)", encodeParameters(["address"], [this.carol.address]), eta)
    await increase(duration.days(1))
    await expect(
      this.timelock
        .connect(this.bob)
        .executeTransaction(this.factory.address, "0", "setFeeToSetter(address)", encodeParameters(["address"], [this.carol.address]), eta)
    ).to.be.revertedWith("Timelock::executeTransaction: Transaction hasn't surpassed time lock.")
    await increase(duration.days(4))
    await this.timelock
      .connect(this.bob)
      .executeTransaction(this.factory.address, "0", "setFeeToSetter(address)", encodeParameters(["address"], [this.carol.address]), eta)
    expect(await this.factory.feeToSetter()).to.equal(this.carol.address)
  })

})
