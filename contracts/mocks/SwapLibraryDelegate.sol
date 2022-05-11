// SPDX-License-Identifier: MIT

pragma solidity >=0.5.0;

import '../libraries/SwapLibrary.sol';

contract SwapLibraryDelegate {

    function pairFor(address factory, address tokenA, address tokenB) external pure returns (address) {
        return SwapLibrary.pairFor(factory, tokenA, tokenB);
    }

}
