import { all, fetchTxTag, run } from "ar-gql";
import txsQuery from "./queries/txs.gql";
import Arweave from "arweave";
import { readContract } from "smartweave";
import genesisQuery from "./queries/genesis.gql";
import tipQuery from "./queries/tip.gql";
import { JWKInterface } from "arweave/node/lib/wallet";
import axios from "axios";

// https://primer.style/octicons/shield-check-16
import verifiedIcon from "./icons/verified.svg";
// https://primer.style/octicons/shield-x-16
import unverifiedIcon from "./icons/unverified.svg";
import { getScore } from "./trust";

// export functions from trust
export * from "./trust";

// this value is in USD
export const FEE = 10;
// 0.4 -> 40%
export const COMMUNITY_PERCENT = 0.4;
export const COMMUNITY = "f6lW-sKxsc340p8eBBL2i_fnmSI_fRSFmkqvzqyUsRs";

export enum Threshold {
  LOW = 0.3,
  MEDIUM = 0.6,
  HIGH = 0.8,
  ULTRA = 1,
}

export const getVerification = async (
  addr: string,
  threshold: number = Threshold.MEDIUM
): Promise<{
  verified: boolean;
  txID?: string;
  icon: string;
  percentage: number;
}> => {
  const verificationTxs = (
    await run(txsQuery, {
      nodes: await getNodes(),
      addr,
    })
  ).data.transactions.edges;

  const percentage = (await getScore(addr)).percentage;

  const verified = percentage >= threshold * 100;

  return {
    verified,
    txID: verificationTxs.length > 0 ? verificationTxs[0].node.id : undefined,
    icon: verified ? verifiedIcon : unverifiedIcon,
    percentage,
  };
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
  const genesisTxs = await all(genesisQuery);

  const nodes: string[] = [];
  for (const tx of genesisTxs) {
    if (!nodes.find((addr) => addr === tx.node.owner.address)) {
      if ((await getStake(tx.node.owner.address)) > 0) {
        nodes.push(tx.node.owner.address);
      }
    }
  }

  if (!nodes.length) throw Error("No nodes online");

  return nodes;
};

export const getFee = async (): Promise<number> => {
  const { data } = await axios.get(
    "https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=usd"
  );
  const price = 1 / data.arweave.usd;

  const client = new Arweave({
    host: "arweave.net",
    port: 443,
    protocol: "https",
  });

  const contract = await readContract(client, COMMUNITY);

  const fee = contract.settings.find(
    (setting: (string | number)[]) =>
      setting[0].toString().toLowerCase() === "fee"
  );

  return price * (fee ? fee[1] : FEE);
};

export const tipReceived = async (
  addr: string,
  node: string
): Promise<boolean> => {
  const nodes = await getNodes();
  if (!nodes.includes(node)) return false;

  const txs = (
    await run(tipQuery, {
      owner: addr,
      recipient: node,
    })
  ).data.transactions.edges;

  const client = new Arweave({
    host: "arweave.net",
    port: 443,
    protocol: "https",
  });

  if (txs.length === 1) {
    const amnt = parseFloat(txs[0].node.quantity.winston);
    const fee = parseFloat(
      client.ar.arToWinston(
        ((await getFee()) * (1 - COMMUNITY_PERCENT)).toString()
      )
    );

    return amnt >= 0.95 * fee && amnt <= 1.05 * fee;
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
    const possibleGenesis = (
      await run(`
        query {
          transactions(
            owners: ["${await client.wallets.jwkToAddress(jwk)}"]
            tags: [
              { name: "Application", values: ["ArVerify"] }
              { name: "Type", values: ["Genesis"] }
            ]
            first: 1
          ) {
            edges {
              node {
                id
              }
            }
          }
        }      
      `)
    ).data.transactions.edges;

    if (possibleGenesis.length === 1) {
      const previousEndpoint = await fetchTxTag(
        possibleGenesis[0].node.id,
        "Endpoint"
      );

      if (previousEndpoint === endpoint) {
        return possibleGenesis[0].node.id;
      }
    }

    const tags = {
      Application: "ArVerify",
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

  const tags = {
    Application: "ArVerify",
    Type: "FEE_NODE",
  };

  const tx = await client.createTransaction(
    {
      target: node,
      quantity: client.ar.arToWinston(
        ((await getFee()) * (1 - COMMUNITY_PERCENT)).toString()
      ),
    },
    jwk
  );

  for (const [key, value] of Object.entries(tags)) {
    tx.addTag(key, value);
  }

  await client.transactions.sign(tx, jwk);
  await client.transactions.post(tx);

  return tx.id;
};

export const selectTokenHolder = async (): Promise<string> => {
  const client = new Arweave({
    host: "arweave.net",
    port: 443,
    protocol: "https",
  });

  const state = await readContract(client, COMMUNITY);
  const balances = state.balances;
  const vault = state.vault;

  let total = 0;
  for (const addr of Object.keys(balances)) {
    total += balances[addr];
  }

  for (const addr of Object.keys(vault)) {
    if (!vault[addr].length) continue;

    const vaultBalance = vault[addr]
      .map((a: { balance: number; start: number; end: number }) => a.balance)
      .reduce((a: number, b: number) => a + b, 0);

    total += vaultBalance;

    if (addr in balances) {
      balances[addr] += vaultBalance;
    } else {
      balances[addr] = vaultBalance;
    }
  }

  const weighted: { [addr: string]: number } = {};
  for (const addr of Object.keys(balances)) {
    weighted[addr] = balances[addr] / total;
  }

  return weightedRandom(weighted)!;
};

export const sendCommunityTip = async (jwk: JWKInterface): Promise<string> => {
  const client = new Arweave({
    host: "arweave.net",
    port: 443,
    protocol: "https",
  });

  const tags = {
    Application: "ArVerify",
    Type: "FEE_COMMUNITY",
  };

  const tx = await client.createTransaction(
    {
      target: await selectTokenHolder(),
      quantity: client.ar.arToWinston(
        ((await getFee()) * COMMUNITY_PERCENT).toString()
      ),
    },
    jwk
  );

  for (const [key, value] of Object.entries(tags)) {
    tx.addTag(key, value);
  }

  await client.transactions.sign(tx, jwk);
  await client.transactions.post(tx);

  return tx.id;
};

export const verify = async (
  jwk: JWKInterface,
  returnUri?: string,
  referral?: string
): Promise<string> => {
  const client = new Arweave({
    host: "arweave.net",
    port: 443,
    protocol: "https",
  });

  const node = await recommendNode();

  const genesisTx = (
    await run(`
      query {
        transactions(
          owners: ["${node}"]
          tags: [
            { name: "Application", values: ["ArVerify"] }
            { name: "Type", values: ["Genesis"] }
          ]
          first: 1
        ) {
          edges {
            node {
              id
            }
          }
        }
      }    
    `)
  ).data.transactions.edges[0];

  const endpoint = (await fetchTxTag(genesisTx.node.id, "Endpoint"))!;

  try {
    await axios.get(`${endpoint}${endpoint.endsWith("/") ? "" : "/"}ping`);
  } catch {
    return "offline";
  }

  const address = await client.wallets.jwkToAddress(jwk);
  const tipped = await tipReceived(address, node);

  if (!tipped) {
    await sendTip(node, jwk);
    await sendCommunityTip(jwk);
  }

  const queryParams = `address=${address}&return=${returnUri || ""}&referral=${
    referral || ""
  }`;

  const { data } = await axios.get(
    `${endpoint}${endpoint.endsWith("/") ? "" : "/"}verify?` + queryParams
  );
  return data.uri;
};
