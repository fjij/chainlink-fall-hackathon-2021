import Web3 from "web3";

import Moralis from "moralis";

import { OpenSeaPort, Network } from "opensea-js";

export interface Nft {
  token_address: string;
  token_id: string;
  metadata?: string | undefined;
  name: string;
  symbol: string;
}

const provider = new Web3.providers.HttpProvider("https://rinkeby.infura.io");

const seaport = new OpenSeaPort(provider, {
  networkName: Network.Rinkeby,
});

export function nftKey(nft: Nft): string {
  return `${nft.token_address}/${nft.token_id}`;
}

export async function getNftsForContract(
  address: string,
  tokenAddress: string,
  offset: number,
  limit: number
): Promise<Nft[]> {
  if (!process.env.REACT_APP_BACKUP) {
    const { result } = await Moralis.Web3API.account.getNFTsForContract({
      chain: "0x4",
      address,
      offset,
      limit,
      token_address: tokenAddress,
    });

    if (!result) {
      throw new Error("No result");
    }

    return result;
  } else {
    const { assets } = await seaport.api.getAssets({
      owner: address,
      asset_contract_address: tokenAddress,
      order_direction: "desc",
      limit,
      offset,
    });
    return assets.map((asset) => ({
      token_address: asset.assetContract.address,
      token_id: asset.tokenId ?? "0",
      name: asset.assetContract.name,
      symbol: asset.assetContract.tokenSymbol,
      metadata: JSON.stringify({
        image: asset.imageUrl,
      }),
    }));
  }
}

export async function getNfts(
  address: string,
  offset: number,
  limit: number
): Promise<Nft[]> {
  if (!process.env.REACT_APP_BACKUP) {
    const { result } = await Moralis.Web3API.account.getNFTs({
      chain: "0x4",
      address,
      offset,
      limit,
    });

    if (!result) {
      throw new Error("No result");
    }

    return result;
  } else {
    const { assets } = await seaport.api.getAssets({
      owner: address,
      order_direction: "desc",
      limit,
      offset,
    });
    return assets.map((asset) => ({
      token_address: asset.assetContract.address,
      token_id: asset.tokenId ?? "0",
      name: asset.assetContract.name,
      symbol: asset.assetContract.tokenSymbol,
      metadata: JSON.stringify({
        image: asset.imageUrl,
      }),
    }));
  }
}

export interface NftReference {
  tokenContract: string;
  tokenId: number;
}

export async function getSpecificNfts(
  references: NftReference[],
  offset: number,
  limit: number
): Promise<Nft[]> {
  if (references.length === 0) {
    return [];
  }

  const contracts = references.map(({ tokenContract }) => tokenContract);
  const tokenIds = references.map(({ tokenId }) => tokenId);

  const { assets } = await seaport.api.getAssets({
    order_direction: "desc",
    asset_contract_addresses: contracts,
    token_ids: tokenIds,
    limit,
    offset,
  } as any);

  return assets.map((asset) => ({
    token_address: asset.assetContract.address,
    token_id: asset.tokenId ?? "0",
    name: asset.assetContract.name,
    symbol: asset.assetContract.tokenSymbol,
    metadata: JSON.stringify({
      image: asset.imageUrl,
    }),
  }));
}
