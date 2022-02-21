import { MerkleTree } from 'merkletreejs';
import keccak256 from "keccak256";
import assert from "assert";

import { ethers } from "hardhat";
import { NFT } from "../typechain";

// todo: I can't find the type appropriately from hardhat-ethers
type SignerWithAddress = any;

describe("NFT", () => {
	let NFTInstance: NFT;
	let whitelistMerkleTree: MerkleTree;
	let accounts: SignerWithAddress[];

	// 8 addresses
	let deployer: SignerWithAddress;
	let whitelistAccounts: SignerWithAddress[];

	before(async () => {
		// prepare 8 addresses for the tests
		accounts = await ethers.getSigners();
		deployer = accounts[0];
		whitelistAccounts = accounts.slice(1, 9);
		if (whitelistAccounts.length !== 8) {
			console.log("ERROR: The whitelist array must contains 8 addresses.");
			console.log("whitelist size is " + whitelistAccounts.length);
			return;
		}

		// Deploy NFT Contract instance
		NFTInstance = await (await ethers.getContractFactory("NFT")).deploy();
		assert.strictEqual(deployer.address, await NFTInstance.signer.getAddress(), "Error: you must change the deployer value.");
	});

	describe("basic tests", () => {
		it("should display its name", async () => {
			assert.strictEqual(await NFTInstance.name(), "NFT Test");
			assert.strictEqual(await NFTInstance.symbol(), "NFT");
		});
	});

	before(async () => {
		// Create the merkleTree for the whitelist
		// Note: from the Open Zeppelin 'MerkleProof.sol' library:
		// The hashing algorithm should be keccak256 and pair sorting should be enabled.
		const leafNodes = whitelistAccounts.map(acc => keccak256(acc.address));
		whitelistMerkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
	});

	describe("whitelist tests", async () => {
		it("should have no whitelist set", async () => {
			assert.strictEqual(await NFTInstance.merkleRoot(),
				"0x0000000000000000000000000000000000000000000000000000000000000000");
		});

		it("should set the whitelist", async () => {
			await NFTInstance.setWhitelist(whitelistMerkleTree.getRoot());
			assert.notStrictEqual(await NFTInstance.merkleRoot(),
				"0x0000000000000000000000000000000000000000000000000000000000000000");
		})
	});

	describe("mint tests", async () => {
		it("account 1 should mint the first token", async () => {
			const account = whitelistAccounts[0];
			const merkleProof = whitelistMerkleTree.getHexProof(keccak256(account.address));
			assert.strictEqual(await NFTInstance.onAllowList(account.address, merkleProof), true);
			await NFTInstance.connect(account).mint(merkleProof);

			assert.strictEqual((await NFTInstance.balanceOf(account.address)).toNumber(), 1);
			assert.strictEqual((await NFTInstance.whitelistClaimed(account.address)).toNumber(), 1);
			assert.strictEqual((await NFTInstance.totalSupply()).toNumber(), 1);
			console.log("end");
		});

		it("account 2 should mint the second token", async () => {
			const account = whitelistAccounts[1];
			const merkleProof = whitelistMerkleTree.getHexProof(keccak256(account.address));
			assert.strictEqual(await NFTInstance.onAllowList(account.address, merkleProof), true);
			await NFTInstance.connect(account).mint(merkleProof);

			assert.strictEqual((await NFTInstance.balanceOf(account.address)).toNumber(), 1);
			assert.strictEqual((await NFTInstance.whitelistClaimed(account.address)).toNumber(), 1);
			assert.strictEqual((await NFTInstance.totalSupply()).toNumber(), 2);
		});

		it("account 1 should not mint another token", async () => {
			const account = whitelistAccounts[0];
			const merkleProof = whitelistMerkleTree.getHexProof(keccak256(account.address));
			assert.strictEqual(await NFTInstance.onAllowList(account.address, merkleProof), true);
			NFTInstance.connect(account).mint(merkleProof)
				.then((result) => {
					assert(false, "Error: The account " + account.address + " has already minted a token.");
				}, (error) => {
					;//we expect it to fail
				});

			assert.strictEqual((await NFTInstance.balanceOf(account.address)).toNumber(), 1);
			assert.strictEqual((await NFTInstance.whitelistClaimed(account.address)).toNumber(), 1);
			assert.strictEqual((await NFTInstance.totalSupply()).toNumber(), 2);
		});

		it("account 10 should not mint a token", async () => {
			const account = accounts[9];
			const merkleProof = whitelistMerkleTree.getHexProof(keccak256(account.address));
			assert.strictEqual(await NFTInstance.onAllowList(account.address, merkleProof), false);
			NFTInstance.connect(account).mint(merkleProof)
				.then((result) => {
					assert(false, "Error: The account " + account.address + " is not in the whitelist.");
				}, (error) => {
					;//we expect it to fail
				});

			assert.strictEqual((await NFTInstance.balanceOf(account.address)).toNumber(), 0);
			assert.strictEqual((await NFTInstance.whitelistClaimed(account.address)).toNumber(), 0);
			assert.strictEqual((await NFTInstance.totalSupply()).toNumber(), 2);
		});

		it("should mint the remaining tokens", async () => {
			const accounts = whitelistAccounts.slice(2);
			for (const account of accounts) {
				const merkleProof = whitelistMerkleTree.getHexProof(keccak256(account.address));
				assert.strictEqual(await NFTInstance.onAllowList(account.address, merkleProof), true);
				await NFTInstance.connect(account).mint(merkleProof);
				assert.strictEqual((await NFTInstance.balanceOf(account.address)).toNumber(), 1);
				assert.strictEqual((await NFTInstance.whitelistClaimed(account.address)).toNumber(), 1);
			}

			assert.strictEqual((await NFTInstance.totalSupply()).toNumber(), 8);
		});

		it("should not mint another tokens", async () => {
			const account = whitelistAccounts[0];
			const merkleProof = whitelistMerkleTree.getHexProof(keccak256(account.address));
			await NFTInstance.connect(account).mint(merkleProof)
				.then((result) => {
					assert(false, "Error: The max supply should have been reached.");
				}, (error) => {
					;//we expect it to fail
				});

			assert.strictEqual((await NFTInstance.totalSupply()).toNumber(), 8);
		});

		describe("token URI tests", async () => {
			it("should revert on token 0", async () => {
				await NFTInstance.tokenURI(0)
					.then((result) => {
						assert(false, "Error: There should be no token with ID 0.");
					}, (error) => {
						;//we expect it to fail
					});
			});

			it("should have no tokenURI set", async () => {
				assert.strictEqual(await NFTInstance.tokenURI(1), "");
			});

			it("should set the token URI", async () => {
				await NFTInstance.connect(deployer).setBaseURI("ipfs://QmcfidDBSh53tHeQhuzaWS3MmbCGd33ZLjYUwTGbz9cqh8/");
				const link = await NFTInstance.tokenURI(1);
				assert.strictEqual(link, "ipfs://QmcfidDBSh53tHeQhuzaWS3MmbCGd33ZLjYUwTGbz9cqh8/1.json");
				console.log("Check the link manually: " + link);
			})
		});

		describe("transfer tests", async () => {
			it("should not transfer a token without approval", async () => {
				const accountFrom = accounts[1];
				const accountTo = accounts[2];
				// overloaded functions have to be accessed this way
				await NFTInstance.connect(accounts[0])['safeTransferFrom(address,address,uint256)'](accountFrom.address, accountTo.address, 1)
					.then((result) => {
						assert(false, "Error: the transfer caller has not been approved yet.");
					}, (error) => {
						;//we expect it to fail
					});

				assert.strictEqual((await NFTInstance.balanceOf(accountFrom.address)).toNumber(), 1);
				assert.strictEqual((await NFTInstance.balanceOf(accountTo.address)).toNumber(), 1);
				assert.strictEqual((await NFTInstance.whitelistClaimed(accountFrom.address)).toNumber(), 1);
				assert.strictEqual((await NFTInstance.whitelistClaimed(accountTo.address)).toNumber(), 1);
				assert.strictEqual((await NFTInstance.totalSupply()).toNumber(), 8);
			});

			it("account 2 should transfer token 1 to account 10", async () => {
				const accountFrom = accounts[1];
				const accountTo = accounts[9];
				await NFTInstance.connect(accountFrom)['safeTransferFrom(address,address,uint256)'](accountFrom.address, accountTo.address, 1);

				assert.strictEqual((await NFTInstance.balanceOf(accountFrom.address)).toNumber(), 0);
				assert.strictEqual((await NFTInstance.balanceOf(accountTo.address)).toNumber(), 1);
				assert.strictEqual((await NFTInstance.whitelistClaimed(accountFrom.address)).toNumber(), 1);
				assert.strictEqual((await NFTInstance.whitelistClaimed(accountTo.address)).toNumber(), 0);
				assert.strictEqual((await NFTInstance.totalSupply()).toNumber(), 8);
			});

			it("account 3 should transfer token 2 to account 10 on account 1 behalf", async () => {
				// accountFrom is owner
				const accountFrom = accounts[2];
				const accountTo = accounts[9];
				const accountApproved = accounts[0];
				await NFTInstance.connect(accountFrom).approve(accountApproved.address, "2")
				await NFTInstance.connect(accountApproved)['safeTransferFrom(address,address,uint256)'](accountFrom.address, accountTo.address, 2);

				assert.strictEqual((await NFTInstance.balanceOf(accountFrom.address)).toNumber(), 0);
				assert.strictEqual((await NFTInstance.balanceOf(accountTo.address)).toNumber(), 2);
				assert.strictEqual((await NFTInstance.whitelistClaimed(accountFrom.address)).toNumber(), 1);
				assert.strictEqual((await NFTInstance.whitelistClaimed(accountTo.address)).toNumber(), 0);
				assert.strictEqual((await NFTInstance.totalSupply()).toNumber(), 8);
			});


			it("account 10 should transfer its 2 tokens to account 2 & 3 on account 5 behalf", async () => {
				// accountFrom is owner
				const accountFrom = accounts[9];
				const accountTo1 = accounts[1];
				const accountTo2 = accounts[2];
				const accountApproved = accounts[4];
				await NFTInstance.connect(accountFrom).setApprovalForAll(accountApproved.address, true)
				await NFTInstance.connect(accountApproved)['safeTransferFrom(address,address,uint256)'](accountFrom.address, accountTo1.address, 1);
				await NFTInstance.connect(accountApproved)['safeTransferFrom(address,address,uint256)'](accountFrom.address, accountTo2.address, 2);

				assert.strictEqual((await NFTInstance.balanceOf(accountFrom.address)).toNumber(), 0);
				assert.strictEqual((await NFTInstance.balanceOf(accountTo1.address)).toNumber(), 1);
				assert.strictEqual((await NFTInstance.balanceOf(accountTo2.address)).toNumber(), 1);
				assert.strictEqual((await NFTInstance.whitelistClaimed(accountFrom.address)).toNumber(), 0);
				assert.strictEqual((await NFTInstance.whitelistClaimed(accountTo1.address)).toNumber(), 1);
				assert.strictEqual((await NFTInstance.whitelistClaimed(accountTo2.address)).toNumber(), 1);
				assert.strictEqual((await NFTInstance.totalSupply()).toNumber(), 8);
			});
		});
	})
});