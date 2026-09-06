const { expect } = require("chai");
const { ethers } = require("hardhat");
const crypto = require("crypto");

function sha256Hex(content) {
  return "0x" + crypto.createHash("sha256").update(content).digest("hex");
}

describe("VerificationRegistry", function () {
  let contract;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("VerificationRegistry");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
  });

  it("starts with zero records", async function () {
    expect(await contract.recordCount()).to.equal(0n);
  });

  it("submits a record and emits RecordSubmitted", async function () {
    const hash = sha256Hex("hello world");
    await expect(contract.submitRecord(hash, "https://example.test/post/1"))
      .to.emit(contract, "RecordSubmitted")
      .withArgs(0n, hash, owner.address);

    expect(await contract.recordCount()).to.equal(1n);
  });

  it("fetches back exactly what was submitted", async function () {
    const hash = sha256Hex("some post content");
    await contract.submitRecord(hash, "https://example.test/post/2");

    const record = await contract.getRecord(0);
    expect(record[0]).to.equal(hash);
    expect(record[1]).to.equal("https://example.test/post/2");
    expect(record[3]).to.equal(owner.address);
  });

  it("verifyRecord returns true for the original hash", async function () {
    const hash = sha256Hex("original content");
    await contract.submitRecord(hash, "https://example.test/post/3");

    expect(await contract.verifyRecord(0, hash)).to.equal(true);
  });

  it("verifyRecord returns false for tampered content's hash", async function () {
    const hash = sha256Hex("original content");
    await contract.submitRecord(hash, "https://example.test/post/4");

    const tamperedHash = sha256Hex("tampered content");
    expect(await contract.verifyRecord(0, tamperedHash)).to.equal(false);
  });

  it("reverts when fetching an out-of-range recordId", async function () {
    await expect(contract.getRecord(0)).to.be.revertedWith(
      "VerificationRegistry: invalid recordId"
    );
  });

  it("supports multiple independent records", async function () {
    const hashA = sha256Hex("post A");
    const hashB = sha256Hex("post B");
    await contract.submitRecord(hashA, "https://example.test/a");
    await contract.submitRecord(hashB, "https://example.test/b");

    expect(await contract.recordCount()).to.equal(2n);
    expect((await contract.getRecord(0))[0]).to.equal(hashA);
    expect((await contract.getRecord(1))[0]).to.equal(hashB);
  });
});
