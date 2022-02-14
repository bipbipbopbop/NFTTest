/**
 * usage: `hardat run [--network <Your Network>] <this file path>`
 * 
 * NB: If you don't provide a network, it will run on a new temporary fork by default.
 * `localhost` is a default name to connect to your local fork, run it with `hardhat node`
 */
import { ethers } from "hardhat";

async function main() {
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const NFT = await ethers.getContractFactory("NFT");
  const NFTInstance = await NFT.deploy();

  await NFTInstance.deployed();

  console.log("NFTInstance deployed to: ", NFTInstance.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
