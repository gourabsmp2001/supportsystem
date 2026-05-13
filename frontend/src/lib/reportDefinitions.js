export const bottleSizes = [
  { key: '750ml', label: '750 ml', db: 'qty_750ml', stockDb: 'stock_750ml', mrpDb: 'mrp_750ml', divisor: 12 },
  { key: '500ml', label: '500 ml', db: 'qty_500ml', stockDb: 'stock_500ml', mrpDb: 'mrp_500ml', divisor: 24 },
  { key: '375ml', label: '375 ml', db: 'qty_375ml', stockDb: 'stock_375ml', mrpDb: 'mrp_375ml', divisor: 24 },
  { key: '180ml', label: '180 ml', db: 'qty_180ml', stockDb: 'stock_180ml', mrpDb: 'mrp_180ml', divisor: 48 },
  { key: '90ml', label: '90 ml', db: 'qty_90ml', stockDb: 'stock_90ml', mrpDb: 'mrp_90ml', divisor: 96 }
];

export const sizeKeys = bottleSizes.map((size) => size.key);

export const availabilityCodes = [
  'OMR',
  'OMGR',
  'OMWPR',
  'LEMON',
  'MANGO CHILI',
  'COFFEE',
  'AMBER',
  'SPICE',
  'FIRE',
  'LEG',
  'SUP',
  'TCB',
  'RRW',
  'SBW',
  'GOAK',
  'NLB',
  'VOV',
  'BBG',
  'KRAV',
  'KRV',
  'KRL',
  'KRVO',
  'TSG',
  'JMG',
  'IQG',
  'IQC',
  'JCM'
];

export const availabilityStatuses = ['Y', 'N', 'Available', 'Not Available', 'Low Stock', 'Not Asked'];

export const ssReportBrands = [
  { code: 'OMR XXX', name: 'OLD MONK XXX', category: 'RUM', sizes: ['750ml', '500ml', '375ml', '180ml'] },
  { code: 'CELEBRATION', name: 'CELEBRATION', category: 'RUM', sizes: ['750ml', '500ml', '375ml', '180ml'] },
  { code: 'OMGR', name: 'OLD MONK GOLD RESERVE', category: 'RUM', sizes: ['750ml', '500ml', '375ml', '180ml'] },
  { code: 'VOV', name: 'VERY OLD VATTED OLD MONK', category: 'RUM', sizes: ['750ml', '375ml', '180ml'] },
  { code: 'LEG', name: 'LEGEND', category: 'RUM', sizes: ['750ml', '180ml'] },
  { code: 'SUP', name: 'SUPREME', category: 'RUM', sizes: ['750ml'] },
  { code: 'COFFEE', name: 'OLD MONK COFFEE XO', category: 'RUM', sizes: ['750ml', '375ml', '180ml', '90ml'] },
  { code: 'AMBER', name: 'OLD MONK AMBER XO', category: 'RUM', sizes: ['750ml', '375ml', '180ml'] },
  { code: 'SPICE', name: 'OLD MONK SPICED XO', category: 'RUM', sizes: ['750ml', '375ml', '180ml'], exportCode: 'SPICED' },
  { code: 'FIRE', name: 'OLD MONK FIRE XO', category: 'RUM', sizes: ['750ml', '375ml', '180ml'] },
  { code: 'WHITE', name: 'OLD MONK WHITE', category: 'RUM', sizes: ['750ml', '375ml', '180ml'] },
  { code: 'MANGO CHILI', name: 'OM MANGO CHILLI', category: 'RUM', sizes: ['750ml', '375ml', '180ml'] },
  { code: 'LEMON', name: 'OLD MONK LEMON', category: 'RUM', sizes: ['750ml', '375ml', '180ml'] },
  { code: 'BAC BLK', name: 'BACARDI BLACK', category: 'RUM', sizes: ['750ml', '375ml', '180ml'] },
  { code: 'GOAK', name: 'GOLDEN OAK', category: 'WHISKEY', sizes: ['750ml', '375ml', '180ml'] },
  { code: 'RRW', name: 'RIPS ROYAL', category: 'WHISKEY', sizes: ['750ml', '375ml', '180ml'] },
  { code: 'SBW', name: 'SBW', category: 'WHISKEY', sizes: ['750ml', '375ml', '180ml'] },
  { code: 'OCW', name: 'OCW', category: 'WHISKEY', sizes: ['750ml', '500ml', '375ml', '180ml'] },
  { code: 'TCB', name: 'TCB', category: 'BRANDY', sizes: ['750ml', '375ml', '180ml'] },
  { code: 'NLB', name: 'NAUTILUS', category: 'BRANDY', sizes: ['750ml', '180ml'] },
  { code: 'KRV', name: 'KNIGHT RIDERS VODKA ULTRA PREMIUM', category: 'VODKA', sizes: ['750ml', '375ml', '180ml'] },
  { code: 'KRAV', name: 'KRV APPLE', category: 'VODKA', sizes: ['750ml', '375ml', '180ml'] },
  { code: 'KRVO', name: 'KRV ORANGE', category: 'VODKA', sizes: ['750ml', '375ml', '180ml'] },
  { code: 'KRL', name: 'KRV LEMON', category: 'VODKA', sizes: ['750ml', '375ml', '180ml'] },
  { code: 'MMV', name: 'MMV', category: 'VODKA', sizes: ['750ml', '375ml', '180ml'] },
  { code: 'MMV FLV', name: 'MMV FLV', category: 'VODKA', sizes: ['750ml', '375ml', '180ml'] },
  { code: 'BBG', name: 'BIG BIN GIN', category: 'GIN', sizes: ['750ml', '375ml', '180ml'] }
];

export const ssMarketShareCodes = ['OMR', 'MCR', 'OMGR', 'Bac. BLK', 'VOV', 'XO', 'OMchili', 'MISL'];

export const spotPromotionGroups = [
  {
    category: 'IMPORT',
    brands: [
      { code: 'TSG', name: 'THE SOLAN GOLD', sizes: ['750ml'] },
      { code: 'JMG', name: 'JAMUN', sizes: ['750ml'] },
      { code: 'IQG', name: 'IQ', sizes: ['750ml'] },
      { code: 'IQC', name: 'IQ CUCUMBER', sizes: ['750ml'] }
    ]
  },
  {
    category: 'WHISKEY',
    brands: [
      { code: 'G.OAK', name: 'GOLDEN OAK', sizes: ['750ml', '375ml', '180ml'] },
      { code: 'RRW', name: 'RIPS ROYAL', sizes: ['750ml', '375ml', '180ml'] }
    ]
  },
  {
    category: 'RUM',
    brands: [
      { code: 'OMGR', name: 'OLD MONK GOLD RESERVE', sizes: ['750ml', '500ml', '375ml', '180ml'] },
      { code: 'LEG', name: 'LEGEND', sizes: ['750ml', '180ml'] },
      { code: 'SUP', name: 'SUPREME', sizes: ['750ml'] },
      { code: 'FLV', name: 'OLD MONK FLAVOUR', sizes: ['750ml'] },
      { code: 'COFFEE', name: 'OLD MONK COFFEE', sizes: ['750ml', '375ml', '180ml', '90ml'] },
      { code: 'AMBER', name: 'OLD MONK AMBER', sizes: ['750ml', '375ml', '180ml'] },
      { code: 'SPICED', name: 'OLD MONK SPICED', sizes: ['750ml', '375ml', '180ml'] },
      { code: 'MANGO CHILI', name: 'OM MANGO CHILLI', sizes: ['750ml', '375ml', '180ml'] },
      { code: 'FIRE', name: 'OLD MONK FIRE', sizes: ['750ml', '375ml', '180ml'] },
      { code: 'OMWPR', name: 'OLD MONK WHITE', sizes: ['750ml', '375ml', '180ml'] },
      { code: 'CITRUS', name: 'OLD MONK CITRUS', sizes: ['750ml', '375ml', '180ml'] }
    ]
  },
  {
    category: 'VODKA',
    brands: [
      { code: 'KRV', name: 'KNIGHT RIDERS VODKA', sizes: ['750ml', '375ml', '180ml'] },
      { code: 'KRVFLV', name: 'KRV FLAVOUR', sizes: ['750ml', '375ml', '180ml'] }
    ]
  },
  {
    category: 'BRANDY',
    brands: [{ code: 'NTB/BBG', name: 'NTB / BIG BIN GIN', sizes: ['750ml', '180ml'] }]
  }
];

export function emptySizeValues() {
  return Object.fromEntries(sizeKeys.map((size) => [size, 0]));
}

export function sumBottles(sizeValues = {}) {
  return Number(sizeKeys.reduce((total, size) => total + Number(sizeValues[size] || 0), 0).toFixed(2));
}

export function sumCases(sizeValues = {}) {
  return Number(
    bottleSizes
      .reduce((total, size) => total + Number(sizeValues[size.key] || 0) / size.divisor, 0)
      .toFixed(2)
  );
}

export function flattenSpotBrands() {
  return spotPromotionGroups.flatMap((group) =>
    group.brands.map((brand) => ({ ...brand, category: group.category }))
  );
}
