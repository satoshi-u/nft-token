# nft-custom-erc20-buy
<br />

If using the latest commit, please follow these steps to deploy and test in remix/testnet.

Deploy the SolToken contract first, providing an initial supply of, say 1 million :
```shell
1000000000000000000000000
```
<br />
<br />

Deploy the NFTMarket contract by providing the address of SolToken, which we just deployed : 
```shell
$ SolToken Address
```
<br />
<br />

Deploy the NFT contract by providing the address of NFTMarket, which we just deployed :
```shell
$ NFTMarket Address
```
<br />
<br />

Now, in NFT, using seller's account,
Invoke createToken method with, say "token1uri" :
```shell
"token1uri"
```
This will store this URI against tokenId "1".
<br />
<br />

Now, in NFTMarket, using seller's account,
Invoke createMarketItem method with following args {NFTAddress, tokenId(1), price(say 50 SOL)} :
```shell
$ NFT Address
```
```shell
1
```
```shell
50000000000000000000
```
Note: In msg.value, give 0.025 ether as listingFee 
```shell
25000000000000000
```
This will list our item in NFT Market Place against itemId "1".
<br />
<br />

Now, in SolToken, using buyer's account,
Invoke approve with following args {NFTMarketAddress, amount(50 SOL)} :
```shell
$ NFTMarket Address
```
```shell
50000000000000000000
```
This will approve NFTMarket to transfer tokens from buyer to itself.
<br />
<br />

Now, in NFTMarket, using buyer's account,
Invoke createMarketSale method with following args {NFTAddress, itemId(1)} :
```shell
$ NFTMarket Address
```
```shell
1
```
This will transfer the itemId "1" NFT to buyer and transfer 50 SOL to seller.
Also, it will transfer 0.025 ether listingFee from NFTMarket to the owner of contract.
<br />
<br />

<br />
<br />
To test locally with hardhat, pull the previous commit and :

```shell
npx hardhat compile
npx hardhat test
```
<br />
