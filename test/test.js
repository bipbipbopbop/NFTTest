const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const assert = require("assert");

const NFT = artifacts.require("NFT");

contract("NFT", (accounts) => {
	let NFTInstance;
	let whitelistMerkleTree;

	// 10 addresses
	const deployer = accounts[0];
	const whitelistAddresses = accounts.slice(0, 10);
	if (whitelistAddresses.length !== 10) {
		console.log("ERROR: Whitelist array must contain 10 addresses.");
		console.log("whitelist size is " + whitelistAddresses.length);
		return;
	}

	before(async () => {
		// Create the merkleTree for the whitelist
		// Note: from the Open Zeppelin 'MerkleProof.sol' library:
		// The hashing algorithm should be keccak256 and pair sorting should be enabled.
		const leafNodes = whitelistAddresses.map(addr => keccak256(addr));
		whitelistMerkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });

		// Deploy NFT Contract instance
		NFTInstance = await NFT.new();
	});

	describe("basic tests", () => {
		it("should display its name", async () => {
			assert.equal(await NFTInstance.name.call(), "NFT Test");
			assert.equal(await NFTInstance.symbol.call(), "NFT");
		});
	});

	describe("whitelist tests", async () => {
		it("should have no whitelist set", async () => {
			assert.equal(await NFTInstance.merkleRoot.call(),
				"0x0000000000000000000000000000000000000000000000000000000000000000");
		});

		it("should set the whitelist", async () => {
			await NFTInstance.setWhitelist(whitelistMerkleTree.getRoot(), { from: deployer });
			assert.notEqual(await NFTInstance.merkleRoot.call(),
				"0x0000000000000000000000000000000000000000000000000000000000000000");
		})
	});

	describe("token URI tests", async () => {
		it("should have no tokenURI set", async () => {
			await NFTInstance.tokenURI.call(0).then(
				(result) => {
					assert(false, "Error: tokenURI() succeed while No tokenURI has been set.");
				},
				(error) => {
					;//we expect it to fail
				}
			);
		});

		it("should set the token URI", async () => {
			await NFTInstance.setBaseURI(""/*todo*/, { from: deployer });
			assert.Equal(await NFTInstance.tokenURI.call(0),
				"todo/0");
		})
	});

	describe("mint tests", () => {
		it("account 1 should mint the first token", async () => {
			const account = whitelistAddresses[0];
			const merkleProof = whitelistMerkleTree.getHexProof(keccak256(account));
			await NFTInstance.mint(merkleProof, { from: account });

			assert.equal(await NFTInstance.balanceOf.call(account), 1);
			assert.equal(await NFTInstance.whitelistClaimed.call(account), "1");
			assert.equal(await NFTInstance.totalSupply.call(), 1);
		});

		it("account 2 should mint the second token", async () => {
			const account = whitelistAddresses[1];
			const merkleProof = whitelistMerkleTree.getHexProof(keccak256(account));
			await NFTInstance.mint(merkleProof, { from: account });

			assert.equal(await NFTInstance.balanceOf.call(account), 1);
			assert.equal(await NFTInstance.whitelistClaimed.call(account), "1");
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
			assert.equal(await NFTInstance.whitelistClaimed.call(account), "1");
			assert.equal(await NFTInstance.totalSupply.call(), 2);
		});

		it("should mint the remaining tokens", async () => {
			const accounts = whitelistAddresses.slice(2);
			for (account of accounts) {
				const merkleProof = whitelistMerkleTree.getHexProof(keccak256(account));
				await NFTInstance.mint(merkleProof, { from: account });
				assert.equal(await NFTInstance.balanceOf.call(account), 1);
				assert.equal(await NFTInstance.whitelistClaimed.call(account), "1");
			}

			assert.equal(await NFTInstance.totalSupply.call(), 10);
		});

		it("should not mint another tokens", async () => {
			const account = whitelistAddresses[0];
			const merkleProof = whitelistMerkleTree.getHexProof(keccak256(account));
			await NFTInstance.mint(merkleProof, { from: account })
				.then((result) => {
					assert(false, "Error: The max supply should have been reached.");
				}, (error) => {
					;//we expect it to fail
				});

			assert.equal(await NFTInstance.totalSupply.call(), 10);
		});
	})
});