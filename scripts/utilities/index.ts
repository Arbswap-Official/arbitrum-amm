import path = require("path");
import fs = require("fs");
import { ethers, network } from "hardhat";
import { WETH } from "./constants";
import { BigNumber } from "ethers";

export async function loadDeployedAddress(network, name) {
  let filePath = persistedDeploymentFilePath(network, name);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  let json = fs.readFileSync(filePath, "utf8");
  return JSON.parse(json).address;
}

export async function saveDeployedAddress(network, name, address) {
  let filePath = persistedDeploymentFilePath(network, name);
  ensureDirectoryExistence(filePath);
  fs.writeFileSync(filePath, JSON.stringify({ address: address }, null, 2));
  console.log(name + " deployment saved to " + filePath);
}

function ensureDirectoryExistence(filePath) {
  var dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

function persistedDeploymentFilePath(network, name) {
  return path.join(__dirname, "../../deployed", network, name + ".json");
}

export async function loadWETH9AddressOrDeployToLocal(deployer) {
  if ("localhost" == network.name || "hardhat" == network.name) {
    const WETH9 = await ethers.getContractFactory("WETH9", deployer);
    let wethAddress = (await WETH9.deploy()).address;
    console.log("Deploying weth9 to " + network.name + " at " + wethAddress);
    return wethAddress;
  } else if (network.name in WETH) {
    let wethAddress = WETH[network.name];
    console.log("Running in network " + network.name + " Using weth9 at " + wethAddress);
    return wethAddress;
  } else {
    throw Error("No WETH!");
  }
}

export function expandToNDecimals(num: number, n: number): BigNumber {
  while (!Number.isInteger(num)) {
    num *= 10;
    if (--n < 0) return BigNumber.from(0);
  }

  return BigNumber.from(num).mul(BigNumber.from(10).pow(n));
}

export function expandTo18Decimals(num: number): BigNumber {
  return expandToNDecimals(num, 18);
}

export function expandTo6Decimals(num: number): BigNumber {
  return expandToNDecimals(num, 6);
}
