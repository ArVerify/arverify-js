import { query } from "./utils";
import txsQuery from "./queries/txs.gql";
import Arweave from "arweave";
import { readContract } from "smartweave";
import genesisQuery from "./queries/genesis.gql";
import tipQuery from "./queries/tip.gql";
import { JWKInterface } from "arweave/node/lib/wallet";

// https://primer.style/octicons/shield-check-16
import verifiedIcon from "./icons/verified.svg";
// https://primer.style/octicons/shield-x-16
import unverifiedIcon from "./icons/unverified.svg";

// this value is in AR
export const FEE = 1;
// 0.9 -> 90%
export const COMMUNITY_PERCENT = 0.9;
export const COMMUNITY = "HWSbM2l-1gsBzCQMjzoP6G4aKafJvDeHyLs5YdTDxm0";

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

export const getStake = async (addr: string): Promise<number> => {
  const client = new Arweave({
    host: "arweave.net",
    port: 443,
    protocol: "https",
  });

  const state = await readContract(client, COMMUNITY);

  if (addr in state.vault) {
    // @ts-ignore
    return state.vault[addr].map((a) => a.balance).reduce((a, b) => a + b, 0);
  }
  return 0;
};

export const getNodes = async (): Promise<string[]> => {
  const genesisTxs = (
    await query({
      query: genesisQuery,
    })
  ).data.transactions.edges;

  const nodes: string[] = [];
  for (const tx of genesisTxs) {
    if (!nodes.find((addr) => addr === tx.node.owner.address)) {
      if ((await getStake(tx.node.owner.address)) > 0) {
        nodes.push(tx.node.owner.address);
      }
    }
  }

  return nodes;
};

export const tipReceived = async (
  addr: string,
  node: string
): Promise<boolean> => {
  if (!(node in (await getNodes()))) return false;

  const txs = (
    await query({
      query: tipQuery,
      variables: {
        owner: addr,
        recipient: node,
      },
    })
  ).data.transactions.edges;

  if (txs.length === 1) {
    return (
      parseFloat(txs[0].node.quantity.ar) === FEE * (1 - COMMUNITY_PERCENT)
    );
  }

  return false;
};

export const sendGenesis = async (
  jwk: JWKInterface,
  endpoint: string
): Promise<string> => {
  const client = new Arweave({
    host: "arweave.net",
    port: 443,
    protocol: "https",
  });

  const stake = await getStake(await client.wallets.jwkToAddress(jwk));

  if (stake > 0) {
    const tags = {
      "App-Name": "ArVerifyDev",
      Type: "Genesis",
      Endpoint: endpoint,
    };

    const tx = await client.createTransaction(
      {
        data: Math.random().toString().slice(-4),
      },
      jwk
    );

    for (const [key, value] of Object.entries(tags)) {
      tx.addTag(key, value);
    }

    await client.transactions.sign(tx, jwk);
    await client.transactions.post(tx);

    return tx.id;
  }

  return "stake";
};

const weightedRandom = (dict: Record<string, number>): string | undefined => {
  let sum = 0;
  const r = Math.random();

  for (const addr of Object.keys(dict)) {
    sum += dict[addr];
    if (r <= sum && dict[addr] > 0) {
      return addr;
    }
  }

  return;
};

export const recommendNode = async (): Promise<string> => {
  const stakes: Record<string, number> = {};
  let total = 0;

  for (const node of await getNodes()) {
    const stake = await getStake(node);

    stakes[node] = stake;
    total += stake;
  }

  for (const node of Object.keys(stakes)) {
    stakes[node] = stakes[node] / total;
  }

  return weightedRandom(stakes) || "";
};

export const sendTip = async (
  node: string,
  jwk: JWKInterface
): Promise<string> => {
  const client = new Arweave({
    host: "arweave.net",
    port: 443,
    protocol: "https",
  });

  const tx = await client.createTransaction(
    {
      target: node,
      quantity: client.ar.arToWinston(
        (FEE * (1 - COMMUNITY_PERCENT)).toString()
      ),
    },
    jwk
  );

  await client.transactions.sign(tx, jwk);
  await client.transactions.post(tx);

  return tx.id;
};

export const verify = async (jwk: JWKInterface): Promise<string> => {
  const client = new Arweave({
    host: "arweave.net",
    port: 443,
    protocol: "https",
  });

  const node = await recommendNode();
  const txID = await sendTip(node, jwk);

  const genesisTx = (
    await query({
      query: `
      query {
        transactions(
          owners: ["${node}"]
          tags: [
            { name: "App-Name", values: ["ArVerifyDev"] }
            { name: "Type", values: ["Genesis"] }
          ]
          first: 1
        ) {
          edges {
            node {
              tags {
                name
                value
              }
            }
          }
        }
      }    
    `,
    })
  ).data.transactions.edges[0];

  const endpoint = genesisTx.node.tags.find(
    (tag: { name: string; value: string }) => tag.name === "Endpoint"
  ).value;
  const res = await fetch(
    `${endpoint}/verify?address=${await client.wallets.jwkToAddress(jwk)}`
  );
  return (await res.clone().json()).uri;
};
