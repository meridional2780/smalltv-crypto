const SYMBOL = "ADA-USD";
const RANGE = "5d";
const INTERVAL = "15m";
const MAX_POINTS = 48;

const url =
  `https://query1.finance.yahoo.com/v8/finance/chart/${SYMBOL}` +
  `?range=${RANGE}&interval=${INTERVAL}`;

const response = await fetch(url, {
  headers: {
    "User-Agent": "Mozilla/5.0"
  }
});

if (!response.ok) {
  throw new Error(`Yahoo Finance respondeu HTTP ${response.status}`);
}

const data = await response.json();
const result = data?.chart?.result?.[0];

if (!result) {
  throw new Error("Resposta do Yahoo sem dados");
}

const meta = result.meta || {};
const closes = result.indicators?.quote?.[0]?.close || [];

const valid = closes.filter(
  value => typeof value === "number" && Number.isFinite(value)
);

if (!valid.length) {
  throw new Error("Yahoo não retornou preços válidos");
}

// Reduz o gráfico para no máximo 48 pontos
let spark = valid;

if (valid.length > MAX_POINTS) {
  spark = [];

  const step = (valid.length - 1) / (MAX_POINTS - 1);

  for (let i = 0; i < MAX_POINTS; i++) {
    spark.push(valid[Math.round(i * step)]);
  }
}

const price =
  typeof meta.regularMarketPrice === "number"
    ? meta.regularMarketPrice
    : valid[valid.length - 1];

const first = spark[0];
const change = price - first;
const changePct = first !== 0 ? (change / first) * 100 : 0;

const output = {
  symbol: SYMBOL,
  name: "Cardano",
  price,
  currency: "$",
  change,
  changePct,
  spark,
  range: "5D",
  ok: true
};

await import("node:fs/promises").then(fs =>
  fs.mkdir("out/quotes", { recursive: true })
);

await import("node:fs/promises").then(fs =>
  fs.writeFile(
    "out/quotes/ADA-USD.json",
    JSON.stringify(output),
    "utf8"
  )
);

console.log(output);
