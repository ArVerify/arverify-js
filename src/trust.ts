import axios from "axios";

interface ScoreResponse {
  address: string;
  percentage: number;
  score: number;
  status: string;
  updated_at: string;
}

export const getScore = async (address: string): Promise<ScoreResponse> => {
  const { data } = await axios.get(`https://api.arverify.org/score/${address}`);

  return data;
};
