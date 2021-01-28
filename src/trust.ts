import fetch from "node-fetch";

interface ScoreResponse {
  address: string
  percentage: number
  score: number
  status: string
  updated_at: string
}

export const getScore = async (address: string): Promise<ScoreResponse> => {
  const raw = await fetch(`https://api.arverify.org/score/${address}`);

  return raw.clone().json();
};