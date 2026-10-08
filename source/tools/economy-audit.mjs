// Deterministic balance report: 1,000 ordinary 45-second takes, six engagement points.
import { fresh, finishClip, estimate } from '../dist/core.js';
import { discoveryRisk } from '../dist/campaign.js';
for (const cut of [false, true]) {
  const tiers = {},
    incomes = [];
  let losses = 0;
  for (let i = 0; i < 1000; i++) {
    const s = fresh(),
      c = finishClip(
        s,
        { seconds: 45, drama: 6, music: false, touched: false, place: 'CITY HALL', person: 'Pat' },
        (i + 0.5) / 1000,
      );
    c.id = i + 1;
    const e = estimate(s, c, cut);
    incomes.push(e.income);
    if (e.net < 0) losses++;
    const t = (tiers[e.tier] ??= { count: 0, gross: 0, net: 0, risk: 0 });
    t.count++;
    t.gross += e.income;
    t.net += e.net;
    t.risk += discoveryRisk(s, e);
  }
  incomes.sort((a, b) => a - b);
  console.log(
    JSON.stringify(
      {
        cut,
        median: incomes[500],
        p90: incomes[900],
        p99: incomes[990],
        losingUploads: losses,
        tiers: Object.fromEntries(
          Object.entries(tiers).map(([key, v]) => [
            key,
            {
              share: v.count / 10,
              meanGross: +(v.gross / v.count).toFixed(2),
              meanNet: +(v.net / v.count).toFixed(2),
              meanDiscoveryPercent: +((v.risk / v.count) * 100).toFixed(1),
            },
          ]),
        ),
      },
      null,
      2,
    ),
  );
}
