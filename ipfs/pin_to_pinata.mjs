import * as IPFS from "ipfs-http-client";

import dotenv from "dotenv";
dotenv.config();

const pinToPinata = async () => {
	const myArgs = process.argv.slice(2);
	if (myArgs.length != 1) {
		console.log("Error: you must provide one argument: the CID of your data to pin.");
		return;
	}
	if (process.env.PINATA_JWT === undefined) {
		console.log("Error: you must add a PINATA_JWT variable in .env");
		return;
	}

	const ipfs = await IPFS.create();//fallback to default API address
	// Add the Pinata service
	const service = await ipfs.pin.remote.service.add("pinata", {
		endpoint: new URL('https://api.pinata.cloud/psa'),
		key: process.env.PINATA_JWT,
	});
	if (service) {
		console.log("service added: ");
	}

	// Pin the data to Pinata
	const pinnedData = await ipfs.pin.remote.add(IPFS.CID.parse(myargs[0]), {
		service: 'pinata',
	});
	if (pinnedData) {
		console.log("data pinned: ");
	}
	console.log("done.");
};

pinToPinata();