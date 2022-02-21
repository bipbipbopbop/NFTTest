import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

dotenv.config();

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  networks: {
    matic: {
      url: "https://polygon-rpc.com",
      accounts: {
        mnemonic: process.env!.POLYGON_MNEMONIC,
        count: process.env.POLYGON_MNEMONIC ? 10 : 0,
      },
    }
  },
  // comment this or set REPORT_GAS env variable to enable the gasReporter
  // gasReporter: {
  //   enabled: process.env.REPORT_GAS !== undefined,
  //   currency: "USD",
  // },
};

export default config;
