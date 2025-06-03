export type Inventory = {
  id: string
  code: string
  sector: string
  responsible: string
  description: string
  details: string
  model: string
  serial_number: string
  invoice: string
  status: 'ativo' | 'inativo' | 'descartado'
  created_at: string
}

export type PurchaseOrder = {
  id: string
  title: string
  description: string
  requester: string
  status: 'aberta' | 'aguardando_aprovacao' | 'aprovada' | 'recusada' | 'concluida'
  created_at: string
}

export type Sector = {
  id: string
  name: string
  created_at: string
} 