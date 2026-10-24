// fleet.mjs: node fleet.mjs [count]   (Ctrl-C to stop)
// Sends public GitHub repos through Open Patch's fleet check (one Mubit plan call each).
const LIMIT = Number(process.argv[2] ?? 500);
const APP = "http://localhost:3000/api/fleet/check";
const Q = [
  ["laravel docker","PHP","php"],["php docker apache","PHP","php"],["php docker nginx","PHP","php"],
  ["symfony docker","PHP","php"],["wordpress docker","PHP","php"],["php7.4","PHP","php"],
  ["codeigniter docker","PHP","php"],["php mysql docker-compose","PHP","php"],["yii2 docker","PHP","php"],
  ["lumen docker","PHP","php"],["cakephp docker","PHP","php"],["php api docker","PHP","php"],
  ["express docker","JavaScript","node"],["node docker","JavaScript","node"],
  ["flask docker","Python","python"],["django docker","Python","python"],
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const repos = new Map();
for (const [q, lang, eco] of Q) {
  const url = `https://api.github.com/search/repositories?per_page=100&q=${encodeURIComponent(`${q} language:${lang} size:<15000 fork:false`)}`;
  const res = await fetch(url, { headers: { "User-Agent": "open-patch-fleet" } });
  const json = await res.json();
  if (!res.ok) { console.log(`search "${q}": HTTP ${res.status} ${json.message ?? ""}`); await sleep(60000); continue; }
  for (const item of json.items ?? []) repos.set(item.full_name, eco);
  console.log(`search "${q}": ${json.items?.length ?? 0} (total ${repos.size})`);
  await sleep(6500);
}
const by = { php: [], node: [], python: [] };
for (const [name, eco] of repos) by[eco].push(name);
const shuffle = (a) => a.sort(() => Math.random() - 0.5);
const pick = (x) => (x < 0.7 ? "php-74-eol" : x < 0.85 ? "php-imagick-cve" : "php-cgi-windows");
const jobs = shuffle([
  ...shuffle(by.php).slice(0, 380).map((r) => [r, pick(Math.random())]),
  ...shuffle(by.node).slice(0, 60).map((r) => [r, "node-16-eol"]),
  ...shuffle(by.python).slice(0, 60).map((r) => [r, "python-38-eol"]),
]).slice(0, LIMIT);
console.log(`running ${jobs.length} fleet checks`);
let done = 0, ok = 0, failed = 0;
async function worker() {
  while (jobs.length) {
    const [repo, advisoryId] = jobs.shift();
    try {
      const res = await fetch(APP, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUrl: `https://github.com/${repo}`, advisoryId }) });
      const row = await res.json();
      if (res.ok) ok++; else failed++;
      console.log(`${++done}  ${repo}  ${advisoryId}  ${res.ok ? `${row.exposure} ${row.requestId} ${Math.round(row.latencyMs / 1000)}s` : `skip: ${row.error}`}`);
    } catch (e) { failed++; console.log(`${++done}  ${repo}  error: ${e.message}`); }
  }
}
await Promise.all([worker(), worker(), worker()]);
console.log(`finished: ${ok} sent to Mubit, ${failed} skipped`);
