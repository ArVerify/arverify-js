import { query } from "./utils";
import txsQuery from "./queries/txs.gql";

// https://primer.style/octicons/shield-check-16
import verifiedIcon from "./icons/verified.svg";
// https://primer.style/octicons/shield-x-16
import unverifiedIcon from "./icons/unverified.svg";

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

export const icon = async (addr: string): Promise<string> => {
  const verified = await isVerified(addr);
  return verified ? verifiedIcon : unverifiedIcon;
};
