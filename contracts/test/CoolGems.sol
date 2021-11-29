// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "../RandomBox.sol";

contract CoolGems is ERC721 {

    RandomBox randomBox;
    uint256 next = 1;

    constructor(address _randomBoxAddress) ERC721("CoolGems", "CG") {
        randomBox = RandomBox(_randomBoxAddress);
    }

    function mintRandomBox() external {
        uint256 tokenId = next;
        next += 3;

        _mint(address(this), tokenId);
        _mint(address(this), tokenId + 1);
        _mint(address(this), tokenId + 2);

        CoolGems(this).setApprovalForAll(address(randomBox), true);

        uint256 boxId = randomBox.create();

        randomBox.deposit(boxId, address(this), tokenId);
        randomBox.deposit(boxId, address(this), tokenId + 1);
        randomBox.deposit(boxId, address(this), tokenId + 2);

        randomBox.lock(boxId);

        randomBox.transferFrom(address(this), msg.sender, boxId);
    }
}
