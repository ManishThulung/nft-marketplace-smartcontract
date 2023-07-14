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

        // it("exclusively items that haven't been listed", async () => {
        //   await nftMarketPlace.listItem(basicNft.getAddress(), TOKEN_ID, PRICE);
        //   // const error = `NftMarketPlace__AlreadyListed(${basicNft.getAddress()}, ${TOKEN_ID})`;
        //   await expect(
        //     nftMarketPlace.listItem(basicNft.getAddress(), TOKEN_ID, PRICE)
        //   ).to.be.revertedWithCustomError(
        //     nftMarketPlace,
        //     `NftMarketPlace__AlreadyListed(${basicNft.getAddress()}, ${TOKEN_ID})`
        //   );
        // });

        it("allows only owner to list item", async () => {
          nftMarketPlace = nftMarketPlace.connect(player);
          await basicNft.approve(player.getAddress(), TOKEN_ID);

          await expect(
            nftMarketPlace.listItem(basicNft.getAddress(), TOKEN_ID, PRICE)
          ).to.be.revertedWithCustomError(
            nftMarketPlace,
            "NftMarketPlace__NotOwner"
          );
        });

        it("needs approvals to list an item", async () => {
          await basicNft.approve(
            "0xe7f1725e7734ce288f8367e1bb143e90bb3f0513",
            TOKEN_ID
          );

          await expect(
            nftMarketPlace.listItem(basicNft.getAddress(), TOKEN_ID, PRICE)
          ).to.be.revertedWithCustomError(
            nftMarketPlace,
            "NftMarketPlace__NotApprovedForMarketPlace"
          );
        });

        it("updates listing with seller and price", async () => {
          await nftMarketPlace.listItem(basicNft.getAddress(), TOKEN_ID, PRICE);
          const listing = await nftMarketPlace.getListing(
            basicNft.getAddress(),
            TOKEN_ID
          );
          assert(listing.price.toString() == PRICE.toString());
          assert(listing.seller.toString() == deployer.address);
        });
      });
    });
