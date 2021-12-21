pragma solidity ^0.8.0;

import "./Library/ERC721.sol";
import "./Library/extensions/ERC721Enumerable.sol";
import "./Library/utils/MerkleProof.sol";

contract NFT is ERC721Enumerable {
    uint256 public constant MAX_SUPPLY = 10;
    bytes32 public merkleRoot;
    mapping(address => uint256) public whitelistClaimed;

    constructor(bytes32 merkleRoot_) ERC721("Hello World!", "HW") {
        merkleRoot = merkleRoot_;
    }

    /**
     * onAllowList: Check if a leaf with the 'claimer' value is present in the
     * stored merkle tree. see Open Zeppelin's 'merkleRoot' library implementation.
     */
    function onAllowList(address claimer, bytes32[] memory proof) public view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(claimer));
        return MerkleProof.verify(proof, merkleRoot, leaf);
    }

    function mint(bytes32[] calldata merkleProof) external {
        uint256 ts = totalSupply();
        require(ts < MAX_SUPPLY, "All tokens have been claimed.");
        require(onAllowList(msg.sender, merkleProof), "Not on allow list.");
        require(whitelistClaimed[msg.sender] == 0, "Token already claimed.");

        whitelistClaimed[msg.sender] += 1;
        _safeMint(msg.sender, ts);
    }
}
