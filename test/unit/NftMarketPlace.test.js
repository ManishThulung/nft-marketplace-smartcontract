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
          // const error = `NftMarketPlace__AlreadyListed(${basicNft.getAddress()}, ${TOKEN_ID})`;
          await expect(
            nftMarketPlace.listItem(basicNft.getAddress(), TOKEN_ID, PRICE)
          ).to.be.revertedWithCustomError(
            nftMarketPlace,
            `NftMarketPlace__AlreadyListed`
          );
        });

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

      // cancelListing
      describe("cancelListing", () => {
        it("allows only owner to cancel the item", async () => {
          await nftMarketPlace.listItem(basicNft.getAddress(), TOKEN_ID, PRICE);
          nftMarketPlace = nftMarketPlace.connect(player);
          await basicNft.approve(player.address, TOKEN_ID);

          await expect(
            nftMarketPlace.cancelListing(basicNft.getAddress(), TOKEN_ID)
          ).to.be.revertedWithCustomError(
            nftMarketPlace,
            "NftMarketPlace__NotOwner"
          );
        });

        it("only cancel item if it is already listed", async () => {
          await expect(
            nftMarketPlace.cancelListing(basicNft.getAddress(), TOKEN_ID)
          ).to.be.revertedWithCustomError(
            nftMarketPlace,
            "NftMarketPlace__NotListed"
          );
        });

        it("emits an event after canceling item and remove form list", async () => {
          await nftMarketPlace.listItem(basicNft.getAddress(), TOKEN_ID, PRICE);
          expect(
            await nftMarketPlace.cancelListing(basicNft.getAddress(), TOKEN_ID)
          ).to.emit("ItemCancelled");

          const listing = await nftMarketPlace.getListing(
            basicNft.getAddress(),
            TOKEN_ID
          );
          assert(listing.price.toString() == "0");
        });
      });

      // buyItem
      describe("buyItem", () => {
        it("reverts if the item is not listed", async () => {
          await expect(
            nftMarketPlace.buyItem(basicNft.getAddress(), TOKEN_ID)
          ).to.but.revertedWithCustomError(
            nftMarketPlace,
            "NftMarketPlace__NotListed"
          );
        });

        it("reverts if the item price item is not met", async () => {
          await nftMarketPlace.listItem(basicNft.getAddress(), TOKEN_ID, PRICE);

          // await expect(
          //   nftMarketPlace.buyItem(basicNft.getAddress(), TOKEN_ID, {
          //     value: ethers.parseEther("0.01"),
          //   })
          // )
          //   .to.be.revertedWithCustomError(
          //     nftMarketPlace,
          //     `NftMarketPlace__PriceNotMet(${basicNft.getAddress()}, ${TOKEN_ID}, ${PRICE})`
          //   )
          //   .withArgs();
          await expect(
            nftMarketPlace.buyItem(basicNft.getAddress(), TOKEN_ID, {
              value: ethers.parseEther("0.01"),
            })
          ).to.be.revertedWithCustomError(
            nftMarketPlace,
            `NftMarketPlace__PriceNotMet`
          );
        });

        it("transfer the nft to a buyer and updates the internal proceeds", async () => {
          await nftMarketPlace.listItem(basicNft.getAddress(), TOKEN_ID, PRICE);
          nftMarketPlace = nftMarketPlace.connect(player);

          expect(
            await nftMarketPlace.buyItem(basicNft.getAddress(), TOKEN_ID, {
              value: PRICE,
            })
          ).to.emit("ItemBought");

          const newOwner = await basicNft.ownerOf(TOKEN_ID);
          const proceeds = await nftMarketPlace.getProceeds(deployer.address);
          assert(newOwner.toString() == player.address);
          assert(proceeds.toString() == PRICE.toString());
        });
      });

      // updateListing
      describe("updateListing", () => {
        it("only allows owner to update an item", async () => {
          const NEW_PRICE = ethers.parseEther("0.02");
          await nftMarketPlace.listItem(basicNft.getAddress(), TOKEN_ID, PRICE);
          nftMarketPlace = nftMarketPlace.connect(player);
          await basicNft.approve(player.address, TOKEN_ID);

          await expect(
            nftMarketPlace.updateListing(
              basicNft.getAddress(),
              TOKEN_ID,
              NEW_PRICE
            )
          ).to.be.revertedWithCustomError(
            nftMarketPlace,
            "NftMarketPlace__NotOwner"
          );
        });

        it("only updates an item if it is already listed", async () => {
          const NEW_PRICE = ethers.parseEther("0.02");

          await expect(
            nftMarketPlace.updateListing(
              basicNft.getAddress(),
              TOKEN_ID,
              NEW_PRICE
            )
          ).to.be.revertedWithCustomError(
            nftMarketPlace,
            "NftMarketPlace__NotListed"
          );
        });

        it("reverts if the new price is zero", async () => {
          const NEW_PRICE = ethers.parseEther("0");
          await nftMarketPlace.listItem(basicNft.getAddress(), TOKEN_ID, PRICE);

          await expect(
            nftMarketPlace.updateListing(
              basicNft.getAddress(),
              TOKEN_ID,
              NEW_PRICE
            )
          ).to.be.revertedWithCustomError(
            nftMarketPlace,
            "NftMarketPlace_PriceMustBeAboveZero"
          );
        });

        it("emits an event after update and sets a new price to an item", async () => {
          const NEW_PRICE = ethers.parseEther("0.02");
          await nftMarketPlace.listItem(basicNft.getAddress(), TOKEN_ID, PRICE);

          expect(
            await nftMarketPlace.updateListing(
              basicNft.getAddress(),
              TOKEN_ID,
              NEW_PRICE
            )
          ).to.emit("ItemListed");

          const listing = await nftMarketPlace.getListing(
            basicNft.getAddress(),
            TOKEN_ID
          );
          assert(listing.price.toString() == NEW_PRICE.toString());
        });
      });

      //withdrawProceeds
      describe("withdrawProceeds", () => {
        it("doent allow 0 proceeds to withdraw", async () => {
          await expect(
            nftMarketPlace.withdrawProceeds()
          ).to.be.revertedWithCustomError(
            nftMarketPlace,
            "NftMarketPlace__NoProceeds"
          );
        });
        it("withdraws the ETH and updates the prodeeds", async () => {
          await nftMarketPlace.listItem(basicNft.getAddress(), TOKEN_ID, PRICE);
          nftMarketPlace = nftMarketPlace.connect(player);
          await nftMarketPlace.buyItem(basicNft.getAddress(), TOKEN_ID, {
            value: PRICE,
          });
          nftMarketPlace = nftMarketPlace.connect(deployer);

          const deployerProceedsBefore = await nftMarketPlace.getProceeds(
            deployer.address
          );
          // const balanceAfterProceeds = await deployer.getBalance();
          const deployerBalanceBefore = await ethers.provider.getBalance(
            deployer.address
          );
          console.log(deployerProceedsBefore, "balanceBeforeProceeds");
          console.log(deployerBalanceBefore, "balanceAfterProceeds");
          const txResponse = await nftMarketPlace.withdrawProceeds();
          const txReceipt = await txResponse.wait(1);
          console.log(txReceipt, "receit");
          const { gasUsed, gasPrice } = txReceipt;
          // const gasCost = gasUsed.mul(gasPrice);
          const gasCost = gasUsed * gasPrice;
          const deployerBalanceAfter = await ethers.provider.getBalance(
            deployer.address
          );
          console.log(deployerBalanceAfter, "deployerBalanceAfter");

          assert(
            (deployerBalanceAfter + gasCost).toString() ==
              (deployerProceedsBefore + deployerBalanceBefore).toString()
          );
        });
      });
    });
