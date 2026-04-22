export const HUD_FMR_SOURCE = {
  name: 'HUD Fair Market Rents',
  url: 'https://www.huduser.gov/portal/datasets/fmr.html',
  fiscalYear: 2026,
  retrievedDate: '2026-04-22',
  note: 'FMR is the 40th percentile of gross rents (includes utilities) for standard-quality units.',
}

export interface FmrData {
  metro: string
  bedrooms: Record<number, number>
}

export const HUD_FMR_DATA: Record<string, FmrData> = {
  'Provo-Orem, UT': {
    metro: 'Provo-Orem, UT',
    bedrooms: {
      0: 1086,
      1: 1093,
      2: 1253,
      3: 1766,
      4: 2126,
    },
  },
}

export function getFmrForMetro(
  metro: string,
  bedroomCount: number = 2
): { rent: number; bedrooms: number; metro: string } | null {
  const data = HUD_FMR_DATA[metro]
  if (!data) return null
  const rent = data.bedrooms[bedroomCount]
  if (rent === undefined) return null
  return { rent, bedrooms: bedroomCount, metro }
}
