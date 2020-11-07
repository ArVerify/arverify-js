import { query } from "./utils";
import txsQuery from "./queries/txs.gql";
import genesisQuery from "./queries/genesis.gql";

// https://primer.style/octicons/shield-check-16
import verifiedIcon from "./icons/verified.svg";
// https://primer.style/octicons/shield-x-16
import unverifiedIcon from "./icons/unverified.svg";

export const isVerified = async (addr: string): Promise<boolean> => {
  const verificationTxs = (
    await query({
      query: txsQuery,
      variables: {
        nodes: await getNodes(),
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

export const getNodes = async (): Promise<string[]> => {
  const genesisTxs = (
    await query({
      query: genesisQuery,
    })
  ).data.transactions.edges;

  const nodes: string[] = [];
  // @ts-ignore
  genesisTxs.map(({ node }) => {
    if (!nodes.find((addr) => addr === node.owner.address)) {
      nodes.push(node.owner.address);
    }
  });
  return nodes;
};
