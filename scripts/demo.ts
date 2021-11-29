import { ethers } from "hardhat";

async function main() {
  // @ts-ignore
  if (hre.network.name !== "rinkeby") {
    throw new Error(
      "Deployment script is only configured for the rinkeby network"
    );
  }

  const CoolGems = await ethers.getContractFactory("CoolGems");
  const coolGems = await CoolGems.deploy(
    "0x59a0c170761Cf67343FDD101d9f30BFA2d43528b",
  );

  await coolGems.deployed();

  console.log("CoolGems deployed to:", coolGems.address);

  await coolGems.mintRandomBox();
  await coolGems.mintRandomBox();
  await coolGems.mintRandomBox();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
