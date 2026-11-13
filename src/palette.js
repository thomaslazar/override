// Tile colours (pure). The colour-blind set is Okabe-Ito, ordered so neighbouring slots differ in luminance.
export const PALETTES = {
  standard: ['#3dff8a', '#35c2d9', '#ff4fa3', '#f2c230', '#a77cf0', '#ff6a2b', '#e9f0ff'],
  colourblind: ['#56b4e9', '#f0e442', '#009e73', '#0072b2', '#cc79a7', '#e69f00', '#d55e00'],
};
export const paletteFor = name => PALETTES[Object.hasOwn(PALETTES, name) ? name : 'standard'];
