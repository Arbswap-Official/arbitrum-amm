import { expect } from "chai"
import { ethers } from "hardhat"
import {ADDRESS_ZERO, expandTo18Decimals} from "./utilities";
import {BigNumber} from "ethers";
const MINIMUM_LIQUIDITY = 1000

async function addLiquidity(tokenAAmount: BigNumber, tokenBAmount: BigNumber, address) {
  await this.tokenA.connect(this.lpProvider).transfer(this.lpToken.address, tokenAAmount, {from: this.lpProvider.address})
  await this.tokenB.connect(this.lpProvider).transfer(this.lpToken.address, tokenBAmount, {from: this.lpProvider.address})
  await this.lpToken.connect(this.lpProvider).mint(address)
}

async function setup() {
  this.factory = await this.SwapFactory.deploy(this.deployer.address)
  const token0 = await this.ERC20Mock.deploy("Token", "T", expandTo18Decimals(10000000000))
  const token1 = await this.ERC20Mock.deploy("Token", "T", expandTo18Decimals(10000000000))
  this.tokenA = parseInt(token0.address, 16) > parseInt(token1.address, 16) ? token1 : token0;
  this.tokenB = parseInt(token0.address, 16) > parseInt(token1.address, 16) ? token0 : token1;
  const pair = await this.factory.createPair(this.tokenA.address, this.tokenB.address)
  this.lpToken = await this.SwapPair.attach((await pair.wait()).events[0].args.pair)
}

describe("SwapPair", function () {

  before(async function () {
    this.signers = await ethers.getSigners()
    this.deployer = this.signers[0]
    this.lpProvider = this.signers[1]
    this.trader = this.signers[2]
    this.feeTo = this.signers[3]
    this.SwapFactory = await ethers.getContractFactory("SwapFactory")
    this.ERC20Mock = await ethers.getContractFactory("ERC20Mock", this.lpProvider)
    this.SwapPair = await ethers.getContractFactory("SwapPair")
  })

  beforeEach(setup)

  it("User can mint lp token when they add liquidity to the pool", async function () {
    const tokenAAmount = expandTo18Decimals(1);
    const tokenBAmount = expandTo18Decimals(4);
    await this.tokenA.connect(this.lpProvider).transfer(this.lpToken.address, tokenAAmount, {from: this.lpProvider.address})
    await this.tokenB.connect(this.lpProvider).transfer(this.lpToken.address, tokenBAmount, {from: this.lpProvider.address})

    await expect(this.lpToken.connect(this.lpProvider).mint(this.lpProvider.address))
        .to.emit(this.lpToken, 'Transfer')
        .withArgs(ADDRESS_ZERO, ADDRESS_ZERO, MINIMUM_LIQUIDITY)
        .to.emit(this.lpToken, 'Transfer')
        .withArgs(ADDRESS_ZERO, this.lpProvider.address, expandTo18Decimals(2).sub(MINIMUM_LIQUIDITY))
        .to.emit(this.lpToken, 'Sync')
        .withArgs(tokenAAmount, tokenBAmount)
        .to.emit(this.lpToken, 'Mint')
        .withArgs(this.lpProvider.address, tokenAAmount, tokenBAmount)

    expect(await this.lpToken.balanceOf(this.lpProvider.address)).to.equal(expandTo18Decimals(2).sub(MINIMUM_LIQUIDITY))
    expect(await this.lpToken.totalSupply()).to.eq(expandTo18Decimals(2))
    expect(await this.lpToken.balanceOf(this.lpProvider.address)).to.eq(expandTo18Decimals(2).sub(MINIMUM_LIQUIDITY))
    expect(await this.tokenA.balanceOf(this.lpToken.address)).to.eq(tokenAAmount)
    expect(await this.tokenB.balanceOf(this.lpToken.address)).to.eq(tokenBAmount)
    const reserves = await this.lpToken.getReserves()
    expect(reserves[0]).to.eq(tokenAAmount)
    expect(reserves[1]).to.eq(tokenBAmount)
  })

  it("User get output token when they swap", async function () {
    const swapTestCases: BigNumber[][] = [
      [1, 5, 10, '1662497915624478906'],
      [1, 10, 5, '453305446940074565'],

      [2, 5, 10, '2851015155847869602'],
      [2, 10, 5, '831248957812239453'],

      [1, 10, 10, '906610893880149131'],
      [1, 100, 100, '987158034397061298'],
      [1, 1000, 1000, '996006981039903216']
    ].map(a => a.map(n => (typeof n === 'string' ? BigNumber.from(n) : expandTo18Decimals(n))))

    for (let swapTestCase of swapTestCases) {
      const [swapAmount, tokenAAmount, tokenBAmount, expectedOutputAmount] = swapTestCase
      await setup.call(this)
      const address = this.lpProvider.address;
      await addLiquidity.call(this, tokenAAmount, tokenBAmount, address);
      await this.tokenA.transfer(this.lpToken.address, swapAmount)
      await expect(this.lpToken.connect(this.trader).swap(0, expectedOutputAmount.add(1), address, '0x')).to.be.revertedWith(
          ' Arbswap: K'
      )
      await this.lpToken.swap(0, expectedOutputAmount, address, '0x')
    }
  })

  it("User get back their input token minus transaction fee", async function () {
    const swapTestCases: BigNumber[][] = [
      [1, 5, 10, '997000000000000000'],
      [1, 10, 5, '997000000000000000'],
      [1, 5, 5, '997000000000000000'],
      ['1003009027081243732', 5, 5, 1]
    ].map(a => a.map(n => (typeof n === 'string' ? BigNumber.from(n) : expandTo18Decimals(n))))

    for (let swapTestCase of swapTestCases) {
      const [swapAmount, tokenAAmount, tokenBAmount, expectedOutputAmount] = swapTestCase
      await setup.call(this)
      const address = this.lpProvider.address;
      await addLiquidity.call(this, tokenAAmount, tokenBAmount, address);
      await this.tokenA.transfer(this.lpToken.address, swapAmount)
      await expect(this.lpToken.connect(this.trader).swap(expectedOutputAmount.add(1), 0, address, '0x')).to.be.revertedWith(
          ' Arbswap: K'
      )
      await this.lpToken.swap(expectedOutputAmount, 0, address, '0x')
    }
  })

  it("The remaining amount in the pool after swapping is correct", async function () {

    const tokenAAmount = expandTo18Decimals(5)
    const tokenBAmount = expandTo18Decimals(10)

    const swapAmount = expandTo18Decimals(1)
    const expectedOutputAmount = BigNumber.from('1662497915624478906')
    await setup.call(this)

    const address = this.lpProvider.address;
    await addLiquidity.call(this, tokenAAmount, tokenBAmount, address);
    await this.tokenA.transfer(this.lpToken.address, swapAmount)

    await expect(this.lpToken.connect(this.trader).swap(0, expectedOutputAmount, address, '0x'))
        .to.emit(this.tokenB, 'Transfer')
        .withArgs(this.lpToken.address, address, expectedOutputAmount)
        .to.emit(this.lpToken, 'Sync')
        .withArgs(tokenAAmount.add(swapAmount), tokenBAmount.sub(expectedOutputAmount))
        .to.emit(this.lpToken, 'Swap')
        .withArgs(this.trader.address, swapAmount, 0, 0, expectedOutputAmount, address)

    const reserves = await this.lpToken.getReserves()
    expect(reserves[0]).to.eq(tokenAAmount.add(swapAmount))
    expect(reserves[1]).to.eq(tokenBAmount.sub(expectedOutputAmount))
    expect(await this.tokenA.balanceOf(this.lpToken.address)).to.eq(tokenAAmount.add(swapAmount))
    expect(await this.tokenB.balanceOf(this.lpToken.address)).to.eq(tokenBAmount.sub(expectedOutputAmount))
    const totalSupplyTokenA = await this.tokenA.totalSupply()
    const totalSupplyTokenB = await this.tokenB.totalSupply()
    expect(await this.tokenA.balanceOf(address)).to.eq(totalSupplyTokenA.sub(tokenAAmount).sub(swapAmount))
    expect(await this.tokenB.balanceOf(address)).to.eq(totalSupplyTokenB.sub(tokenBAmount).add(expectedOutputAmount))
  })

  it("burn", async function () {
    const tokenAAmount = expandTo18Decimals(3)
    const tokenBAmount = expandTo18Decimals(3)
    const expectedLiquidity = expandTo18Decimals(3)

    await setup.call(this)
    const address = this.lpProvider.address;
    await addLiquidity.call(this, tokenAAmount, tokenBAmount, address);
    await this.lpToken.connect(this.lpProvider).transfer(this.lpToken.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))

    await expect(this.lpToken.connect(this.lpProvider).burn(this.lpProvider.address))
        .to.emit(this.lpToken, 'Transfer')
        .withArgs(this.lpToken.address, ADDRESS_ZERO, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
        .to.emit(this.tokenA, 'Transfer')
        .withArgs(this.lpToken.address, this.lpProvider.address, tokenAAmount.sub(1000))
        .to.emit(this.tokenB, 'Transfer')
        .withArgs(this.lpToken.address, this.lpProvider.address, tokenBAmount.sub(1000))
        .to.emit(this.lpToken, 'Sync')
        .withArgs(1000, 1000)
        .to.emit(this.lpToken, 'Burn')
        .withArgs(this.lpProvider.address, tokenAAmount.sub(1000), tokenBAmount.sub(1000), this.lpProvider.address)

    expect(await this.lpToken.balanceOf(address)).to.eq(0)
    expect(await this.lpToken.totalSupply()).to.eq(MINIMUM_LIQUIDITY)
    expect(await this.tokenA.balanceOf(this.lpToken.address)).to.eq(1000)
    expect(await this.tokenB.balanceOf(this.lpToken.address)).to.eq(1000)
    const totalSupplyToken0 = await this.tokenA.totalSupply()
    const totalSupplyToken1 = await this.tokenB.totalSupply()
    expect(await this.tokenA.balanceOf(address)).to.eq(totalSupplyToken0.sub(1000))
    expect(await this.tokenB.balanceOf(address)).to.eq(totalSupplyToken1.sub(1000))

  })

  it("feeTo:off", async function () {
    const swapTestCases: BigNumber[][] = [
      [1, 1000, 1000, '996006981039903216', 1000]
    ].map(a => a.map(n => (typeof n === 'string' ? BigNumber.from(n) : expandTo18Decimals(n))))

    for (let swapTestCase of swapTestCases) {
      const [swapAmount, tokenAAmount, tokenBAmount, expectedOutputAmount, expectedLiquidity] = swapTestCase
      await setup.call(this)

      const address = this.lpProvider.address;
      await addLiquidity.call(this, tokenAAmount, tokenBAmount, address);
      await this.tokenB.transfer(this.lpToken.address, swapAmount)
      await this.lpToken.swap(expectedOutputAmount, 0, address, '0x')
      await this.lpToken.connect(this.lpProvider).transfer(this.lpToken.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
      await this.lpToken.burn(this.lpProvider.address)

      expect(await this.lpToken.totalSupply()).to.eq(BigNumber.from(MINIMUM_LIQUIDITY))
      expect(await this.lpToken.balanceOf(this.feeTo.address)).to.eq(0)

    }
  })

  it("feeTo:on", async function () {
    const swapTestCases: BigNumber[][] = [
      [1, 1000, 1000, '996006981039903216', 1000]
    ].map(a => a.map(n => (typeof n === 'string' ? BigNumber.from(n) : expandTo18Decimals(n))))

    for (let swapTestCase of swapTestCases) {
      const [swapAmount, tokenAAmount, tokenBAmount, expectedOutputAmount, expectedLiquidity] = swapTestCase
      await setup.call(this)

      await this.factory.setFeeTo(this.feeTo.address);
      const address = this.lpProvider.address;
      await addLiquidity.call(this, tokenAAmount, tokenBAmount, address);
      await this.tokenB.transfer(this.lpToken.address, swapAmount)
      await this.lpToken.swap(expectedOutputAmount, 0, address, '0x')
      await this.lpToken.connect(this.lpProvider).transfer(this.lpToken.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
      await this.lpToken.burn(this.lpProvider.address)

      expect(await this.lpToken.totalSupply()).to.eq(BigNumber.from(MINIMUM_LIQUIDITY).add('249750499251388'))
      expect(await this.lpToken.balanceOf(this.feeTo.address)).to.eq('249750499251388')

      // using 1000 here instead of the symbolic MINIMUM_LIQUIDITY because the amounts only happen to be equal...
      // ...because the initial liquidity amounts were equal
      expect(await this.tokenA.balanceOf(this.lpToken.address)).to.eq(BigNumber.from(1000).add('249501683697445'))
      expect(await this.tokenB.balanceOf(this.lpToken.address)).to.eq(BigNumber.from(1000).add('250000187312969'))

    }
  })


})
