const { ethers } = require("hardhat");
const { expect } = require("chai");

let nftMarket;
let nft;
let accounts;
let seller;
let buyer;

before(async () => {
  accounts = await ethers.getSigners();
  buyer = accounts[0];
  seller = accounts[1];
  // console.log("seller: ", seller.address);
  // console.log("buyer: ", buyer.address);

  const initSupply = (ethers.utils.parseEther("1000000")).toString(); // 1000000 sol

  const SolToken = await ethers.getContractFactory("SolToken");
  solToken = await SolToken.deploy(initSupply);
  await solToken.deployed();

  const NFTMarket = await ethers.getContractFactory("NFTMarket");
  nftMarket = await NFTMarket.deploy(solToken.address);
  await nftMarket.deployed();

  const NFT = await ethers.getContractFactory("NFT");
  nft = await NFT.deploy(nftMarket.address);
  await nft.deployed();
})

describe("NFTMarket", function () {
  it('initializes NFTMarket correctly and creates 2 tokens via NFT to test NFTMarket', async function () {
    const listingPrice = await nftMarket.getListingPrice();
    expect(listingPrice.toString()).to.equal("25000000000000000", "incorrect listingPrice!"); // 0.025 ether

    // need to create tokens first via NFT
    let tx = await nft.connect(seller).createToken("https://www.ipfs-location1.com");
    let txReceipt = await tx.wait();
    [nftCreatedEventLog] = txReceipt.events.filter((x) => { return x.event == "NFTCreated"; });
    expect(nftCreatedEventLog.args.tokenURI).to.equal("https://www.ipfs-location1.com", "incorrect tokenURI in NFTCreated Event!");
    expect(nftCreatedEventLog.args.tokenId).to.equal(1, "incorrect tokenId in NFTCreated Event!");

    tx = await nft.connect(seller).createToken("https://www.ipfs-location2.com");
    txReceipt = await tx.wait();
    [nftCreatedEventLog] = txReceipt.events.filter((x) => { return x.event == "NFTCreated"; });
    expect(nftCreatedEventLog.args.tokenURI).to.equal("https://www.ipfs-location2.com", "incorrect tokenURI in NFTCreated Event!");
    expect(nftCreatedEventLog.args.tokenId).to.equal(2, "incorrect tokenId in NFTCreated Event!");
  });

  it('lists MarketItems in NFTMarket', async function () {
    const listingPrice = (await nftMarket.getListingPrice()).toString(); // 0.025 ether
    const auctionPrice = (ethers.utils.parseUnits("100", 'ether')).toString(); // 100 sol

    let tx = await nftMarket.connect(seller).createMarketItem(nft.address, 1, auctionPrice, { value: listingPrice });
    let txReceipt = await tx.wait();
    [marketItemCreatedEventLog] = txReceipt.events.filter((x) => { return x.event == "MarketItemCreated"; });
    expect(marketItemCreatedEventLog.args.tokenId).to.equal(1, "incorrect tokenId in MarketItemCreated Event!");
    expect(marketItemCreatedEventLog.args.itemId).to.equal(1, "incorrect itemId in MarketItemCreated Event!");
    expect(marketItemCreatedEventLog.args.price.toString()).to.equal(auctionPrice, "incorrect price in MarketItemCreated Event!");

    tx = await nftMarket.connect(seller).createMarketItem(nft.address, 2, auctionPrice, { value: listingPrice });
    txReceipt = await tx.wait();
    [marketItemCreatedEventLog] = txReceipt.events.filter((x) => { return x.event == "MarketItemCreated"; });
    expect(marketItemCreatedEventLog.args.tokenId).to.equal(2, "incorrect tokenId in MarketItemCreated Event!");
    expect(marketItemCreatedEventLog.args.itemId).to.equal(2, "incorrect itemId in MarketItemCreated Event!");
    expect(marketItemCreatedEventLog.args.price.toString()).to.equal(auctionPrice, "incorrect price in MarketItemCreated Event!");
  })

  const delay = ms => new Promise(res => setTimeout(res, ms));
  it('sells MarketItem in NFTMarket', async function () {
    const auctionPrice = (ethers.utils.parseEther("100")).toString(); // 100 sol
    let tx = await nftMarket.connect(buyer).approveTokensBeforeBuy(auctionPrice); // 100 sol-wei
    tx = await nftMarket.connect(buyer).createMarketSale(nft.address, 1);
    txReceipt = await tx.wait();

    [marketItemSoldEventLog] = txReceipt.events.filter((x) => { return x.event == "MarketItemSold" });
    // console.log("marketItemSoldEventLog: ", marketItemSoldEventLog);
    expect(marketItemSoldEventLog.args.tokenId).to.equal(1, "incorrect tokenId in MarketItemSold Event!");
    expect(marketItemSoldEventLog.args.itemId).to.equal(1, "incorrect itemId in MarketItemSold Event!");
    expect(marketItemSoldEventLog.args.price.toString()).to.equal(auctionPrice, "incorrect price in MarketItemSold Event!");
    expect(marketItemSoldEventLog.args.sold).to.equal(true, "incorrect sold bool in MarketItemSold Event!");
  })

  it('fetches Unsold MarketItems in NFTMarket', async function () {
    let marketItemsUnsold = await nftMarket.fetchMarketItems();
    marketItemsUnsold = await Promise.all(marketItemsUnsold.map(async i => {
      const tokenURI = await nft.tokenURI(i.tokenId);
      let item = {
        itemId: i.itemId.toString(),
        tokenId: i.tokenId.toString(),
        seller: i.seller,
        owner: i.owner,
        tokenURI
      }
      return item;
    }))
    expect(marketItemsUnsold.length).to.equal(1, "incorrect number of Unsold MarketItems!");
    expect(marketItemsUnsold[0].itemId).to.equal("2", "incorrect itemId for Unsold MarketItems!");
    expect(marketItemsUnsold[0].tokenId).to.equal("2", "incorrect tokenId for Unsold MarketItems!");
    expect(marketItemsUnsold[0].seller).to.equal(seller.address, "incorrect seller for Unsold MarketItems!");
    expect(marketItemsUnsold[0].tokenURI).to.equal("https://www.ipfs-location2.com", "incorrect tokenURI for Unsold MarketItems!");
  })

  it('fetches MarketItems owned by buyer in NFTMarket', async function () {
    let marketItemsOwned = await nftMarket.connect(buyer).fetchMyNFTs();
    marketItemsOwned = await Promise.all(marketItemsOwned.map(async i => {
      const tokenURI = await nft.tokenURI(i.tokenId);
      let item = {
        itemId: i.itemId.toString(),
        tokenId: i.tokenId.toString(),
        seller: i.seller,
        owner: i.owner,
        tokenURI
      }
      return item;
    }))
    expect(marketItemsOwned.length).to.equal(1, "incorrect number of MarketItems owned by buyer!");
    expect(marketItemsOwned[0].itemId).to.equal("1", "incorrect itemId for MarketItems owned by buyer!");
    expect(marketItemsOwned[0].tokenId).to.equal("1", "incorrect tokenId for MarketItems owned by buyer!");
    expect(marketItemsOwned[0].owner).to.equal(buyer.address, "incorrect owner for MarketItems owned by buyer!");
    expect(marketItemsOwned[0].tokenURI).to.equal("https://www.ipfs-location1.com", "incorrect tokenURI for MarketItems owned by buyer!");
  })

  it('fetches MarketItems listed by seller in NFTMarket', async function () {
    let marketItemsCreated = await nftMarket.connect(seller).fetchItemsCreated();
    marketItemsCreated = await Promise.all(marketItemsCreated.map(async i => {
      const tokenURI = await nft.tokenURI(i.tokenId);
      let item = {
        itemId: i.itemId.toString(),
        tokenId: i.tokenId.toString(),
        seller: i.seller,
        owner: i.owner,
        tokenURI
      }
      return item;
    }))
    expect(marketItemsCreated.length).to.equal(2, "incorrect number of MarketItems listed by seller!");
    expect(marketItemsCreated[0].itemId).to.equal("1", "incorrect itemId for MarketItems listed by seller!");
    expect(marketItemsCreated[0].tokenId).to.equal("1", "incorrect tokenId for MarketItems listed by seller!");
    expect(marketItemsCreated[0].seller).to.equal(seller.address, "incorrect seller for MarketItems listed by seller!");
    expect(marketItemsCreated[0].tokenURI).to.equal("https://www.ipfs-location1.com", "incorrect tokenURI for MarketItems listed by seller!");
    expect(marketItemsCreated[1].itemId).to.equal("2", "incorrect itemId for MarketItems listed by seller!");
    expect(marketItemsCreated[1].tokenId).to.equal("2", "incorrect tokenId for MarketItems listed by seller!");
    expect(marketItemsCreated[1].seller).to.equal(seller.address, "incorrect seller for MarketItems listed by seller!");
    expect(marketItemsCreated[1].tokenURI).to.equal("https://www.ipfs-location2.com", "incorrect tokenURI for MarketItems listed by seller!");
  })
})
