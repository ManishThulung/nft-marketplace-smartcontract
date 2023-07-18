const { ethers } = require("hardhat");

const PRICE = ethers.parseEther("0.01");

async function mintAndList() {
  const nftMarketPlace = await ethers.deployContract("NftMarketPlace");
  await nftMarketPlace.waitForDeployment();
  const basicNft = await ethers.deployContract("BasicNft");
  await basicNft.waitForDeployment();

  console.log("Minting..");
  const mintTx = await basicNft.mintNft();
  const txReceipt = await mintTx.wait(1);
  // console.log(txReceipt.logs[1], "txReceipt");
  const { data } = txReceipt?.logs[1];
  // const tokenId = txReceipt?.events[0]?.args?.tokenId;
  // const tokenId = ethers.BigNumber.from(data).toNumber();
  const tokenId = ethers.toQuantity(data);
  // console.log("tokenId", tokenId);
  console.log("Approving nft...");

  const approvalTx = await basicNft.approve(
    nftMarketPlace.getAddress(),
    tokenId
  );
  await approvalTx.wait(1);
  console.log("Listing nft.....");
  const tx = await nftMarketPlace.listItem(
    basicNft.getAddress(),
    tokenId,
    PRICE
  );
  await tx.wait(1);
  console.log("Listed!");
}

mintAndList()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
