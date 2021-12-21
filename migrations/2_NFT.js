const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

const NFT = artifacts.require("NFT");

// 10 addresses
const whitelistAddresses = [
  //todo
]

module.exports = function (deployer) {
  // From the Open Zeppelin 'MerkleProof.sol' library:
  // Note: the hashing algorithm should be keccak256 and pair sorting should be enabled.
  const leafNodes = whitelistAddresses.map(addr => keccak256(addr));
  const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });

  deployer.deploy(NFT, merkleTree.getRoot());
};
