/**
 * Take the CID of the images' folder deployed on IPFS,
 * and generate metadata for each images, as if they were NFT.
 * The output is stored in a new directory called "metadata/".
 */
import fs from "fs";
import path from "path";

/**
 * metadata format:
 * {
 *     title: "PROJECT_NAME Metadata",
 *     name: "PROJECT_NAME",
 *     description: "whatever",
 *     image: "URI"
 * }
 */
export const generateMetadata = (CID: string, workingDir: string) => {
  // prepare the metadata
  const title = "NFT_Test Metadata";
  const name = "NFT_Test";
  const description = "This is a test about deploying NFT on blockchain!";
  const DirectoryCID = CID;

  // create output folder
  fs.mkdirSync(path.resolve("metadata"), { recursive: true });

  // get all NFT (images) list
  const files = fs.readdirSync(path.resolve(workingDir, "images"));
  for (const elem of files) {
    const URI = "ipfs://" + DirectoryCID + "/" + elem;
    const metadata = {
      title: title,
      name: name,
      description: description,
      image: URI,
    };

    // generate the metadata, one per image
    fs.writeFileSync(
      path.resolve(workingDir, "metadata/", path.parse(elem).name + ".json"),
      JSON.stringify(metadata)
    );
  }
};

const _generateMetadata = () => {
  const myArgs = process.argv.slice(2);
  if (myArgs.length != 1) {
    console.log(
      "Error: you must provide one argument: the CID of the images' directory stored on IPFS."
    );
    return;
  };
  generateMetadata(myArgs[0], path.resolve("./"));
};

// check if this file is run directly
if (require.main === module) {
  _generateMetadata();
}
