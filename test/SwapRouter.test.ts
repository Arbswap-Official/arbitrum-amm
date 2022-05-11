import { Contract, ContractFactory, ContractReceipt } from "@ethersproject/contracts"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address"
import { expect } from "chai"
import { BigNumber } from "ethers"
import { ethers } from "hardhat"
import { expandTo18Decimals, getCreate2Address } from "./utilities"
import { getBlockDateTime } from "./utilities/timeTravel"

const sortToken = (token0: string, token1: string): string[] => {
  return parseInt(token0, 16) > parseInt(token1, 16) ? [token1, token0] : [token0, token1]
}

const addLiquidity = async (
  lpProvider: SignerWithAddress,
  token0: Contract,
  token1: Contract,
  token0Amount: BigNumber,
  token1Amount: BigNumber,
  toAddress: string,
  lpToken: Contract
) => {
  await token0.connect(lpProvider).transfer(lpToken.address, token0Amount, { from: lpProvider.address })
  await token1.connect(lpProvider).transfer(lpToken.address, token1Amount, { from: lpProvider.address })
  await lpToken.connect(lpProvider).mint(toAddress)
}

describe("SwapRouter", () => {
  let signers: SignerWithAddress[]
  let deployer: SignerWithAddress, alice: SignerWithAddress, bob: SignerWithAddress, lpProvider: SignerWithAddress
  let SwapRouter: ContractFactory,
    SwapFactory: ContractFactory,
    ERC20Mock: ContractFactory,
    WETHMock: ContractFactory,
    SwapPair: ContractFactory
  let router: Contract, factory: Contract, tokenA: Contract, tokenB: Contract, weth9: Contract, tokenA_tokenB_lp: Contract

  before(async () => {
    signers = await ethers.getSigners()
    deployer = signers[0]
    alice = signers[1]
    bob = signers[2]
    lpProvider = signers[3]
    SwapRouter = await ethers.getContractFactory("SwapRouter")
    SwapFactory = await ethers.getContractFactory("SwapFactory")
    ERC20Mock = await ethers.getContractFactory("ERC20Mock", lpProvider)
    WETHMock = await ethers.getContractFactory("WETH9Mock")
    SwapPair = await ethers.getContractFactory("SwapPair")
  })

  beforeEach(async () => {
    factory = await SwapFactory.deploy(deployer.address)
    weth9 = await WETHMock.deploy()
    tokenA = await ERC20Mock.deploy("TokenA", "TA", expandTo18Decimals(10000000000))
    tokenB = await ERC20Mock.deploy("TokenB", "TB", expandTo18Decimals(10000000000))
    router = await SwapRouter.deploy(factory.address, weth9.address)
    const pair = await factory.createPair(sortToken(tokenA.address, tokenB.address)[0], sortToken(tokenA.address, tokenB.address)[1])
    tokenA_tokenB_lp = SwapPair.attach((await pair.wait()).events[0].args.pair)
    await addLiquidity.call(
      this,
      lpProvider,
      tokenA,
      tokenB,
      expandTo18Decimals(100),
      expandTo18Decimals(100),
      lpProvider.address,
      tokenA_tokenB_lp
    )
  })

  it("can create pair and add liquidity to SwapPair", async () => {
    const deadline: number = Math.floor((await getBlockDateTime(ethers.provider)).plus({ days: 1 }).toSeconds())
    const tokenC = await ERC20Mock.connect(lpProvider).deploy("TokenC", "TC", expandTo18Decimals(10000000000))
    const tokenD = await ERC20Mock.connect(lpProvider).deploy("TokenD", "TD", expandTo18Decimals(10000000000))
    await tokenC.connect(lpProvider).approve(router.address, expandTo18Decimals(10))
    await tokenD.connect(lpProvider).approve(router.address, expandTo18Decimals(10))
    await router
      .connect(lpProvider)
      .addLiquidity(
        tokenC.address,
        tokenD.address,
        expandTo18Decimals(10),
        expandTo18Decimals(10),
        expandTo18Decimals(1),
        expandTo18Decimals(1),
        lpProvider.address,
        deadline
      )
    const tokenC_tokenD_lp_address = await factory.getPair(tokenC.address, tokenD.address)
    expect(tokenC_tokenD_lp_address).to.eq(getCreate2Address(factory.address, [tokenC.address, tokenD.address], SwapPair.bytecode))
    const tokenC_tokenD_lp = SwapPair.attach(tokenC_tokenD_lp_address)
    expect(await tokenC.balanceOf(tokenC_tokenD_lp.address)).to.eq(expandTo18Decimals(10))
    expect(await tokenD.balanceOf(tokenC_tokenD_lp.address)).to.eq(expandTo18Decimals(10))
    expect(await tokenC_tokenD_lp.balanceOf(lpProvider.address)).to.eq("9999999999999999000")
  })

  it("can add liquidity to SwapPair - Token-Token LP", async () => {
    const deadline: number = Math.floor((await getBlockDateTime(ethers.provider)).plus({ days: 1 }).toSeconds())
    await tokenA.connect(lpProvider).approve(router.address, expandTo18Decimals(10))
    await tokenB.connect(lpProvider).approve(router.address, expandTo18Decimals(10))
    await router
      .connect(lpProvider)
      .addLiquidity(
        tokenA.address,
        tokenB.address,
        expandTo18Decimals(10),
        expandTo18Decimals(10),
        expandTo18Decimals(1),
        expandTo18Decimals(1),
        lpProvider.address,
        deadline
      )
    expect(await tokenA.balanceOf(tokenA_tokenB_lp.address)).to.eq(expandTo18Decimals(110))
    expect(await tokenB.balanceOf(tokenA_tokenB_lp.address)).to.eq(expandTo18Decimals(110))
    expect(await tokenA_tokenB_lp.balanceOf(lpProvider.address)).to.eq("109999999999999999000")
  })

  it("can add liquidity to SwapPair - Token-WETH LP", async () => {
    const deadline: number = Math.floor((await getBlockDateTime(ethers.provider)).plus({ days: 1 }).toSeconds())
    const wethPair = await await factory.createPair(sortToken(tokenA.address, weth9.address)[0], sortToken(tokenA.address, weth9.address)[1])
    await tokenA.connect(lpProvider).approve(router.address, expandTo18Decimals(10))
    const tokenA_weth_lp: Contract = SwapPair.attach((await wethPair.wait()).events[0].args.pair)
    await router
      .connect(lpProvider)
      .addLiquidityETH(tokenA.address, expandTo18Decimals(10), expandTo18Decimals(1), expandTo18Decimals(1), lpProvider.address, deadline, {
        value: expandTo18Decimals(10),
      })
    expect(await tokenA.balanceOf(tokenA_weth_lp.address)).to.eq(expandTo18Decimals(10))
    expect(await weth9.balanceOf(tokenA_weth_lp.address)).to.eq(expandTo18Decimals(10))
  })

  it("can remove liquidity from SwapPair - Token-Token LP", async () => {
    const deadline: number = Math.floor((await getBlockDateTime(ethers.provider)).plus({ days: 1 }).toSeconds())
    await tokenA_tokenB_lp.connect(lpProvider).approve(router.address, expandTo18Decimals(10))
    await router
      .connect(lpProvider)
      .removeLiquidity(
        tokenA.address,
        tokenB.address,
        expandTo18Decimals(10),
        expandTo18Decimals(10),
        expandTo18Decimals(10),
        lpProvider.address,
        deadline
      )
    expect(await tokenA.balanceOf(tokenA_tokenB_lp.address)).to.eq(expandTo18Decimals(90))
    expect(await tokenB.balanceOf(tokenA_tokenB_lp.address)).to.eq(expandTo18Decimals(90))
    expect(await tokenA_tokenB_lp.balanceOf(lpProvider.address)).to.eq("89999999999999999000")
    expect(await tokenA.balanceOf(lpProvider.address)).to.eq(expandTo18Decimals(9999999910))
    expect(await tokenB.balanceOf(lpProvider.address)).to.eq(expandTo18Decimals(9999999910))
  })

  it("can remove liquidity from SwapPair - Token-WETH LP", async () => {
    const deadline: number = Math.floor((await getBlockDateTime(ethers.provider)).plus({ days: 1 }).toSeconds())
    const wethPair = await await factory.createPair(sortToken(tokenA.address, weth9.address)[0], sortToken(tokenA.address, weth9.address)[1])
    await tokenA.connect(lpProvider).approve(router.address, expandTo18Decimals(10))
    const tokenA_weth_lp: Contract = SwapPair.attach((await wethPair.wait()).events[0].args.pair)
    await router
      .connect(lpProvider)
      .addLiquidityETH(tokenA.address, expandTo18Decimals(10), expandTo18Decimals(1), expandTo18Decimals(1), lpProvider.address, deadline, {
        value: expandTo18Decimals(10),
      })
    await tokenA_weth_lp.connect(lpProvider).approve(router.address, expandTo18Decimals(10))
    await router
      .connect(lpProvider)
      .removeLiquidityETH(tokenA.address, expandTo18Decimals(9), expandTo18Decimals(9), expandTo18Decimals(9), lpProvider.address, deadline)
  })

  it("can perform token swap - SwapPair - Exact Token for Token", async () => {
    const deadline: number = Math.floor((await getBlockDateTime(ethers.provider)).plus({ days: 1 }).toSeconds())
    const path = [tokenA.address, tokenB.address]
    const amountOut = await router.getAmountsOut(expandTo18Decimals(10), path)
    const tokenABal = await tokenA.balanceOf(lpProvider.address)
    const tokenBBal = await tokenB.balanceOf(lpProvider.address)
    await tokenA.connect(lpProvider).approve(router.address, expandTo18Decimals(10))
    await router.connect(lpProvider).swapExactTokensForTokens(expandTo18Decimals(10), amountOut[1], path, lpProvider.address, deadline)
    expect(await tokenA.balanceOf(lpProvider.address)).to.eq(tokenABal.sub(expandTo18Decimals(10)))
    expect(await tokenB.balanceOf(lpProvider.address)).to.eq(tokenBBal.add(amountOut[1]))
  })

  it("can perform token swap - SwapPair - Token for Exact Token", async () => {
    const deadline: number = Math.floor((await getBlockDateTime(ethers.provider)).plus({ days: 1 }).toSeconds())
    const path = [tokenA.address, tokenB.address]
    const amountIn = await router.getAmountsIn(expandTo18Decimals(10), path)
    const tokenABal = await tokenA.balanceOf(lpProvider.address)
    const tokenBBal = await tokenB.balanceOf(lpProvider.address)
    await tokenA.connect(lpProvider).approve(router.address, amountIn[0])
    await router.connect(lpProvider).swapTokensForExactTokens(expandTo18Decimals(10), amountIn[0], path, lpProvider.address, deadline)
    expect(await tokenA.balanceOf(lpProvider.address)).to.eq(tokenABal.sub(amountIn[0]))
    expect(await tokenB.balanceOf(lpProvider.address)).to.eq(tokenBBal.add(expandTo18Decimals(10)))
  })

  it("can perform token swap - SwapPair - Exact WETH for Token", async () => {
    const deadline: number = Math.floor((await getBlockDateTime(ethers.provider)).plus({ days: 1 }).toSeconds())
    const wethPair = await factory.createPair(sortToken(tokenA.address, weth9.address)[0], sortToken(tokenA.address, weth9.address)[1])
    await tokenA.connect(lpProvider).approve(router.address, expandTo18Decimals(10))
    SwapPair.attach((await wethPair.wait()).events[0].args.pair)
    await router
      .connect(lpProvider)
      .addLiquidityETH(tokenA.address, expandTo18Decimals(10), expandTo18Decimals(1), expandTo18Decimals(1), lpProvider.address, deadline, {
        value: expandTo18Decimals(10),
      })
    const path = [weth9.address, tokenA.address]
    const amountOut = await router.getAmountsOut(expandTo18Decimals(5), path)
    const tokenABal = await tokenA.balanceOf(lpProvider.address)
    const wethBal = await ethers.provider.getBalance(lpProvider.address)
    const swapTxn = await router.connect(lpProvider).swapExactETHForTokens(amountOut[1], path, lpProvider.address, deadline, {
      value: expandTo18Decimals(5),
    })
    const gasPrice = swapTxn.gasPrice
    const swapTxnReceipt = await swapTxn.wait()
    const gasUsed = swapTxnReceipt.gasUsed
    expect(await ethers.provider.getBalance(lpProvider.address)).to.eq(wethBal.sub(expandTo18Decimals(5)).sub(gasPrice.mul(gasUsed)))
    expect(await tokenA.balanceOf(lpProvider.address)).to.eq(tokenABal.add(amountOut[1]))
  })

  it("can perform token swap - SwapPair - Token for Exact WETH", async () => {
    const deadline: number = Math.floor((await getBlockDateTime(ethers.provider)).plus({ days: 1 }).toSeconds())
    const wethPair = await factory.createPair(sortToken(tokenA.address, weth9.address)[0], sortToken(tokenA.address, weth9.address)[1])
    await tokenA.connect(lpProvider).approve(router.address, expandTo18Decimals(10))
    SwapPair.attach((await wethPair.wait()).events[0].args.pair)
    await router
      .connect(lpProvider)
      .addLiquidityETH(tokenA.address, expandTo18Decimals(10), expandTo18Decimals(1), expandTo18Decimals(1), lpProvider.address, deadline, {
        value: expandTo18Decimals(10),
      })
    const path = [tokenA.address, weth9.address]
    const amountIn = await router.getAmountsIn(expandTo18Decimals(5), path)
    const tokenABal = await tokenA.balanceOf(lpProvider.address)
    await tokenA.connect(lpProvider).approve(router.address, amountIn[0])
    const wethBal = await ethers.provider.getBalance(lpProvider.address)
    const swapTxn = await router
      .connect(lpProvider)
      .swapTokensForExactETH(expandTo18Decimals(5), amountIn[0], path, lpProvider.address, deadline)
    const gasPrice = swapTxn.gasPrice
    const swapTxnReceipt = await swapTxn.wait()
    const gasUsed = swapTxnReceipt.gasUsed
    expect(await tokenA.balanceOf(lpProvider.address)).to.eq(tokenABal.sub(amountIn[0]))
    expect(await ethers.provider.getBalance(lpProvider.address)).to.eq(wethBal.add(expandTo18Decimals(5)).sub(gasPrice.mul(gasUsed)))
  })

  it("can perform token swap - SwapPair - Exact token for WETH", async () => {
    const deadline: number = Math.floor((await getBlockDateTime(ethers.provider)).plus({ days: 1 }).toSeconds())
    const wethPair = await factory.createPair(sortToken(tokenA.address, weth9.address)[0], sortToken(tokenA.address, weth9.address)[1])
    await tokenA.connect(lpProvider).approve(router.address, expandTo18Decimals(10))
    SwapPair.attach((await wethPair.wait()).events[0].args.pair)
    await router
      .connect(lpProvider)
      .addLiquidityETH(tokenA.address, expandTo18Decimals(10), expandTo18Decimals(1), expandTo18Decimals(1), lpProvider.address, deadline, {
        value: expandTo18Decimals(10),
      })
    const path = [tokenA.address, weth9.address]
    const amountOut = await router.getAmountsOut(expandTo18Decimals(5), path)
    const tokenABal = await tokenA.balanceOf(lpProvider.address)
    await tokenA.connect(lpProvider).approve(router.address, expandTo18Decimals(5))
    const wethBal = await ethers.provider.getBalance(lpProvider.address)
    const swapTxn = await router
      .connect(lpProvider)
      .swapExactTokensForETH(expandTo18Decimals(5), amountOut[1], path, lpProvider.address, deadline)
    const gasPrice = swapTxn.gasPrice
    const swapTxnReceipt = await swapTxn.wait()
    const gasUsed = swapTxnReceipt.gasUsed
    expect(await ethers.provider.getBalance(lpProvider.address)).to.eq(wethBal.add(amountOut[1]).sub(gasPrice.mul(gasUsed)))
    expect(await tokenA.balanceOf(lpProvider.address)).to.eq(tokenABal.sub(expandTo18Decimals(5)))
  })

  it("can perform token swap - SwapPair - WETH for Exact token", async () => {
    const deadline: number = Math.floor((await getBlockDateTime(ethers.provider)).plus({ days: 1 }).toSeconds())
    const wethPair = await factory.createPair(sortToken(tokenA.address, weth9.address)[0], sortToken(tokenA.address, weth9.address)[1])
    await tokenA.connect(lpProvider).approve(router.address, expandTo18Decimals(10))
    SwapPair.attach((await wethPair.wait()).events[0].args.pair)
    await router
      .connect(lpProvider)
      .addLiquidityETH(tokenA.address, expandTo18Decimals(10), expandTo18Decimals(1), expandTo18Decimals(1), lpProvider.address, deadline, {
        value: expandTo18Decimals(10),
      })
    const path = [weth9.address, tokenA.address]
    const amountIn = await router.getAmountsIn(expandTo18Decimals(5), path)
    const tokenABal = await tokenA.balanceOf(lpProvider.address)
    const wethBal = await ethers.provider.getBalance(lpProvider.address)
    const swapTxn = await router.connect(lpProvider).swapETHForExactTokens(expandTo18Decimals(5), path, lpProvider.address, deadline, {
      value: amountIn[0],
    })
    const gasPrice = swapTxn.gasPrice
    const swapTxnReceipt = await swapTxn.wait()
    const gasUsed = swapTxnReceipt.gasUsed
    expect(await ethers.provider.getBalance(lpProvider.address)).to.eq(wethBal.sub(amountIn[0]).sub(gasPrice.mul(gasUsed)))
    expect(await tokenA.balanceOf(lpProvider.address)).to.eq(tokenABal.add(expandTo18Decimals(5)))
  })
})
