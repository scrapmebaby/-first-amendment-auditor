export const MERCH = {
  merchPress: { label: 'PRESS|FOR VIEWS', color: '#536a77' },
  merchTax: { label: 'TAXPAYER|FUNDED', color: '#91704e' },
};
const SITES = [
  { x: 17, z: -11.75 },
  { x: -31, z: -15.75 },
  { x: -30, z: 33.75 },
  { x: 21, z: 34.75 },
  { x: 20, z: 77.75 },
  { x: -31, z: 79 },
  { x: 62, z: 35.75 },
  { x: 20, z: -58.75 },
  { x: -74, z: 78.75 },
];
// Seeded scattering is stable across reloads; every site faces a reachable sidewalk.
export function mirrorSites(seed = 1977) {
  let value = seed >>> 0;
  const random = () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
  const sites = SITES.map((p) => ({ ...p }));
  for (let i = sites.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [sites[i], sites[j]] = [sites[j], sites[i]];
  }
  return [{ x: 7, z: 4, yaw: 0 }, ...sites.slice(0, 5).map((p) => ({ ...p, yaw: 0 }))];
}
export function viewMovement(right, forward, yaw) {
  return {
    x: Math.sin(yaw) * forward - Math.cos(yaw) * right,
    z: Math.cos(yaw) * forward + Math.sin(yaw) * right,
  };
}
