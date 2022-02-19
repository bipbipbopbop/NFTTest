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
import fs from "fs";
import Ctl from "ipfsd-ctl";
import { assert } from "console";
import { ImportCandidate} from "ipfs-core-types/types/src/utils";
import { AddResult } from "ipfs-core-types/src/root";

const deployData = async () => {
  const ipfsImagesDir = "images";
  const localImagesDir = path.resolve("data/", ipfsImagesDir);
  const ipfsMetadataDir = "metadata";
  const localMetadataDir = path.resolve("data/", ipfsMetadataDir);

  // 1: spawn an IFPS node
  const ipfsd = await Ctl.createController({
    ipfsHttpModule: require('ipfs-http-client'),
    ipfsBin: require('go-ipfs').path(),
    type: "go",
    disposable: true,
  });

  try {
    console.log("starting data deployment...");

    // 2: deploy images to pinata.cloud
    const imagesFiles: string[] = fs.readdirSync(localImagesDir);
    const imagesToImport: ImportCandidate[] = [];
    imagesToImport.push(...(imagesFiles.map<ImportCandidate>(
      (file) => ({
        path: ipfsImagesDir + "/" + file,
        content: fs.readFileSync(path.resolve(localImagesDir, file))
      }))));
    const imagesPromise = await ipfsd.api.addAll(imagesToImport);
    let images: AddResult;
    for await (images of imagesPromise);//get last element: the directory

    const imagesPin = await pinToPinata(images!.cid.toString(), "images");
    console.log("images deployed. CID= " + imagesPin.cid.toString());

    // 3: generate metadata entries
    const metadataDir = generateMetadata(imagesPin.cid.toString(), path.resolve("data"));

    // 4: deploy metadata to pinata.cloud
    const metadataFiles: string[] = fs.readdirSync(localMetadataDir);
    const metadataToImport: ImportCandidate[] = [];
    metadataToImport.push(...(metadataFiles.map<ImportCandidate>(
      (file) => ({
        path: ipfsMetadataDir + "/" + file,
        content: fs.readFileSync(path.resolve(localMetadataDir, file))
      }))));
    const metadataPromise = await ipfsd.api.addAll(metadataToImport);
    let metadata: AddResult;
    for await (metadata of metadataPromise);//get last element: the directory
    
    const metadataPin = await pinToPinata(metadata!.cid.toString(), "metadata");
    console.log("metadata deployed. CID= " + metadataPin.cid.toString());

    console.log("\nThe deployment succeed.");
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