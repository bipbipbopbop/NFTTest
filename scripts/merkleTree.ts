/**
 * usage: `hardat run [--network <Your Network>] <this file path>`
 *
 * NB: If you don't provide a network, it will run on a new temporary fork by default.
 * `localhost` is a default name to connect to your local fork, run it with `hardhat node`
 */
import { ethers } from "hardhat";
import { NFT } from "../typechain";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

// todo: I can't find the type appropriately from hardhat-ethers
type SignerWithAddress = any;

async function main() {
  let deployer: SignerWithAddress;
  let whitelistAccounts: SignerWithAddress[];

  // prepare 8 addresses for the tests
  const accounts = await ethers.getSigners();
  deployer = accounts[0];
  whitelistAccounts = accounts.slice(1, 9);
  if (whitelistAccounts.length !== 8) {
    console.log("ERROR: The whitelist array must contains 8 addresses.");
    console.log("whitelist size is " + whitelistAccounts.length);
    return;
  }

  // Create the merkleTree for the whitelist
  // Note: from the Open Zeppelin 'MerkleProof.sol' library:
  // The hashing algorithm should be keccak256 and pair sorting should be enabled.
  const leafNodes = whitelistAccounts.map((acc) => keccak256(acc.address));
  const whitelistMerkleTree = new MerkleTree(leafNodes, keccak256, {
    sortPairs: true,
  });

  const NFTInstance = await (
    await ethers.getContractFactory("NFT")
  ).attach("0x16223A0a11BA905287A734ddA131908E28ccD188");
  await NFTInstance.setWhitelist(whitelistMerkleTree.getRoot());

  const account = whitelistAccounts[0];
  const merkleProof = whitelistMerkleTree.getHexProof(
    keccak256(account.address)
  );
  if ((await NFTInstance.onAllowList(account.address, merkleProof)) === true) {
    console.log("account " + account.address + " is on the AllowList.");
    // await NFTInstance.connect(account).mint(merkleProof);
  } else {
    console.log("ERROR: not on whitelist");
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
