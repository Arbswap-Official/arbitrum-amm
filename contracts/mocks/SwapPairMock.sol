// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "../swap/SwapPair.sol";

contract SwapPairMock is SwapPair {
    constructor() public SwapPair() {}
}