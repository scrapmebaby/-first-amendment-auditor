// Pixel budgets preserve aspect ratio, including portrait and ultrawide screens.
export function renderScale(width, height, dpr, quality, resolution, maxDimension = 8192) {
  if (!(width > 0 && height > 0)) return 1;
  const uhd = Math.min(3840 / Math.max(width, height), 2160 / Math.min(width, height));
  const requested =
    resolution === '4k'
      ? uhd
      : resolution === 'native'
        ? dpr
        : Math.min(dpr, quality === 'cinematic' ? 1.5 : 1);
  return Math.max(0.01, Math.min(requested, uhd, maxDimension / Math.max(width, height)));
}
