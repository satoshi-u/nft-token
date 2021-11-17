// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface ISolToken {
    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(address recipient, uint256 amount)
        external
        returns (bool);

    function allowance(address owner, address spender)
        external
        view
        returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    function approveNFTMarketBuy(
        address _owner,
        address _spender,
        uint256 _amount
    ) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);

    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// interface ISolToken is IERC20 {
//     function _approveNFTMarketBuy(
//         address _owner,
//         address _spender,
//         uint256 _amount
//     ) external returns (bool);
// }

// Create a Marketplace Smart contract to buy and sell NFT with your custom ERC20 token.
// The candidate can use the standard library if needed.
// Functionalities:
// Buy, Sell, and Mint NFT
// Create 3 different SC For ERC20, ERC721, and Marketplace.
contract NFTMarket is ReentrancyGuard {
    address public solTokenAddr;
    address payable owner;
    uint256 listingPrice = 0.025 ether;

    function getListingPrice() public view returns (uint256) {
        return listingPrice;
    }

    using Counters for Counters.Counter;
    Counters.Counter private _itemIds;
    Counters.Counter private _itemsSold; // (_itemsLeft = _itemIds - _itemsSold)

    //address _solTokenAddr
    constructor(address _solTokenAddr) {
        solTokenAddr = _solTokenAddr;
        owner = payable(msg.sender);
    }

    struct MarketItem {
        uint256 itemId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }

    mapping(uint256 => MarketItem) private idTtoMarketItem;

    event MarketItemCreated(
        uint256 indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold
    );

    event MarketItemSold(
        uint256 indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address buyer,
        uint256 price,
        bool sold
    );

    function createMarketItem(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) public payable nonReentrant {
        require(price > 0, "Price must at least be 1 sol-wei");
        require(
            msg.value == listingPrice,
            "msg.value must be equal to listing price, 0.025 eth"
        );
        _itemIds.increment();
        uint256 itemId = _itemIds.current();
        idTtoMarketItem[itemId] = MarketItem(
            itemId,
            nftContract,
            tokenId,
            payable(msg.sender),
            payable(address(0)),
            price,
            false
        );
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        emit MarketItemCreated(
            itemId,
            nftContract,
            tokenId,
            payable(msg.sender),
            payable(address(0)),
            price,
            false
        );
    }

    // approve tokens to NFTMarket from buyer
    function approveTokensBeforeBuy(uint256 _amount) public {
        ISolToken(solTokenAddr).approveNFTMarketBuy(
            msg.sender,
            address(this),
            _amount
        );
    }

    function createMarketSale(address nftContract, uint256 itemId)
        public
        payable
        nonReentrant
    {
        uint256 price = idTtoMarketItem[itemId].price;
        uint256 tokenId = idTtoMarketItem[itemId].tokenId;
        address payable buyer = payable(msg.sender);
        address payable seller = payable(idTtoMarketItem[itemId].seller);

        // first approve this NFTMarket contract for these many tokens using approveTokensBeforeBuy
        ISolToken(solTokenAddr).transferFrom(msg.sender, address(this), price); //transfer tokens to NFTMarket
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId); //transfer NFT to buyer
        idTtoMarketItem[itemId].owner = buyer;
        idTtoMarketItem[itemId].sold = true;
        _itemsSold.increment();
        emit MarketItemSold(
            itemId,
            nftContract,
            tokenId,
            seller,
            buyer,
            price,
            true
        );
        ISolToken(solTokenAddr).transfer(idTtoMarketItem[itemId].seller, price); //transfer tokens to NFTMarket
    }

    function fetchMarketItems() public view returns (MarketItem[] memory) {
        uint256 itemCount = _itemIds.current();
        uint256 unsoldItemCount = _itemIds.current() - _itemsSold.current();
        uint256 currentIndex = 0;
        MarketItem[] memory items = new MarketItem[](unsoldItemCount);
        for (uint256 i = 0; i < itemCount; i++) {
            if (idTtoMarketItem[i + 1].owner == address(0)) {
                uint256 currentId = idTtoMarketItem[i + 1].itemId;
                MarketItem storage currentItem = idTtoMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    function fetchMyNFTs() public view returns (MarketItem[] memory) {
        uint256 totalItemCount = _itemIds.current();
        uint256 itemCount = 0;
        uint256 currentIndex = 0;
        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idTtoMarketItem[i + 1].owner == msg.sender) {
                itemCount += 1;
            }
        }
        MarketItem[] memory items = new MarketItem[](itemCount);
        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idTtoMarketItem[i + 1].owner == msg.sender) {
                uint256 currentId = idTtoMarketItem[i + 1].itemId;
                MarketItem storage currentItem = idTtoMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    function fetchItemsCreated() public view returns (MarketItem[] memory) {
        uint256 totalItemCount = _itemIds.current();
        uint256 itemCount = 0;
        uint256 currentIndex = 0;
        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idTtoMarketItem[i + 1].seller == msg.sender) {
                itemCount += 1;
            }
        }
        MarketItem[] memory items = new MarketItem[](itemCount);
        for (uint256 i = 0; i < itemCount; i++) {
            if (idTtoMarketItem[i + 1].seller == msg.sender) {
                uint256 currentId = idTtoMarketItem[i + 1].itemId;
                MarketItem storage currentItem = idTtoMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }
}
