const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const assert = require("assert");

const NFT = artifacts.require("NFT");

contract("NFT", (accounts) => {
	let NFTInstance;
	let whitelistMerkleTree;

	// const deployer = accounts[0];
	let whitelistAddresses = accounts.slice(0, 10);
	if (whitelistAddresses.length !== 10) {
		console.log("ERROR: Whitelist array must contain 10 addresses.");
		console.log("whitelist size is " + whitelistAddresses.length);
		return;
	}

	before(async () => {
		// From the Open Zeppelin 'MerkleProof.sol' library:
		// Note: the hashing algorithm should be keccak256 and pair sorting should be enabled.
		const leafNodes = whitelistAddresses.map(addr => keccak256(addr));
		whitelistMerkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });

		// Deploy NFT Contract instance
		NFTInstance = await NFT.new(whitelistMerkleTree.getRoot());
	});

	describe("basic tests", () => {
		it("should display its name", async () => {
			assert.equal(await NFTInstance.name.call(), "Hello World!");
			assert.equal(await NFTInstance.symbol.call(), "HW");
		});

		it("account 1 should mint the first token", async () => {
			const account = whitelistAddresses[0];
			const merkleProof = whitelistMerkleTree.getHexProof(keccak256(account));
			await NFTInstance.mint(merkleProof, { from: account });

			assert.equal(await NFTInstance.balanceOf.call(account), 1);
			assert.equal(await NFTInstance.totalSupply.call(), 1);
		});

		it("account 2 should mint the second token", async () => {
			const account = whitelistAddresses[1];
			const merkleProof = whitelistMerkleTree.getHexProof(keccak256(account));
			await NFTInstance.mint(merkleProof, { from: account });

			assert.equal(await NFTInstance.balanceOf.call(account), 1);
			assert.equal(await NFTInstance.totalSupply.call(), 2);
		});

		it("account 1 should not mint another token", async () => {
			const account = whitelistAddresses[0];
			const merkleProof = whitelistMerkleTree.getHexProof(keccak256(account));
			NFTInstance.mint(merkleProof, { from: account })
				.then((result) => {
					assert(false, "Error: The account " + account + " has already minted a token.");
				}, (error) => {
					;//we expect it to fail
				});

			assert.equal(await NFTInstance.balanceOf.call(account), 1);
			assert.equal(await NFTInstance.totalSupply.call(), 2);
		});

		it("should mint the remaining tokens", async () => {
			const accounts = whitelistAddresses.slice(2);
			for (account of accounts) {
				const merkleProof = whitelistMerkleTree.getHexProof(keccak256(account));
				await NFTInstance.mint(merkleProof, { from: account });
				assert.equal(await NFTInstance.balanceOf.call(account), 1);
			}

			assert.equal(await NFTInstance.totalSupply.call(), 10);
		});

		it("should not mint another tokens", async () => {
			const account = whitelistAddresses[0];
			const merkleProof = whitelistMerkleTree.getHexProof(keccak256(account));
			NFTInstance.mint(merkleProof, { from: account })
				.then((result) => {
					assert(false, "Error: The max supply should have been reached.");
				}, (error) => {
					;//we expect it to fail
				});

			assert.equal(await NFTInstance.totalSupply.call(), 10);
		});
	})
});