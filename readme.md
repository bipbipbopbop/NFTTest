# Initialization

```sh
npm install
```
##### additional setup:
```sh

# Run a local blockchain fork
npx hardhat node [--fork <JSON-RPC server url>]

# Run a local ipfs node
export IPFS_PATH=`pwd`/ipfs/.go-ipfs
cd ipfs/
npx go-ipfs init
npx go-ipfs daemon
```

---

# Full process: Deploy the contract and the metadata

todo

---

# What can you find in this repo ?

## `contracts/`

This folder contains all the contracts and solidity libraries. You can interact with them using `hardhat`:
```sh
# Compile contracts
npx hardat compile

# Deploy contracts (see hardhat.config.ts)
npx hardhat deploy --network <network name>
```

## `ipfs/`

This folder contains scripts and explanations for the NFT's metadatas. See the following [readme](/ipfs/readme.md) for more details.

## `scripts/`

This folder contains various programs to ease the process of deployment.

```sh
# Run a script (check the related file to use the right command)
node <file.mjs path> [optional arguments]
#OR
npx ts-node <file.ts path> [optional arguments]
#OR
npx hardhat run [--network <network name>] <file path> [optional arguments]
```

## `test/`

This folder contains unit tests for the contracts.
```sh
npx hardhat test [<files name>]
```

## `hardhat.config.ts`

This file is the entry point for all hardhat-related commands.
There should be nothing to add here, unless you want a new network for your test or deployment. here is the structure:
```ts
interface HttpNetworkUserConfig {
  chainId?: number;
  from?: string;
  gas?: "auto" | number;
  gasPrice?: "auto" | number;
  gasMultiplier?: number;
  url?: string;
  timeout?: number;
  httpHeaders?: { [name: string]: string };
  accounts?: HttpNetworkAccountsUserConfig;
}
```
