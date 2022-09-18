import { Contract, providers } from "ethers";
import { formatEther } from "ethers/lib/utils";
import Head from 'next/head'
import { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import {
  CRYPTODEVS_DAO_ABI,
  CRYPTODEVS_DAO_CONTRACT_ADDRESS,
  CRYPTODEVS_NFT_ABI,
  CRYPTODEVS_NFT_CONTRACT_ADDRESS,
} from "../constants";
import styles from '../styles/Home.module.css'

export default function Home() {

  
  const [walletConnected, setWalletConnected] = useState(false);
  //users's balance in cryptodev nft
  const [nftBalance, setNftBalance] = useState(0);
  //eth balance of dao contract
  const [treasuryBalance, setTreasuryBalance] = useState("0");
  //array of all proposals created in dao
  const [proposals, setProposals] = useState([])
  //fake nft tokenId to purchase
  const [fakeNftTokenId, setFakeNftTokenId] = useState("");
  //Either "Create Proposal" or "View Proposals"
  const [numProposals, setNumProposals] = useState("0");
  const [selectedTab, setSelectedTab] = useState("");
  const [loading, setLoading] = useState(false);
  const web3ModalRef = useRef();


  const connectWallet = async() => {
    try{
      await getProviderOrSigner();
      setWalletConnected(true);
    }catch(err){
      console.error(err);
      if(err.reason){
        const reason = err.reason.split(":");
        window.alert(reason[1]);
      }
    }
  }

  const getProviderOrSigner = async(needSigner = false) => {
    
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const {chainId} = await web3Provider.getNetwork();
    if(chainId !== 5){
      window.alert("Please connect to Goerli Network");
      throw new Error("Please connect to Goerli Network");
    }

    if(needSigner){
      const signer = web3Provider.getSigner();
      return signer;
    }

    return web3Provider;
   
  }

  const getDaoContractInstance = (providerOrSigner) => {
    return new Contract (
      CRYPTODEVS_DAO_CONTRACT_ADDRESS,
      CRYPTODEVS_DAO_ABI,
      providerOrSigner
    )
  }

  const getCryptodevsNFTContractInstance = (providerOrSigner) => {
    return new Contract (
      CRYPTODEVS_NFT_CONTRACT_ADDRESS,
      CRYPTODEVS_NFT_ABI,
      providerOrSigner
    )
  }

  const getDAOTreasuryBalance = async() =>{
    try{
      const provider = await getProviderOrSigner();
      const balance = await provider.getBalance(
        CRYPTODEVS_DAO_CONTRACT_ADDRESS
      );

      setTreasuryBalance(balance.toString());
    }catch(err){
      console.log(err);
      if(err.reason){
        const reason = err.reason.split(":");
        window.alert(reason[1]);
      }
    }
  }

  const getUserNFTBalance = async() =>{
    try{
      const signer = await getProviderOrSigner(true);
      const nftContract = getCryptodevsNFTContractInstance(signer);

      const balance = await nftContract.balanceOf(signer.getAddress());
      setNftBalance(parseInt(balance.toString()));
    }catch(err){
      console.log(err);
      if(err.reason){
        const reason = err.reason.split(":");
        window.alert(reason[1]);
      }
    }
  }

  const getNumProposalsInDAO = async () =>{
    try{
      const provider = await getProviderOrSigner();
      const contract = getDaoContractInstance(provider);

      const daoNumProposals = await contract.numProposals();
      setNumProposals(daoNumProposals.toString());
    }catch(err){
      console.error(err);
      if(err.reason){
        const reason = err.reason.split(":");
        window.alert(reason[1]);
      }
    }
  }

  const createPorposal = async () => {
    try{
      const signer = await getProviderOrSigner(true);
      const contract = getDaoContractInstance(signer);

      const transac = await contract.createProposal(fakeNftTokenId);
      setLoading(true);
      await transac.wait();
      await getNumProposalsInDAO();
      setLoading(false);
      window.alert("You have successfully created a Proposal")
    }catch(err){
      console.error(err);
      if(err.reason){
        const reason = err.reason.split(":");
        window.alert(reason[1]);
      }
    }
  }

  const fetchProposalById = async (id) => {
    try{
      const provider = await getProviderOrSigner();
      const contract = getDaoContractInstance(provider);
      
      const proposal = await contract.proposals(id);
      const parsedProposal = {
        proposalId : id,
        nftTokenId : proposal.nftTokenId.toString(),
        deadline: new Date(parseInt(proposal.deadline.toString()) * 1000),
        yayVotes: proposal.yayVotes.toString(),
        nayVotes: proposal.nayVotes.toString(),
        executed: proposal.executed
      }
      return parsedProposal;
    }catch(err){
      console.error(err);
      if(err.reason){
        const reason = err.reason.split(":");
        window.alert(reason[1]);
      }
    }
  }

  const fetchAllProposals = async () => {
    try{
      const proposals = [];
      for(let i = 0;i< numProposals; i++){
        const proposal = await fetchProposalById(i);
        proposals.push(proposal);
      }
      setProposals(proposals);
    }catch(err){
      console.error(err);
      if(err.reason){
        const reason = err.reason.split(":");
        window.alert(reason[1]);
      }
    }
  }

  const voteOnProposal = async (proposalId, _vote) => {
    try{
      const signer = await getProviderOrSigner(true);
      const contract = getDaoContractInstance(signer);

      let vote = _vote === "YAY" ? 0 : 1;
      const transact = await contract.voteOnProposal(proposalId, vote);
      setLoading(true);
      await transact.wait();
      setLoading(false);
      await fetchAllProposals();

    }catch(err){
      console.error(err);
      if(err.reason){
        const reason = err.reason.split(":");
        window.alert(reason[1]);
      }
    }
  }

  const executeProposal = async (proposalId) => {
    try{
      const signer = await getProviderOrSigner(true);
      const contract = getDaoContractInstance(signer);

      const transact = await contract.executeProposal(proposalId);
      setLoading(true);
      await transact.wait();
      setLoading(false);
      await fetchAllProposals();
      window.alert("You have successfully executed a Proposal")
    }catch(err){
      console.error(err)
      if(err.reason){
        const reason = err.reason.split(":");
        window.alert(reason[1]);
      }
    }
  }

  useEffect(() => {
    if(!walletConnected){
      web3ModalRef.current = new Web3Modal({
        network:"goerli",
        providerOptions: {},
        disableInjectedProvider: false
      })

      connectWallet().then(() => {
        getDAOTreasuryBalance();
        getUserNFTBalance();
        getNumProposalsInDAO();
      })
    }
  }, [walletConnected])
  
  useEffect(() => {
    if(selectedTab === "View Proposals"){
      fetchAllProposals();
    }
  }, [selectedTab])

  function renderTabs() {
    if(selectedTab === "Create Proposal"){
      return renderCreateProposalTab();
    }else if(selectedTab === "View Proposals"){
      return renderViewProposalsTab();
    }
      return null;
  }

  function renderCreateProposalTab(){
    if(loading){
      return (
        <div className={styles.description}>
          Laoding... Waiting for Transaction
        </div>
      )
    }else if(nftBalance === 0){
      return(
        <div className={styles.description}>
          You do not own any NFT. <br/>
          <b>You cannot create or vote on Proposals</b>
        </div>
      )
    }else{
      return(
        <div className={styles.container}>
          <label>Fake NFT Token ID to Purchase:</label>
          <input placeholder="0" type="number" onChange={(e) => setFakeNftTokenId(e.target.value)}/>
          <button className={styles.button2} onClick={createPorposal}>
            Create
          </button>
        </div>
      )
    }
  }

  function renderViewProposalsTab(){
    if(loading){
      return (
        <div className={styles.description}>
          Loading... Waiting for Transaction
        </div>
      )
    }else if(proposals.length === 0){
      return (
        <div className={styles.description}>
          No Proposals have been created
        </div>
      )
    }else {
      return(
        <div>
          {
            proposals.map((p,index)=>(
              <div key={index} className={styles.proposalCard}>
                <p>Proposal ID: {p.proposalId}</p>
                <p>Fake NFT to purchase: {p.nftTokenId}</p>
                <p>Deadline: {p.deadline.toLocaleString()}</p>
                <p>Yay Votes: {p.yayVotes}</p>
                <p>Nay Votes: {p.nayVotes}</p>
                <p>Executed?: {p.executed.toString()}</p>
                {
                  p.deadline.getTime() > Date.now() && !p.executed ? (
                    <div className={styles.flex}>
                      <button className={styles.button2} onClick={() => voteOnProposal(p.proposalId, "YAY")}>
                        Vote YAY
                      </button>
                      <button className={styles.button2} onClick={() => voteOnProposal(p.proposalId, "NAY")}>
                        Vote NAY
                      </button>
                    </div>
                  ) : (
                    p.deadline.getTime() < Date.now() && !p.executed ? (
                      <div className={styles.flex}>
                        <button className={styles.button2} onClick={()  => executeProposal(p.proposalId)}>
                          Execute Proposal{" "}
                          {p.yayVotes > p.nayVotes ? "(YAY)" : "(NAY)"}
                        </button>
                      </div>
                    ) : (
                      <div className={styles.description}>
                        Proposal Executed
                      </div>
                    )
                  )
                }
              </div>
            ))
          }
        </div>
      )
    }
  }
  

  return (
    <div className={styles.container}>
      <Head>
        <title>Manisha&apos;s DAO</title>
        <meta name="description" content="Manisha's DAO" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Manisha&apos;s DAO</h1>
          <div className={styles.description}>
            Your CryptoDevs Balance: {nftBalance}
            <br/>
            Treasury Balance: {formatEther(treasuryBalance)} ETH
            <br/>
            Total Number of Proposals: {numProposals}
          </div>
          <div className={styles.flex}>
            <button className={styles.button} onClick={() => setSelectedTab("Create Proposal")}>
              Create Proposal
            </button>
            <button className={styles.button} onClick={() => setSelectedTab("View Proposals")}>
              View Proposals
            </button>
          </div>
          {renderTabs()}
        </div>
        <div>
          <img className={styles.image} src="/cryptodevs/0.svg"/>
        </div>
      </div>
      
      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  )
}

