/**
 * SDK version of the pin_to_pinata.mjs script.
 * This script is deprecated and unused.
 */
import fs from "fs";
import path from "path";
import pinataClient from "@pinata/sdk";

import dotenv from "dotenv";
dotenv.config();

const pinToPinata = async () => {
  if (process.env.PINATA_JWT === undefined) {
    console.log("Error: you must add a PINATA_JWT variable in .env");
    return;
  }

  const pinata = pinataClient(
    process.env.PINATA_API_KEY,
    process.env.PINATA_API_SECRET
  );
  console.log(
    await pinata.pinFileToIPFS(
      fs.createReadStream(path.resolve("images/3.png"))
    )
  );

  console.log("done.");
};

pinToPinata();
