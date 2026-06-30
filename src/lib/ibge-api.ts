const REGION_IDS: Record<string, number> = {
  Norte: 1,
  Nordeste: 2,
  Sudeste: 3,
  Sul: 4,
  "Centro-Oeste": 5,
}

export interface IBGEState {
  sigla: string
  nome: string
  regiao: { id: number; sigla: string; nome: string }
}

export interface IBGECity {
  id: number
  nome: string
}

export async function fetchStatesByRegion(
  regionName: string
): Promise<IBGEState[]> {
  const regionId = REGION_IDS[regionName]
  if (!regionId) return []
  const res = await fetch(
    `https://servicodados.ibge.gov.br/api/v1/localidades/regioes/${regionId}/estados`
  )
  if (!res.ok) throw new Error("Erro ao buscar estados")
  return res.json()
}

export async function fetchCitiesByState(uf: string): Promise<IBGECity[]> {
  const res = await fetch(
    `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`
  )
  if (!res.ok) throw new Error("Erro ao buscar municípios")
  return res.json()
}
