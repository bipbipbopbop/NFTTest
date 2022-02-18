/**
 * usage: `hardat run [--network <Your Network>] <this file path>`
 * 
 * NB: If you don't provide a network, it will run on a new temporary fork by default.
 * `localhost` is a default name to connect to your local fork, run it with `hardhat node`
 */
import { ethers } from "hardhat";
import { generateMetadata } from "../ipfs/generate_metadata";
import { pinToPinata } from "../ipfs/pin_to_pinata";
import path from "path";
import Ctl from "ipfsd-ctl";
import { assert } from "console";


const deployData = async () => {
  // 1: spawn an IFPS node
  const ipfsd = await Ctl.createController({
    ipfsHttpModule: require('ipfs-http-client'),
    ipfsBin: require('go-ipfs').path(),
    type: "go",
    disposable: true,
  });

  // todo: ipfs.api.add doesn't read the directory content
  try {
    console.log("starting data deployment...");
    // 2: deploy images to pinata.cloud
    const images = await ipfsd.api.add({ path: path.resolve("data/images") });
    const imagesPin = await pinToPinata(images.cid.toString(), "images");
    // assert(imagesPin.status !== "failed");
    console.log("images deployed.");

    // 3: generate metadata entries
    const metadataDir = generateMetadata(imagesPin.cid.toString(), path.resolve("data"));

    // 4: deploy metadata to pinata.cloud
    const metadata = await ipfsd.api.add({ path: path.resolve(metadataDir) });
    const metadataPin = await pinToPinata(metadata.cid.toString(), "metadata");
    // assert(metadataPin.status !== "failed");
    console.log("metadata deployed.");

    console.log("\nThe deployment succeed.");
    console.log("Images CID: " + imagesPin.cid.toString());
    console.log("Metadata CID: " + metadataPin.cid.toString());
  }
  catch (e: any) {
    console.log(e);
  }

  // cleanup
  await ipfsd.stop();
}

async function main() {
  await deployData();
};

main();