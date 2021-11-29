import React from "react";
import type { Nft } from "./nft";
import "./NftDisplay.css";

interface NftDisplayProps {
  nft: Nft;
  selected?: boolean;
  onSelected?: (selected: boolean) => void;
}

export default function NftDisplay({
  nft,
  selected,
  onSelected,
}: NftDisplayProps) {
  function Image() {
    if (nft.metadata) {
      try {
        const { image, description } = JSON.parse(nft.metadata);
        if (image) {
          return (
            <img
              draggable={false}
              className="NftDisplay-image"
              src={image}
              alt={description ?? nft.name}
            />
          );
        }
      } catch {}
    }
    return (
      <div className="NftDisplay-image-container">
        <span className="NftDisplay-image-backup">{nft.symbol}</span>
      </div>
    );
  }

  function Details() {
    return (
      <div className="NftDisplay-details">
        <a
          href={`https://rinkeby.etherscan.io/token/${nft.token_address}/?a=${nft.token_id}`}
          target="_blank"
          rel="noreferrer"
          className="App-link"
        >
          Etherscan
        </a>
      </div>
    );
  }

  return (
    <div
      className={"NftDisplay" + (selected ? " selected" : "")}
      onClick={() => (onSelected ? onSelected(!selected) : undefined)}
    >
      <span className="NftDisplay-title">
        {nft.name.length <= 16 ? nft.name : nft.symbol} #{nft.token_id}
      </span>
      <div className="NftDisplay-body">
        <Image />
        <Details />
      </div>
    </div>
  );
}
