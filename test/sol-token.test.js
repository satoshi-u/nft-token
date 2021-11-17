const { expect } = require("chai");
const { ethers } = require("hardhat");

let solToken;
let accounts;
let owner;
let testAccount;
const initSupply = "1000000000000000000000000" // 10 million SOL

before(async () => {
    accounts = await ethers.getSigners();
    owner = accounts[0];
    testAccount = accounts[1];

    const SolToken = await ethers.getContractFactory("SolToken");
    solToken = await SolToken.deploy(initSupply);
    await solToken.deployed();
})

describe("SolToken", function () {
    it('initializes Token optional details', async function () {
        const name = await solToken.name();
        expect(name).to.equal("Sol Token", "doesn't have correct token name!");
        const symbol = await solToken.symbol();
        expect(symbol).to.equal("SOL", "doesn't have correct token symbol!");
        const decimals = await solToken.decimals();
        expect(decimals).to.equal(18, "doesn't have correct decimals!");
    })

    it('sets the total supply and allocates initial supply to owner upon deployment', async function () {
        const totalSupply = await solToken.totalSupply();
        expect(totalSupply).to.equal(initSupply, "doesn't have correct total supply!"); // 1000000
        let balance = await solToken.balanceOf(owner.address);
        expect(balance).to.equal(initSupply, "doesn't allocate correct initial supply to owner!"); // 1000000
    })

    it('transfers tokens correctly', async function () {
        await expect(
            solToken.connect(owner).transfer(testAccount.address, "1000000000000000000000001") // 1000001
        ).to.be.revertedWith(''); // ERC20: transfer amount exceeds balance
        await solToken.connect(owner).transfer(testAccount.address, "100000000000000000000"); // 100
        let balance = await solToken.balanceOf(testAccount.address);
        expect(balance).to.equal("100000000000000000000", "testAccount credit didn't happen after transfer!"); // 100
        balance = await solToken.balanceOf(owner.address);
        expect(balance).to.equal("999900000000000000000000", "owner debit didn't happen after transfer!"); // 999900 (100 gone)
    })
});
