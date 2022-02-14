/**
 * usage: `hardat run <this file path>`
 * 
 * NB: It will run on a new fork by default. To use another one, add this env variable first:
 * `export HARDHAT_NETWORK=development`
 * and dont forget to run your local network:
 * `hardhat node`
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
