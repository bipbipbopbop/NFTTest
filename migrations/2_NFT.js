const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

const NFT = artifacts.require("NFT");

module.exports = function (deployer, network, accounts) {
  deployer.deploy(NFT, { from: accounts[0] });
};
