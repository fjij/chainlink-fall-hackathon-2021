import React, { useState, useEffect } from "react";
import { getSpecificNfts } from "./nft";
import NftDisplay from "./NftDisplay";
import "./SingleNft.css";

import type { Nft, NftReference } from "./nft";

interface SingleNftProps {
  nftReference: NftReference;
}

export default function SingleNft({ nftReference }: SingleNftProps) {
  const [nft, setNft] = useState<Nft>();

  useEffect(() => {
    (async () => {
      const [nft] = await getSpecificNfts([nftReference], 0, 1);
      if (nft) {
        setNft(nft);
      }
    })();
  }, []);

  if (!nft) {
    return <div className="SingleNft" />;
  }

  return (
    <div className="SingleNft">
      <div className="SingleNft-container">
        <NftDisplay nft={nft} />
      </div>
    </div>
  );
}
