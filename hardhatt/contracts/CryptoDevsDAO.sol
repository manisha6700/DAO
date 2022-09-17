// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

// We will add the Interfaces here
interface IFakeNFTMarketplace{
    function purchase(uint256 _tokenId) external payable;
    function getPrice() external view returns (uint256);
    function available(uint256 _tokenId) external view returns(bool);
}

interface ICryptoDevsNFT{
    function balanceOf(address owner) external view returns(uint);
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns(uint256);
}

contract CryptoDevsDAO is Ownable {

    struct Proposal{
        //nft to buy from the secondary marketplace
        uint256 nftTokenId;
        //when does voting ends
        uint256 deadline;

        uint256 yayVotes;
        uint256 nayVotes;

        bool executed;

        mapping(uint => bool) voters;
    }

    //proposal ID => Proposal
    mapping(uint256 => Proposal) public proposals;
    uint256 public numProposals;

    enum Vote{
        YAY, //YAY=0
        NAY //NAY=1
    }

    IFakeNFTMarketplace nftMarketplace;
    ICryptoDevsNFT cryptoDevsNFT;

    constructor(address _nftMarketplace, address _cryptoDevsNFT) payable {
        nftMarketplace = IFakeNFTMarketplace(_nftMarketplace);
        cryptoDevsNFT = ICryptoDevsNFT(_cryptoDevsNFT);
    }

    modifier nftHolderOnly() {
        require(cryptoDevsNFT.balanceOf(msg.sender) > 0, "Not a Dao Member");
        _;
    }

    modifier activeProposalOnly(uint256 proposalIndex) {
        require(
            proposals[proposalIndex].deadline > block.timestamp, "Deadline Exceeded"
        );
        _;
    }

    modifier inactiveProposalOnly(uint256 proposalIndex) {
        require(
            proposals[proposalIndex].deadline <= block.timestamp,
            "Deadline Not Exceeded"
        );
        require(
            proposals[proposalIndex].executed == false,
            "Proposal Already Executed"
        );
        _;
    }

    //create a proposal - memberonly
    //nftTokenId is the NFT we want to buy from the "FakeNFTMarketplace"
    //returns id of newly created proposal
    function createProposal(uint256 _nftTokenId) external nftHolderOnly returns(uint256){
        require(nftMarketplace.available(_nftTokenId), "NFT Not For Sale");

        Proposal storage proposal = proposals[numProposals];
        proposal.nftTokenId = _nftTokenId;
        proposal.deadline = block.timestamp + 5 minutes;

        numProposals++;

        //return id of proposal
        //decrement because we have incremented it above 
        return numProposals - 1;
    }

    //vote on a proposal - memberonly
    function voteOnProposal(uint256 proposalIndex, Vote vote) external nftHolderOnly activeProposalOnly(proposalIndex){
        Proposal storage proposal = proposals[proposalIndex];

        //to check how much voting power the user has 
        uint256 voterNFTBalance = cryptoDevsNFT.balanceOf(msg.sender);
        uint numVotes = 0;

        //loop over all tokenid to verify the actual votes remaining
        for(uint256 i = 0;i<voterNFTBalance;++i){
            uint256 tokenId = cryptoDevsNFT.tokenOfOwnerByIndex(msg.sender, i);
            //to check if the tokenid has already used for voting
            if(proposal.voters[tokenId] == false){
                numVotes++;
                proposal.voters[tokenId] = true;
            }
        }

        require(numVotes > 0, "Already Voted");

        if(vote == Vote.YAY){
            proposal.yayVotes += numVotes;
        }else{
            proposal.nayVotes += numVotes;
        }
    }

    //execute the proposal - memberonly
    function executeProposal(uint proposalIndex) external nftHolderOnly inactiveProposalOnly(proposalIndex){
        Proposal storage proposal = proposals[proposalIndex];

        //If YAY votes are more than NAY votes purchase NFT from marketplace
        if(proposal.yayVotes > proposal.nayVotes){
            uint256 nftPrice = nftMarketplace.getPrice();
            require(address(this).balance >= nftPrice, "Not enough Funds");
            nftMarketplace.purchase{value: nftPrice}(proposal.nftTokenId);
        }
        proposal.executed = true;
    }

    function withdrawEther() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    receive() external payable{}
    fallback() external payable{}

}