export interface Company {
  [key: string]: any; // Assinatura de índice para permitir acesso dinâmico às propriedades
  
  id: string;
  code: string | null;
  business_name: string;
  fantasy_name: string | null;
  person_type: 'Fisica' | 'Juridica';
  cpf: string | null;
  cnpj: string | null;
  state_registration: string | null;
  phone: string | null;
  zip_code: string | null;
  address: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  status: boolean;
  additional_data: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string;
}

export interface CompanyFormData extends Omit<Company, 'id' | 'created_at'> {
  // All fields são opcionais no formulário
  code?: string | null;
  business_name: string;
  fantasy_name?: string | null;
  person_type: 'Fisica' | 'Juridica';
  cpf?: string | null;
  cnpj?: string | null;
  state_registration?: string | null;
  phone?: string | null;
  zip_code?: string | null;
  address?: string | null;
  number?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  status?: boolean;
  additional_data?: string | null;
}
