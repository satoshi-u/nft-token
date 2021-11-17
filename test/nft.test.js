const { ethers } = require("hardhat");
const { expect } = require("chai");

let nftMarket;
let nft;
let accounts;
let seller;

before(async () => {
  accounts = await ethers.getSigners();
  seller = accounts[0];
  const name = "Sol Token";
  const symbol = "SOL";
  const initSupply = (ethers.utils.parseEther("1000000")).toString(); // 1000000 sol

  const SolToken = await ethers.getContractFactory("SolToken");
  solToken = await SolToken.deploy(name, symbol, initSupply);
  await solToken.deployed();

  const NFTMarket = await ethers.getContractFactory("NFTMarket");
  nftMarket = await NFTMarket.deploy(solToken.address);
  await nftMarket.deployed();

  const NFT = await ethers.getContractFactory("NFT");
  nft = await NFT.deploy(nftMarket.address);
  await nft.deployed();
})

describe("NFT", function () {
  it('initializes NFT correctly', async function () {
    let _contractAddress = await nft.getNFTMarketAddress();
    expect(_contractAddress).to.not.equal(0x0, "NFT doesn't have NFTMarket contractAddress instance correctly initialized!");
  });

  it('creates tokens in NFT', async function () {
    let tx = await nft.connect(seller).createToken("https://www.ipfs-location.com");
    let txReceipt = await tx.wait();
    [nftCreatedEventLog] = txReceipt.events.filter((x) => { return x.event == "NFTCreated"; });
    expect(nftCreatedEventLog.args.tokenURI).to.equal("https://www.ipfs-location.com", "incorrect tokenURI in NFTCreated Event!");
    expect(nftCreatedEventLog.args.tokenId).to.equal(1, "incorrect tokenId in NFTCreated Event!");
  })
})
