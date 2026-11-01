import assert from "node:assert/strict";
import { DEFAULT_PRICING_PAGES, reducePackagePrices, parsePricingConfig } from "../src/lib/pricing-config";

const expected = {
  packages: [
    { id: "essential", prices: [149, 179, 189] },
    { id: "complete", prices: [209, 239, 269] },
    { id: "signature", prices: [389, 439, 489] },
  ],
  exterior: [
    { id: "maintenance-wash", prices: [69, 79, 99] },
    { id: "full-exterior", prices: [139, 159, 189] },
    { id: "paint-enhancement", prices: [289, 339, 439] },
  ],
  interior: [
    { id: "interior-refresh", prices: [109, 119, 149] },
    { id: "full-interior", prices: [169, 189, 229] },
    { id: "deep-reset", prices: [239, 269, 319] },
  ],
} as const;

for (const kind of ["packages","exterior","interior"] as const) {
  const actual = DEFAULT_PRICING_PAGES[kind].packages;
  assert.equal(actual.length, expected[kind].length);
  for (let i=0; i<actual.length; i++) {
    assert.equal(actual[i].id, expected[kind][i].id);
    assert.deepEqual([actual[i].prices.coupe,actual[i].prices.sedan,actual[i].prices.truckSuv], expected[kind][i].prices);
  }
}

const saved = {
  ...DEFAULT_PRICING_PAGES.interior,
  packages: [{
    ...DEFAULT_PRICING_PAGES.interior.packages[0],
    name: "Owner customized", featured: true,
    prices: {coupe:169, sedan:199.95, truckSuv:299},
  }],
};
const reduced = reducePackagePrices(saved, 10);
assert.deepEqual(reduced.packages[0].prices, {coupe:159,sedan:189.95,truckSuv:289});
assert.equal(reduced.packages[0].name, "Owner customized");
assert.equal(reduced.packages[0].featured, true);
assert.deepEqual(saved.packages[0].prices,{coupe:169,sedan:199.95,truckSuv:299});

const legacy = {
  ...DEFAULT_PRICING_PAGES.packages,
  packages: DEFAULT_PRICING_PAGES.packages.packages.slice(0,2).map((pkg,i) => ({
    ...pkg,
    prices: i===0 ? {coupe:159,sedan:189,truckSuv:199}:{coupe:219,sedan:249,truckSuv:279},
  })),
};
const migrated = parsePricingConfig(JSON.stringify(legacy), DEFAULT_PRICING_PAGES.packages);
assert.equal(migrated, DEFAULT_PRICING_PAGES.packages);
console.log("All nine packages and 27 vehicle prices reflect the $10 cut; custom menu discounts and legacy migration verified.");
