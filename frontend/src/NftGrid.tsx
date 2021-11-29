import React, { useState, useEffect } from "react";
import { nftKey, getNftsForContract, getNfts, getSpecificNfts } from "./nft";
import NftDisplay from "./NftDisplay";
import "./NftGrid.css";

import type { Nft, NftReference } from "./nft";

interface NftGridProps {
  address?: string;
  tokenAddress?: string;
  handleMany?: (nfts: Nft[]) => void;
  handleSingle?: (nft: Nft) => void;
  select?: "single" | "many";
  specific?: NftReference[];
}

export default function NftGrid({
  address,
  handleMany,
  handleSingle,
  select,
  tokenAddress,
  specific,
}: NftGridProps) {
  const limit = 15;
  const [offset, setOffset] = useState(0);
  const [nfts, setNfts] = useState<Nft[]>();
  const [max, setMax] = useState<number>();
  const [selectedSet, setSelectedSet] = useState<{ [key: string]: Nft }>({});

  useEffect(() => {
    (async () => {
      const getResult = async (): Promise<Nft[]> => {
        if (specific) {
          return await getSpecificNfts(specific, offset, limit);
        } else if (tokenAddress && address) {
          return await getNftsForContract(address, tokenAddress, offset, limit);
        } else if (address) {
          return await getNfts(address, offset, limit);
        }
        return [];
      };
      const result = await getResult();
      if (result.length === 0 && offset > 0) {
        setMax(offset);
        setOffset(offset - limit);
      } else if (result.length < limit) {
        setMax(offset + 1);
      }
      setNfts(result);
    })();
  }, [address, offset, tokenAddress]);

  if (!nfts) {
    return (
      <div className="NftGrid">
        <p>Loading...</p>
      </div>
    );
  }

  const selectedSetLength = Object.keys(selectedSet).length;

  return (
    <div className="NftGrid">
      <div className="NftGrid-container">
        {nfts.map((nft) => (
          <NftDisplay
            nft={nft}
            key={nftKey(nft)}
            selected={!!selectedSet[nftKey(nft)]}
            onSelected={(selected) => {
              if (!select) {
                return;
              }
              const key = nftKey(nft);
              if (selected) {
                if (select === "single") {
                  setSelectedSet(() => {
                    const newSelectedSet: { [key: string]: Nft } = {};
                    newSelectedSet[key] = nft;
                    return newSelectedSet;
                  });
                } else if (select === "many") {
                  setSelectedSet((selectedSet) => {
                    const newSelectedSet = { ...selectedSet };
                    newSelectedSet[key] = nft;
                    return newSelectedSet;
                  });
                }
              } else {
                setSelectedSet((selectedSet) => {
                  const newSelectedSet = { ...selectedSet };
                  delete newSelectedSet[key];
                  return newSelectedSet;
                });
              }
            }}
          />
        ))}
      </div>
      <button
        className="NftGrid-pagination-button"
        disabled={offset === 0}
        onClick={() => setOffset((offset) => offset - limit)}
      >
        Prev
      </button>
      <span>Page {offset / limit + 1}</span>
      <button
        className="NftGrid-pagination-button"
        disabled={max !== undefined && offset + limit >= max}
        onClick={() => setOffset((offset) => offset + limit)}
      >
        Next
      </button>
      {select && (
        <>
          <br />
          <br />
          <button
            className="App-button"
            disabled={selectedSetLength === 0}
            onClick={
              select === "single"
                ? () =>
                    handleSingle
                      ? handleSingle(Object.values(selectedSet)[0])
                      : undefined
                : () =>
                    handleMany
                      ? handleMany(Object.values(selectedSet))
                      : undefined
            }
          >
            Choose {selectedSetLength > 1 ? `${selectedSetLength} NFTs` : "NFT"}
          </button>
        </>
      )}
    </div>
  );
}
