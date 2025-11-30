export async function getBsvBalance(address: string) {
  const res = await fetch(`https://api.whatsonchain.com/v1/bsv/main/address/${address}/balance`);
  const data = await res.json();
  return { confirmed: data.confirmed, unconfirmed: data.unconfirmed, total: data.confirmed + data.unconfirmed };
}

// Convert BSV to fiat
export async function convertBsvToFiat(bsvAmount: number) {
  const rate = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin-sv&vs_currencies=usd,eur,gbp")
    .then(r => r.json());
  return {
    USD: bsvAmount * rate["bitcoin-sv"].usd,
    EUR: bsvAmount * rate["bitcoin-sv"].eur,
    GBP: bsvAmount * rate["bitcoin-sv"].gbp
  };
}

// Get full token balances for multiple addresses
export async function getWalletTokenBalances(addresses: string[]) {
  const balances = await Promise.all(addresses.map(async (a) => {
    const bsv = await getBsvBalance(a);
    const fiat = await convertBsvToFiat(bsv.total / 1e8); // BSV decimal conversion
    return { address: a, ...bsv, ...fiat };
  }));
  return balances;
}
