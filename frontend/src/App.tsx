import React, { useState, useEffect } from "react";
import "./App.css";
import RandomBoxAbi from "./RandomBoxAbi.json";
import type { RandomBox } from "../../typechain";
import Moralis from "moralis";
import { ethers } from "ethers";
import { useParams, useHistory } from "react-router-dom";
import NftGrid from "./NftGrid";
import SingleNft from "./SingleNft";
import type { NftReference } from "./nft";

Moralis.start({
  serverUrl: process.env.REACT_APP_SERVER_URL,
  appId: process.env.REACT_APP_APP_ID,
});

const RB_ADDRESS = process.env.REACT_APP_RB_ADDRESS as string;

export default function App() {
  const [signer, setSigner] = useState<ethers.Signer>();
  const [address, setAddress] = useState<string>();

  function Container({ children }: { children: React.ReactNode }) {
    return (
      <div className="App">
        <header className="App-header">{children}</header>
      </div>
    );
  }

  const ethereum = (window as any).ethereum;

  if (!ethereum) {
    return (
      <Container>
        <p>You need an ethereum wallet to access the app.</p>
        <p>
          Get{" "}
          <a href="https://metamask.io" className="App-link">
            Metamask
          </a>
          .
        </p>
      </Container>
    );
  }

  async function connectWallet() {
    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x4" }],
      });
    } catch (err) {
      if ((err as any).code === 4902) {
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x4",
              chainName: "Rinkeby Testnet",
              rpcUrls: [
                "https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
              ],
            },
          ],
        });
      }
    }
    await ethereum.request({ method: "eth_requestAccounts" });
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    setSigner(signer);
    setAddress(await signer.getAddress());
  }

  if (!signer || !address) {
    return (
      <Container>
        <p>Set your network to Rinkeby, then</p>
        <button className="App-button" onClick={connectWallet}>
          Connect Wallet
        </button>
      </Container>
    );
  }

  return (
    <Container>
      <ConnectedApp address={address} signer={signer} />
    </Container>
  );
}

interface ConnectedAppProps {
  address: string;
  signer: ethers.Signer;
}

function ConnectedApp({ address, signer }: ConnectedAppProps) {
  const { boxId } = useParams() as any;
  const history = useHistory();

  if (boxId) {
    return (
      <div className="App-panel">
        <RandomBoxUserInterface
          signer={signer}
          boxId={boxId}
          address={address}
        />
      </div>
    );
  }
  return (
    <div className="App-panel">
      <NftGrid
        address={address}
        tokenAddress={RB_ADDRESS}
        select="single"
        handleSingle={(nft) => history.push(`/app/${nft.token_id}`)}
      />
    </div>
  );
}

interface RandomBoxUserInterfaceProps {
  signer: ethers.Signer;
  boxId: number;
  address: string;
}

function RandomBoxUserInterface({
  signer,
  boxId,
  address,
}: RandomBoxUserInterfaceProps) {
  const [contract, setContract] = useState<RandomBox>();
  const [transacting, setTransacting] = useState(false);

  interface Details {
    owner: string;
    tokens: NftReference[];
    status: number;
    result: NftReference;
  }

  const [details, setDetails] = useState<Details>();

  useEffect(() => {
    setContract(
      new ethers.Contract(RB_ADDRESS, RandomBoxAbi, signer) as RandomBox
    );
  }, [signer]);

  useEffect(() => {
    if (contract) {
      const fetchDetails = async () => {
        const tokens = (await contract.getTokens(boxId)).map(
          ({ tokenContract, tokenId }) => ({
            tokenContract,
            tokenId: tokenId.toNumber(),
          })
        );
        const status = await contract.getStatus(boxId);
        const owner = await contract.ownerOf(boxId);
        const result = await contract.getResult(boxId);
        setDetails({
          status,
          tokens,
          owner,
          result: {
            ...result,
            tokenId: result.tokenId.toNumber(),
          },
        });
      };

      fetchDetails();
    }
  }, [contract]);

  if (!details || !contract) {
    return (
      <div className="RandomBoxUserInterface">
        <h1>Random Box #{boxId}</h1>
        <p>Loading...</p>
      </div>
    );
  }

  const statusString = (): string => {
    if (details.status === 0) {
      return "Unlocked";
    } else if (details.status === 1) {
      return "Ready to Open";
    } else if (details.status === 2) {
      return "Opening";
    } else if (details.status === 3) {
      return "Already Opened";
    }
    return "Unknown";
  };

  const canInteract = contract && !transacting;

  const openBox = async () => {
    if (canInteract) {
      setTransacting(true);
      try {
        const txn = await contract.open(boxId);
        await txn.wait();
      } catch (e) {
        console.error(e);
      }
      setTransacting(false);
    }
  };

  return (
    <div className="RandomBoxUserInterface">
      <h1>Random Box #{boxId}</h1>
      <p>
        Owner: <code className="App-code">{details.owner}</code>
      </p>
      <p>Status: {statusString()}</p>
      {details.status === 3 && (
        <>
          <p>Result:</p>
          <SingleNft nftReference={details.result} />
        </>
      )}
      {details.status === 1 && details.owner === address && (
        <button
          className="App-button"
          onClick={openBox}
          disabled={!canInteract}
        >
          Open
        </button>
      )}
      <p>Potential Contents:</p>
      {details.tokens && <NftGrid specific={details.tokens} />}
    </div>
  );
}
