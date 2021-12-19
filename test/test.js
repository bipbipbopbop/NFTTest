const assert = require("assert");

const NFT = artifacts.require("NFT");

contract("NFT", (accounts) => {
	let NFTInstance;
	before(async () => {
		NFTInstance = await NFT.new();
	});

	describe("basic tests", () => {
		it("should display its name", async () => {
			assert.equal(await NFTInstance.name.call(), "Hello World!");
		});
		it("should mint the first token", async () => {
			const account = accounts[0];
			await NFTInstance.mint(account, { from: account });

			assert.equal(await NFTInstance.balanceOf.call(account), 1);
			assert.equal(await NFTInstance.totalSupply.call(), 1);
		});
	})
});