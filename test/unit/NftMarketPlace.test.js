const { network, getNamedAccounts, ethers, deployments } = require("hardhat");
// const hardhat = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");
const { expect, assert } = require("chai");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("NftMarketPlace Unit Test", function () {
      let nftMarketPlace, basicNft, deployer, player;

      const PRICE = ethers.parseEther("0.1");
      const TOKEN_ID = 0;

      beforeEach(async () => {
        // deployer = (await getNamedAccounts()).deployer;
        // player = (await getNamedAccounts()).player;
        const accounts = await ethers.getSigners();
        deployer = accounts[0];
        player = accounts[1];

        // deployes all the deploy scripts tha contains "all" tags
        await deployments.fixture(["all"]);
        nftMarketPlace = await ethers.getContract("NftMarketPlace"); // by default deployer is deployer
        basicNft = await ethers.getContract("BasicNft");
        await basicNft.mintNft();
        await basicNft.approve(nftMarketPlace.getAddress(), TOKEN_ID);
      });

      // it("lists and allows us to buy", async () => {
      //   await nftMarketPlace.listItem(basicNft.getAddress(), TOKEN_ID, PRICE);
      //   const playerConnectedNftMarketPlace = nftMarketPlace.connect(player);
      //   await playerConnectedNftMarketPlace.buyItem(
      //     basicNft.getAddress(),
      //     TOKEN_ID,
      //     { value: PRICE }
      //   );

      //   const newOwner = await basicNft.ownerOf(TOKEN_ID);
      //   const deployerProceeds = await nftMarketPlace.getProceeds(deployer);
      //   assert(newOwner.toString() == player.address);
      //   assert(deployerProceeds.toString() == PRICE.toString());
      // });

      describe("listItem", () => {
        it("reverts if the price is less than zero", async () => {
          const ZERO_PRICE = ethers.parseEther("0");
          await expect(
            nftMarketPlace.listItem(basicNft.getAddress(), TOKEN_ID, ZERO_PRICE)
          ).to.be.revertedWithCustomError(
            nftMarketPlace,
            "NftMarketPlace_PriceMustBeAboveZero"
          );
        });

        it("emits an event after listing an item", async () => {
          expect(
            await nftMarketPlace.listItem(
              basicNft.getAddress(),
              TOKEN_ID,
              PRICE
            )
          ).to.emit("ItemListed");
        });

        it("exclusively items that haven't been listed", async () => {
          await nftMarketPlace.listItem(basicNft.getAddress(), TOKEN_ID, PRICE);
          const address = await basicNft.getAddress();
          // const error = `AlreadyListed`;
          const error = `NftMarketPlace__AlreadyListed(${address}, ${TOKEN_ID})`;
          console.log(
            `NftMarketPlace__AlreadyListed(${address}, ${TOKEN_ID})`,
            "`NftMarketPlace__AlreadyListed(${address}, ${TOKEN_ID})`"
          );

          await expect(
            nftMarketPlace.listItem(basicNft.getAddress(), TOKEN_ID, PRICE)
          ).to.be.revertedWithCustomError(nftMarketPlace, error);
        });
      });
    });
