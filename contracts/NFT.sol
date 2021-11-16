// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    address contractAddress;

    function getNFTMarketAddress() public view returns (address) {
        return contractAddress;
    }

    event NFTCreated(string tokenURI, uint256 tokenId);

    constructor(address marketPlaceAddress)
        ERC721("Decentralized-Digital-MarketPlace", "DDM")
    {
        contractAddress = marketPlaceAddress;
    }

    function createToken(string memory tokenURI) public returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        setApprovalForAll(contractAddress, true);
        emit NFTCreated(tokenURI, newTokenId);
        return newTokenId;
    }
}
