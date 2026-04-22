export const ZILLOW_SOURCE = {
  name: 'Zillow Research',
  zoriUrl: 'https://files.zillowstatic.com/research/public_csvs/zori/Zip_zori_uc_sfrcondomfr_sm_sa_month.csv',
  zhviUrl: 'https://files.zillowstatic.com/research/public_csvs/zhvi/Zip_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv',
  retrievedDate: '2026-04-22',
  asOf: '2026-03-31',
  note: 'ZORI = Zillow Observed Rent Index (smoothed, seasonally adjusted). Not actual market rent.',
}

export interface ZillowZipData {
  zip: string
  city: string
  zpiRent: number | null
  zhvi: number | null
}

export const ZILLOW_DATA: Record<string, ZillowZipData> = {
  '84601': { zip: '84601', city: 'Provo', zpiRent: 1466, zhvi: 452170 },
  '84604': { zip: '84604', city: 'Provo', zpiRent: 1686, zhvi: null },
  '84606': { zip: '84606', city: 'Provo', zpiRent: null, zhvi: null },
}

export function getZillowForZip(
  zip: string
): { rent: number | null; homeValue: number | null; city: string } | null {
  const data = ZILLOW_DATA[zip]
  if (!data) return null
  return { rent: data.zpiRent, homeValue: data.zhvi, city: data.city }
}
