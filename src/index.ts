import { query } from "./utils";

export const isVerified = async (addr: string): Promise<boolean> => {
  const verificationTxs = (
    await query({
      query: `
				query transactions($nodes: [String!], $addr: String!) {
					transactions(
						owners: $nodes
						tags: [
							{ name: "App-Name", values: ["ArVerifyDev"] }
							{ name: "Type", values: ["Verification"] }
							{ name: "Address", values: [$addr] }
						]
					) {
						edges {
							node {
								id
								tags {
									name
									value
								}
							}
						}
					}
				}			
			`,
      variables: {
        nodes: ["s-hGrOFm1YysWGC3wXkNaFVpyrjdinVpRKiVnhbo2so"],
        addr,
      },
    })
  ).data.transactions.edges;

  return verificationTxs.length > 0;
};
