import { providers } from "ethers";
import { DateTime } from "luxon";

/**
 * To have complete control over block time, we need to stop automatic mining,
 * and mine every single block manually.
 * @param provider JSON RPC provider
 */
export function setNextBlockTimestamp(
  provider: providers.JsonRpcProvider,
  timestamp: number | DateTime
): Promise<void> {
  return provider.send("evm_setNextBlockTimestamp", [
    typeof timestamp === "number" ? timestamp : timestamp.toSeconds(),
  ]);
}

/**
 * Set the block number of the next block by mining empty blocks.
 * @param provider JSON RPC provider
 * @param number number of the next block
 */
export async function setNextBlockNumber(
  provider: providers.JsonRpcProvider,
  number: number
): Promise<void> {
  const currentBlock = await provider.getBlock("latest");

  if (currentBlock.number >= number)
    throw new Error("Impossible block number target");

  // No need to mine any block
  if (currentBlock.number === number - 1) return;

  for (let ind = 0; ind < number - currentBlock.number - 1; ind++)
    await provider.send("evm_mine", []);
}

/**
 * Mine a block with a specific timestamp. This is helpful when performing time-dependent
 * contract reads.
 * @param provider JSON RPC provider
 * @param timestamp Unix timestamp in seconds
 */
export function mineBlock(
  provider: providers.JsonRpcProvider,
  timestamp?: number | DateTime
): Promise<void> {
  return provider.send(
    "evm_mine",
    timestamp
      ? [typeof timestamp === "number" ? timestamp : timestamp.toSeconds()]
      : []
  );
}

/**
 * Get the timestamp of the latest block.
 * @param provider JSON RPC provider
 */
export async function getBlockDateTime(
  provider: providers.JsonRpcProvider
): Promise<DateTime> {
  const lastestBlock = provider.getBlock("latest");
  return DateTime.fromSeconds((await lastestBlock).timestamp);
}
