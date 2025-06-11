export interface Employee {
  id: string;
  nome: string;
  cpf: string;
  cargo: string;
  setor: string;
  email: string;
  telefone?: string;
  status: 'ativo' | 'inativo';
  itensVinculados?: string[]; // IDs dos itens vinculados (Tornado opcional)
  dataCadastro: Date;
  dataAtualizacao: Date;
  salario: number; // Salário atual
  dataAdmissao: string | null; // Novo campo para Data de Admissão
  dataDesligamento: string | null; // Novo campo para Data de Desligamento
  company_id?: string; // ID da empresa à qual o funcionário está vinculado
}

export interface EmployeeFormData extends Omit<Employee, 'id' | 'dataCadastro' | 'dataAtualizacao' | 'salario' | 'dataAdmissao' | 'dataDesligamento' | 'telefone' | 'itensVinculados' | 'company_id'> {
  telefone?: string | undefined;
  itensVinculados?: string[] | undefined;
  salario?: number | undefined;
  dataAdmissao?: string | null | undefined;
  dataDesligamento?: string | null | undefined;
  company_id?: string | undefined;
}

export interface SalaryHistory {
  id: string;
  employee_id: string;
  valor_anterior: number;
  valor_novo: number;
  data_alteracao: Date;
  motivo: string;
  usuario_alteracao: string; // ID do usuário que fez a alteração
} 