import { expect } from "chai";
import { ethers } from "hardhat";

describe("RandomBox", function () {
  it("Should work", async function () {
    const RandomBox = await ethers.getContractFactory("RandomBox");
    const randomBox = await RandomBox.deploy(
      "0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B",
      "0x01BE23585060835E02B77ef475b0Cc51aA1e0709",
      ethers.utils.parseEther("0.1"), // LINK tokens also have 18 decimals
      "0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311",
    );
    await randomBox.deployed();

    const CoolGems = await ethers.getContractFactory("CoolGems");
    const coolGems = await CoolGems.deploy(randomBox.address);
    await coolGems.mintRandomBox();
  });
});
