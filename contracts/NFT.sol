pragma solidity ^0.8.0;

import "./Library/ERC721.sol";
import "./Library/extensions/ERC721Enumerable.sol";

contract NFT is ERC721Enumerable {
    uint256 public constant MAX_SUPPLY = 10;

    constructor() ERC721("Hello World!", "HW") {}

    function mint(address to) external {
        uint256 ts = totalSupply();
        require(ts <= MAX_SUPPLY);

        _safeMint(to, ts + 1);
    }
}
