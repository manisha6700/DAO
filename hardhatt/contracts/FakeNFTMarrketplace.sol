// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract FakeNFTMarketplace {

//maps tokenids to owners
    mapping(uint => address) public tokens;

    uint256 nftPrice = 0.001 ether;

    //purchase() takes some eth and marks msg.sender as the owner of NFT
    function purchase(uint256 _tokenId) external payable {
        require(msg.value == nftPrice, "Not Enough Ethers");
        require(tokens[_tokenId] == address(0), "Token is not for sale");

        tokens[_tokenId] = msg.sender;
    }

    function getPrice() external view returns(uint256) {
        return nftPrice;
    }

    function available(uint256 _tokenId) external view returns(bool){
        if(tokens[_tokenId] == address(0)){
            return true;
        }
        return false;
    }
    
}