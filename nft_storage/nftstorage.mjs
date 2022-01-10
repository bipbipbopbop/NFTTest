import { NFTStorage, File } from 'nft.storage';

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.NFT_STORAGE_KEY;
const client = new NFTStorage({ token: apiKey })

// get all images in images/ dir
const imagesPath = path.resolve("images");
const images = fs.readdirSync(imagesPath);

const imagesFile = [];
for (const image of images) {
	imagesFile.push(new File(fs.readFileSync(path.resolve(imagesPath, image)), image, { type: 'image/png' }));
}
const cid = await client.storeDirectory(imagesFile);
// console.log(cid);

for (let index = 0; index < images.length; ++index) {
	const image = images[index];
	const metadata = await client.store({
		name: path.basename(image, ".png"),
		description: path.basename(image),
		image: cid + "/" + path.basename(image),
	})
	console.log(metadata.url);
}