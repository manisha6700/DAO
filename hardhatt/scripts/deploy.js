const {ethers} = require("hardhat");
const { CRYPTODEVS_NFT_CONTRACT_ADDRESS } = require("../constants");

async function main(){

  const FakeNFTMarketplace = await ethers.getContractFactory(
    "FakeNFTMarketplace"
  )

  const fakeNftMarketplace = await FakeNFTMarketplace.deploy();
  await fakeNftMarketplace.deployed();

  console.log("FakeNFTMarketPlace deployed to: ", fakeNftMarketplace.address);

  const CryptoDevsDAO = await ethers.getContractFactory(
    "CryptoDevsDAO"
  )

  const cryptoDevsDAO = await CryptoDevsDAO.deploy(
    fakeNftMarketplace.address,
    CRYPTODEVS_NFT_CONTRACT_ADDRESS, 
    {
      value: ethers.utils.parseEther("0.01"),
    }
  );
  await cryptoDevsDAO.deployed();

  console.log("CryptoDevsDAO deployed to: ",cryptoDevsDAO.address)

}

main()
.then(() => process.exit(0))
.catch((err) => {
  console.error(err);
  process.exit(1);
})