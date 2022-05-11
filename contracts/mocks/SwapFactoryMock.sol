// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "../swap/SwapFactory.sol";

contract SwapFactoryMock is SwapFactory {
    constructor(address _feeToSetter) public SwapFactory(_feeToSetter) {}
}