const { network } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deployer } = await getNamedAccounts();
  const { deploy, log } = deployments;

  let args = [];

  console.log("Deploy NftMarketPlace");
  console.log("-----------------------");

  const nftMarketPlace = await deploy("NftMarketPlace", {
    from: deployer,
    log: true,
    args: args,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    log("varifying..........");
    await verify(nftMarketPlace.address, args);
  }
  console.log("-------------------------");
};

module.exports.tags = ["all", "nftmarketplace"];
