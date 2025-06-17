// Arquivo: src/types/Employee.ts

// Interface alinhada com a tabela 'employees' do Supabase
export interface Employee {
  id: string;
  nome_completo: string;
  email: string;
  cpf: string;
  data_nascimento: string | null;
  data_admissao: string | null;
  data_desligamento: string | null;
  cargo: string | null;
  departamento: string | null;
  setor: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  telefone: string | null;
  salario_inicial: number;
  salario_atual: number;
  status: string;
  itens_vinculados?: any[];
  empresa_id: string | null;
  company_id: string | null;
  created_at: string;
  updated_at: string;
  data_cadastro: string;
  data_atualizacao: string;
}

// Interface para o formulário de criação/edição de funcionário
export interface EmployeeFormData {
  nome_completo: string;
  cpf: string;
  email: string;
  data_nascimento: string | null;
  data_admissao: string | null;
  data_desligamento: string | null;
  cargo: string | null;
  departamento: string | null;
  setor: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  telefone: string | null;
  salario_inicial: number | null;
  salario_atual: number | null;
  status: string;
  empresa_id: string | null;
  company_id: string | null;
  itens_vinculados?: any[] | null;
}

// Interface para o histórico de salários, alinhada com a tabela 'salary_history'
export interface SalaryHistory {
  id: string;
  employee_id: string;
  valor_anterior: number;
  valor_novo: number;
  data_alteracao: string; // TIMESTAMPTZ vira string
  motivo: string;
  usuario_alteracao: string; // ID do usuário que fez a alteração
  created_at: string;
  updated_at: string;
} 