import { query } from "./utils";
import txsQuery from "./queries/txs.gql";

export const isVerified = async (addr: string): Promise<boolean> => {
  const verificationTxs = (
    await query({
      query: txsQuery,
      variables: {
        nodes: ["s-hGrOFm1YysWGC3wXkNaFVpyrjdinVpRKiVnhbo2so"],
        addr,
      },
    })
  ).data.transactions.edges;

  return verificationTxs.length > 0;
};
