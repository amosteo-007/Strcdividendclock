// Fetches Strategy's latest USD Reserve / USD Cash from its SEC EDGAR 8-K filings and writes data.js.
//
// SEC's fair-access rules require every automated request to identify you. Set a contact in the
// environment before running (do not use someone else's):
//   SEC_USER_AGENT="STRC Dividend Clock you@example.com"  node fetch-sec.cjs
//
// Source sentence in the weekly 8-K (parsed below):
//   "As of October 4, 2026, the balances of the USD Reserve and USD Cash were $4.88 billion
//    and $833.4 million, respectively."
const fs = require('fs');
const path = require('path');

const CIK = '0001050446';
const OUT = path.join(__dirname, 'data.js');
const MONTHS = ['january','february','march','april','may','june','july','august','september','october','november','december'];

function toUsd(num, unit) {
  const n = parseFloat(num.replace(/,/g, ''));
  const u = unit.toLowerCase();
  return u === 'billion' ? n * 1e9 : u === 'million' ? n * 1e6 : u === 'thousand' ? n * 1e3 : NaN;
}

function parse(text) {
  const t = text.replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;| /g, ' ').replace(/&#8217;|&#x2019;/g, "'").replace(/\s+/g, ' ');
  const re = /As of ([A-Z][a-z]+) (\d{1,2}), (\d{4}),? the balances of the USD Reserve and USD Cash were \$([\d.,]+) (billion|million|thousand) and \$([\d.,]+) (billion|million|thousand), respectively/i;
  const m = t.match(re);
  if (!m) return null;
  const mi = MONTHS.indexOf(m[1].toLowerCase());
  if (mi < 0) return null;
  const iso = m[3] + '-' + String(mi + 1).padStart(2, '0') + '-' + String(m[2]).padStart(2, '0');
  const usdReserve = toUsd(m[4], m[5]), usdCash = toUsd(m[6], m[7]);
  // sanity bounds so a mis-parse never reaches the page
  if (!(usdReserve > 1e8 && usdReserve < 1e12) || !(usdCash >= 0 && usdCash < 1e12)) return null;
  return { usdReserve, usdCash, usdAsOfISO: iso, usdAsOf: m[2] + '-' + m[1].slice(0, 3) + '-' + m[3] };
}

async function get(url, ua) {
  const r = await fetch(url, { headers: { 'User-Agent': ua, 'Accept-Encoding': 'gzip, deflate' } });
  if (!r.ok) throw new Error(r.status + ' ' + url);
  return r;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const ua = process.env.SEC_USER_AGENT;
  if (!ua || !/@/.test(ua)) {
    console.error('Set SEC_USER_AGENT to something like "STRC Dividend Clock you@example.com" (SEC requires a contact).');
    process.exit(1);
  }
  const sub = await (await get('https://data.sec.gov/submissions/CIK' + CIK + '.json', ua)).json();
  const f = sub.filings.recent;
  const rows = f.form.map((form, i) => ({ form, acc: f.accessionNumber[i], doc: f.primaryDocument[i], date: f.filingDate[i] }))
    .filter((r) => r.form === '8-K').slice(0, 12);
  for (const r of rows) {
    const url = 'https://www.sec.gov/Archives/edgar/data/' + parseInt(CIK, 10) + '/' + r.acc.replace(/-/g, '') + '/' + r.doc;
    await sleep(300); // stay well under SEC's 10 requests/second
    let html;
    try { html = await (await get(url, ua)).text(); } catch (e) { console.error('skip', e.message); continue; }
    const d = parse(html);
    if (d) {
      d.sourceUrl = url; d.filed = r.date; d.fetchedAt = new Date().toISOString();
      fs.writeFileSync(OUT, '// Written by fetch-sec.cjs from SEC EDGAR. Do not edit by hand.\nwindow.STRC_DATA = ' + JSON.stringify(d, null, 2) + ';\n');
      console.log('Wrote data.js:', JSON.stringify(d));
      return;
    }
  }
  console.error('No 8-K among the latest ' + rows.length + ' contained the USD Reserve sentence. data.js unchanged.');
  process.exit(2);
}

module.exports = { parse };
if (require.main === module) main().catch((e) => { console.error(e.message); process.exit(1); });
