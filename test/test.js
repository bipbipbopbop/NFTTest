const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const assert = require("assert");

const NFT = artifacts.require("NFT");

contract("NFT", (accounts) => {
	let NFTInstance;
	let whitelistMerkleTree;

	// 8 addresses
	const deployer = accounts[0];
	const whitelistAddresses = accounts.slice(1, 9);
	if (whitelistAddresses.length !== 8) {
		console.log("ERROR: The whitelist array must contains 8 addresses.");
		console.log("whitelist size is " + whitelistAddresses.length);
		return;
	}

	before(async () => {
		// Deploy NFT Contract instance
		NFTInstance = await NFT.new();
	});

	describe("basic tests", () => {
		it("should display its name", async () => {
			assert.equal(await NFTInstance.name.call(), "NFT Test");
			assert.equal(await NFTInstance.symbol.call(), "NFT");
		});
	});

	before(async () => {
		// Create the merkleTree for the whitelist
		// Note: from the Open Zeppelin 'MerkleProof.sol' library:
		// The hashing algorithm should be keccak256 and pair sorting should be enabled.
		const leafNodes = whitelistAddresses.map(addr => keccak256(addr));
		whitelistMerkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
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

	describe("mint tests", async () => {
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

		it("account 10 should not mint a token", async () => {
			const account = accounts[9];
			const merkleProof = whitelistMerkleTree.getHexProof(keccak256(account));
			NFTInstance.mint(merkleProof, { from: account })
				.then((result) => {
					assert(false, "Error: The account " + account + " is not in the whitelist.");
				}, (error) => {
					;//we expect it to fail
				});

			assert.equal(await NFTInstance.balanceOf.call(account), 0);
			assert.equal(await NFTInstance.whitelistClaimed.call(account), "0");
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

			assert.equal(await NFTInstance.totalSupply.call(), 8);
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

			assert.equal(await NFTInstance.totalSupply.call(), 8);
		});

		describe("token URI tests", async () => {
			it("should revert on token 0", async () => {
				await NFTInstance.tokenURI.call(0)
					.then((result) => {
						assert(false, "Error: There should be no token with ID 0.");
					}, (error) => {
						;//we expect it to fail
					});
			});

			it("should have no tokenURI set", async () => {
				assert.equal(await NFTInstance.tokenURI.call(1), "");
			});

			it("should set the token URI", async () => {
				await NFTInstance.setBaseURI("ipfs://QmRzUpzWqjYtPetV5xhrWgcEpXXHeLMJ8wDaHfuvpPEJvf/", { from: deployer });
				const link = await NFTInstance.tokenURI.call(1);
				assert.equal(link, "ipfs://QmRzUpzWqjYtPetV5xhrWgcEpXXHeLMJ8wDaHfuvpPEJvf/1.png");
				console.log("Check the link manually: " + link);
			})
		});

		describe("transfer tests", async () => {
			it("should not transfer a token without approval", async () => {
				const accountFrom = accounts[1];
				const accountTo = accounts[2];
				await NFTInstance.safeTransferFrom(accountFrom, accountTo, 1, { from: accounts[0] })
					.then((result) => {
						assert(false, "Error: the transfer caller has not been approved yet.");
					}, (error) => {
						;//we expect it to fail
					});

				assert.equal(await NFTInstance.balanceOf.call(accountFrom), 1);
				assert.equal(await NFTInstance.balanceOf.call(accountTo), 1);
				assert.equal(await NFTInstance.whitelistClaimed.call(accountFrom), "1");
				assert.equal(await NFTInstance.whitelistClaimed.call(accountTo), "1");
				assert.equal(await NFTInstance.totalSupply.call(), 8);
			});

			it("account 2 should transfer token 1 to account 10", async () => {
				const accountFrom = accounts[1];
				const accountTo = accounts[9];
				await NFTInstance.safeTransferFrom(accountFrom, accountTo, 1, { from: accountFrom });

				assert.equal(await NFTInstance.balanceOf.call(accountFrom), 0);
				assert.equal(await NFTInstance.balanceOf.call(accountTo), 1);
				assert.equal(await NFTInstance.whitelistClaimed.call(accountFrom), "1");
				assert.equal(await NFTInstance.whitelistClaimed.call(accountTo), "0");
				assert.equal(await NFTInstance.totalSupply.call(), 8);
			});

			it("account 3 should transfer token 2 to account 10 on account 1 behalf", async () => {
				// accountFrom is owner
				const accountFrom = accounts[2];
				const accountTo = accounts[9];
				const accountApproved = accounts[0];
				await NFTInstance.approve(accountApproved, "2", { from: accountFrom })
				await NFTInstance.safeTransferFrom(accountFrom, accountTo, 2, { from: accountApproved });

				assert.equal(await NFTInstance.balanceOf.call(accountFrom), 0);
				assert.equal(await NFTInstance.balanceOf.call(accountTo), 2);
				assert.equal(await NFTInstance.whitelistClaimed.call(accountFrom), "1");
				assert.equal(await NFTInstance.whitelistClaimed.call(accountTo), "0");
				assert.equal(await NFTInstance.totalSupply.call(), 8);
			});


			it("account 10 should transfer its 2 tokens to account 2 & 3 on account 5 behalf", async () => {
				// accountFrom is owner
				const accountFrom = accounts[9];
				const accountTo1 = accounts[1];
				const accountTo2 = accounts[2];
				const accountApproved = accounts[4];
				await NFTInstance.setApprovalForAll(accountApproved, true, { from: accountFrom })
				await NFTInstance.safeTransferFrom(accountFrom, accountTo1, 1, { from: accountApproved });
				await NFTInstance.safeTransferFrom(accountFrom, accountTo2, 2, { from: accountApproved });

				assert.equal(await NFTInstance.balanceOf.call(accountFrom), 0);
				assert.equal(await NFTInstance.balanceOf.call(accountTo1), 1);
				assert.equal(await NFTInstance.balanceOf.call(accountTo2), 1);
				assert.equal(await NFTInstance.whitelistClaimed.call(accountFrom), "0");
				assert.equal(await NFTInstance.whitelistClaimed.call(accountTo1), "1");
				assert.equal(await NFTInstance.whitelistClaimed.call(accountTo2), "1");
				assert.equal(await NFTInstance.totalSupply.call(), 8);
			});

		});
	})
});