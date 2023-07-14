// require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("solidity-coverage");
require("hardhat-gas-reporter");
require("hardhat-contract-sizer");
require("@nomicfoundation/hardhat-chai-matchers");
// require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */

const GOERLY_RPC_URL = process.env.GOERLY_RPC_URL;
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const COINMARKET_API_KRY = process.env.COINMARKET_API_KRY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
      blockConfirmations: 1,
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      //   accounts: {
      //     mnemonic: MNEMONIC,
      //   },
      blockConfirmations: 6,
      saveDeployments: true,
      chainId: 11155111,
      gas: 5000000,
    },
    goerli: {
      chainId: 5,
      blockConfirmations: 6,
      url: GOERLY_RPC_URL,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
    },
  },
  solidity: {
    compilers: [
      { version: "0.8.7" },
      { version: "0.4.22" },
      { version: "0.8.0" },
      { version: "0.6.0" },
      { version: "0.6.6" },
      { version: "0.7.0" },
    ],
  },
  gasReporter: {
    enabled: false,
    outputFile: "gas-report.txt",
    noColors: true,
    currency: "USD",
    coinmarketcap: COINMARKET_API_KRY,
    token: "MATIC",
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    player: {
      default: 1,
    },
  },
  mocha: {
    timeout: 300000, //300sec
  },
};
