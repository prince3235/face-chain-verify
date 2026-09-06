export interface FaceEncoding {
  embedding: number[];
  faceBoundingBox: { x: number; y: number; width: number; height: number };
}

export interface MatchResult {
  found: boolean;
  postUrl?: string;
  postImageUrl?: string;
  sourcePlatform?: string;
  confidence?: number;
  postText?: string;
}

export interface ChainRecord {
  txHash: string;
  contractAddress: string;
  blockExplorerUrl: string;
  postHash: string;
  timestamp: string;
  network: string;
}

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_PIPELINE === "true";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function detectFace(file: File): Promise<FaceEncoding> {
  if (USE_MOCK) {
    await wait(1200);
    return {
      embedding: Array.from({ length: 8 }, () => Math.random()),
      faceBoundingBox: { x: 40, y: 30, width: 220, height: 220 },
    };
  }
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch("/api/detect-face", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Face detection failed");
  return res.json();
}

export async function searchMatch(encoding: FaceEncoding): Promise<MatchResult> {
  if (USE_MOCK) {
    await wait(1600);
    return {
      found: true,
      postUrl: "https://example-social.test/post/8841",
      postImageUrl: "",
      sourcePlatform: "Consented demo registry",
      confidence: 0.94,
      postText: "Team demo post used for the consented verification pipeline.",
    };
  }
  const res = await fetch("/api/search-match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(encoding),
  });
  if (!res.ok) throw new Error("Search step failed");
  return res.json();
}

export async function chainVerify(match: MatchResult): Promise<ChainRecord> {
  if (USE_MOCK) {
    await wait(1800);
    return {
      txHash: "0x" + Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join(""),
      contractAddress: "0x1234567890abcdef1234567890abcdef12345678",
      blockExplorerUrl: "https://amoy.polygonscan.com/tx/",
      postHash: "0x" + Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join(""),
      timestamp: new Date().toISOString(),
      network: "Polygon Amoy Testnet",
    };
  }
  const res = await fetch("/api/chain-verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(match),
  });
  if (!res.ok) throw new Error("Chain verification failed");
  return res.json();
}

export async function reVerify(record: ChainRecord): Promise<{ matches: boolean }> {
  if (USE_MOCK) {
    await wait(1000);
    return { matches: true };
  }
  const res = await fetch("/api/chain-verify", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error("Re-verification failed");
  return res.json();
}
