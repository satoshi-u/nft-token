const hre = require("hardhat");

async function main() {
  const name = "Sol Token";
  const symbol = "SOL";
  const initSupply = (ethers.utils.parseEther("1000000")).toString(); // 1000000 sol

  const SolToken = await ethers.getContractFactory("SolToken");
  solToken = await SolToken.deploy(name, symbol, initSupply);
  await solToken.deployed();

  const NFTMarket = await ethers.getContractFactory("NFTMarket");
  const nftMarket = await NFTMarket.deploy();
  await nftMarket.deployed();
  console.log("NFTMarket deployed to:", nftMarket.address);

  const NFT = await ethers.getContractFactory("NFT");
  const nft = await NFT.deploy(nftMarket.address);
  await nft.deployed();
  console.log("NFT deployed to:", nft.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
