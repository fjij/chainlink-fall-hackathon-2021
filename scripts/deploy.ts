// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import type { RandomBox } from "../typechain";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // @ts-ignore
  if (hre.network.name !== "rinkeby") {
    throw new Error(
      "Deployment script is only configured for the rinkeby network"
    );
  }

  // We get the contract to deploy
  const RandomBoxFactory = await ethers.getContractFactory("RandomBox");
  const randomBox = await RandomBoxFactory.deploy(
    "0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B",
    "0x01BE23585060835E02B77ef475b0Cc51aA1e0709",
    ethers.utils.parseEther("0.1"), // LINK tokens also have 18 decimals
    "0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311",
  ) as RandomBox;

  await randomBox.deployed();

  console.log("RandomBox deployed to:", randomBox.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
