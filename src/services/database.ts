import { supabase } from '../lib/supabase';
import { Employee, EmployeeFormData, SalaryHistory } from '../types/Employee';
import { Company } from '../types/Company';

// NOTA: As interfaces para Employee, SalaryHistory e Company não foram fornecidas.
// Certifique-se de que elas estão definidas corretamente em seus respectivos arquivos de tipo.

// Interface para Item
export interface Item {
  id: string;
  codigo: string;
  item: string;
  modelo: string | null;
  numero_serie: string | null;
  detalhes: string | null;
  nota_fiscal: string | null;
  supplier_id: string | null;
  setor: string | null;
  responsavel: string | null;
  status: string;
  valor_aproximado: number | null;
  motivo_descarte?: string | null;
  created_at: string;
  updated_at: string;
  suppliers?: Supplier;
}

// Interface para Ordem de Compra
export interface PurchaseOrder {
  id: string;
  user_id: string;
  solicitante: string;
  descricao: string;
  supplier_id: string | null;
  valor: number | null;
  data_solicitacao: string;
  data_aprovacao: string | null;
  status: 'Aguardando aprovação' | 'Aguardando Orçamento' | 'Orçamento Aprovado' | 'Compra Realizada' | 'Recusada';
  motivo_recusa?: string | null;
  created_at: string;
  updated_at: string;
  suppliers?: Supplier;
}

// Interface para Fornecedor
export interface Supplier {
  id: string;
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  telefone?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  created_at: string;
  updated_at: string;
}

// Interface principal do Serviço de Banco de Dados
export interface DatabaseService {
  items: {
    getAll: () => Promise<Item[]>;
    getById: (id: string) => Promise<Item | null>;
    create: (data: Omit<Item, 'id' | 'created_at' | 'updated_at' | 'suppliers'>) => Promise<Item>;
    update: (id: string, data: Partial<Omit<Item, 'id' | 'created_at' | 'updated_at' | 'suppliers'>>) => Promise<Item>;
    delete: (id: string) => Promise<void>;
    getNextCode: () => Promise<string>;
    isCodeUnique: (codigo: string) => Promise<boolean>;
  };
  purchaseOrders: {
    create: (order: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at' | 'status' | 'user_id' | 'suppliers'>) => Promise<PurchaseOrder>;
    getAll: () => Promise<PurchaseOrder[]>;
    update: (id: string, order: Partial<Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at' | 'suppliers'>>) => Promise<PurchaseOrder>;
    approveOrder: (orderId: string) => Promise<PurchaseOrder>;
    approveBudget: (orderId: string) => Promise<PurchaseOrder>;
    realizePurchase: (orderId: string) => Promise<PurchaseOrder>;
    rejectOrder: (orderId: string, motivo: string) => Promise<PurchaseOrder>;
  };
  suppliers: {
    getAll: () => Promise<Supplier[]>;
    getById: (id: string) => Promise<Supplier | null>;
    create: (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => Promise<Supplier>;
    update: (id: string, supplier: Partial<Omit<Supplier, 'id' | 'created_at' | 'updated_at'>>) => Promise<Supplier>;
    delete: (id: string) => Promise<void>;
  };
  employees: {
    getAll: () => Promise<Employee[]>;
    getById: (id: string) => Promise<Employee | null>;
    create: (data: EmployeeFormData) => Promise<Employee>;
    update: (id: string, data: Partial<EmployeeFormData>) => Promise<Employee>;
    delete: (id: string) => Promise<void>;
  };
  salaryHistory: {
    getByEmployeeId: (employeeId: string) => Promise<SalaryHistory[]>;
    create: (data: Omit<SalaryHistory, 'id' | 'created_at' | 'updated_at'>) => Promise<SalaryHistory>;
    delete: (id: string) => Promise<void>;
  };
  users: {
    getUsersByIds: (ids: string[]) => Promise<{ [id: string]: string }>;
  };
  companies: {
    getAll: () => Promise<Company[]>;
    getById: (id: string) => Promise<Company | null>;
    create: (data: Omit<Company, 'id' | 'created_at' | 'status'>) => Promise<Company>;
    update: (id: string, data: Partial<Omit<Company, 'id' | 'created_at'>>) => Promise<Company>;
    delete: (id: string) => Promise<void>;
    getNextCode: () => Promise<string>;
  };
}

// Implementação do Serviço de Banco de Dados
export const databaseService: DatabaseService = {
  items: {
    getAll: async () => {
      const { data, error } = await supabase.from('items').select('*, suppliers(*)').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Item[];
    },
    getById: async (id) => {
      const { data, error } = await supabase.from('items').select('*, suppliers(*)').eq('id', id).single();
      if (error) {
        if (error.code === 'PGRST116') return null; // Retorna nulo se não encontrar
        throw error;
      }
      return data as Item;
    },
    create: async (item) => {
      const { data, error } = await supabase.from('items').insert(item).select().single();
      if (error) throw error;
      return data as Item;
    },
    update: async (id, item) => {
      const { data, error } = await supabase.from('items').update(item).eq('id', id).select().single();
      if (error) throw error;
      return data as Item;
    },
    delete: async (id) => {
      const { error } = await supabase.from('items').delete().eq('id', id);
      if (error) throw error;
    },
    getNextCode: async () => {
      const { data, error } = await supabase.from('items').select('codigo').order('codigo', { ascending: false }).limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return '000001'; // Primeiro código
      const nextNumber = parseInt(data.codigo, 10) + 1;
      return nextNumber.toString().padStart(6, '0');
    },
    isCodeUnique: async (codigo) => {
      const { data, error } = await supabase.from('items').select('codigo').eq('codigo', codigo).maybeSingle();
      if (error) throw error;
      return !data; // Retorna true se o código não existir
    },
  },

  purchaseOrders: {
    create: async (order) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      const orderPayload = {
        ...order,
        user_id: user.id,
        status: 'Aguardando aprovação' as const, // Status inicial
      };

      const { data, error } = await supabase.from('purchase_orders').insert(orderPayload).select().single();
      if (error) throw error;
      return data as PurchaseOrder;
    },
    getAll: async () => {
      const { data, error } = await supabase.from('purchase_orders').select('*, suppliers(*)').order('created_at', { ascending: false });
      if (error) throw error;
      return data as PurchaseOrder[];
    },
    update: async (id, order) => {
      const { data, error } = await supabase.from('purchase_orders').update(order).eq('id', id).select().single();
      if (error) throw error;
      return data as PurchaseOrder;
    },
    approveOrder: async (orderId) => {
      const { data, error } = await supabase.from('purchase_orders').update({ status: 'Aguardando Orçamento', data_aprovacao: new Date().toISOString() }).eq('id', orderId).select().single();
      if (error) throw error;
      return data as PurchaseOrder;
    },
    approveBudget: async (orderId) => {
      const { data, error } = await supabase.from('purchase_orders').update({ status: 'Orçamento Aprovado' }).eq('id', orderId).select().single();
      if (error) throw error;
      return data as PurchaseOrder;
    },
    realizePurchase: async (orderId) => {
      const { data, error } = await supabase.from('purchase_orders').update({ status: 'Compra Realizada' }).eq('id', orderId).select().single();
      if (error) throw error;
      return data as PurchaseOrder;
    },
    rejectOrder: async (orderId, motivo) => {
      const { data, error } = await supabase.from('purchase_orders').update({ status: 'Recusada', motivo_recusa: motivo }).eq('id', orderId).select().single();
      if (error) throw error;
      return data as PurchaseOrder;
    },
  },

  suppliers: {
    getAll: async () => {
      const { data, error } = await supabase.from('suppliers').select('*').order('nome_fantasia', { ascending: true });
      if (error) throw error;
      return data as Supplier[];
    },
    getById: async (id) => {
      const { data, error } = await supabase.from('suppliers').select('*').eq('id', id).single();
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data as Supplier;
    },
    create: async (supplier) => {
      const { data, error } = await supabase.from('suppliers').insert(supplier).select().single();
      if (error) throw error;
      return data as Supplier;
    },
    update: async (id, supplier) => {
      const { data, error } = await supabase.from('suppliers').update(supplier).eq('id', id).select().single();
      if (error) throw error;
      return data as Supplier;
    },
    delete: async (id) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
    },
  },

  employees: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          nome_completo,
          email,
          cpf,
          data_nascimento,
          data_admissao,
          data_desligamento,
          cargo,
          departamento,
          setor,
          endereco,
          cidade,
          estado,
          cep,
          telefone,
          salario_inicial,
          salario_atual,
          status,
          itens_vinculados,
          empresa_id,
          company_id,
          created_at,
          updated_at,
          data_cadastro,
          data_atualizacao
        `)
        .order('nome_completo', { ascending: true });
        
      if (error) {
        console.error("Erro detalhado ao buscar colaboradores:", error);
        throw error;
      }
      
      return data as Employee[];
    },
    getById: async (id: string): Promise<Employee | null> => {
      try {
        // Primeiro, busca os dados básicos do funcionário
        const { data: employeeData, error } = await supabase
          .from('employees')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') return null;
          throw error;
        }

        if (!employeeData) return null;

        // Se houver um company_id, busca os dados da empresa separadamente
        if (employeeData.company_id) {
          const { data: companyData } = await supabase
            .from('companies')
            .select('*')
            .eq('id', employeeData.company_id)
            .single();
          
          return { ...employeeData, company: companyData || null } as Employee;
        }

        return employeeData as Employee;
      } catch (error) {
        console.error('Erro ao buscar funcionário:', error);
        throw error;
      }
    },
    create: async (formData) => {
      const { data, error } = await supabase
        .from('employees')
        .insert(formData)
        .select(`
          id,
          nome_completo,
          email,
          cpf,
          data_nascimento,
          data_admissao,
          data_desligamento,
          cargo,
          departamento,
          setor,
          endereco,
          cidade,
          estado,
          cep,
          telefone,
          salario_inicial,
          salario_atual,
          status,
          itens_vinculados,
          empresa_id,
          company_id,
          created_at,
          updated_at,
          data_cadastro,
          data_atualizacao,
          company:company_id(*)
        `)
        .single();
      
      if (error) throw error;
      
      return data as Employee;
    },
    update: async (id, formData) => {
      const { data, error } = await supabase
        .from('employees')
        .update(formData)
        .eq('id', id)
        .select(`
          id,
          nome_completo,
          email,
          cpf,
          data_nascimento,
          data_admissao,
          data_desligamento,
          cargo,
          departamento,
          setor,
          endereco,
          cidade,
          estado,
          cep,
          telefone,
          salario_inicial,
          salario_atual,
          status,
          itens_vinculados,
          empresa_id,
          company_id,
          created_at,
          updated_at,
          data_cadastro,
          data_atualizacao,
          company:company_id(*)
        `)
        .single();
        
      if (error) throw error;
      
      return data as Employee;
    },
    delete: async (id) => {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
    },
  },

  salaryHistory: {
    getByEmployeeId: async (employeeId) => {
      const { data, error } = await supabase.from('salary_history').select('*').eq('employee_id', employeeId).order('data_alteracao', { ascending: false });
      if (error) throw error;
      return data as SalaryHistory[];
    },
    create: async (salaryData) => {
        // Assegura que a data seja uma string no formato ISO, que é o esperado pelo Supabase
        const payload = {
            ...salaryData,
            data_alteracao: new Date(salaryData.data_alteracao).toISOString(),
        };
      const { data, error } = await supabase.from('salary_history').insert(payload).select().single();
      if (error) throw error;
      return data as SalaryHistory;
    },
    delete: async (id) => {
      const { error } = await supabase.from('salary_history').delete().eq('id', id);
      if (error) throw error;
    },
  },

  users: {
    // Busca nomes de usuários na tabela 'profiles', que é uma prática comum com Supabase Auth.
    getUsersByIds: async (ids) => {
      if (ids.length === 0) return {};
      const { data, error } = await supabase.from('profiles').select('id, nome').in('id', ids);
      if (error) throw error;

      const userMap: { [id: string]: string } = {};
      data.forEach((user: { id: string; nome: string }) => {
        userMap[user.id] = user.nome || 'Usuário Desconhecido';
      });
      return userMap;
    },
  },

  companies: {
    getAll: async () => {
      const { data, error } = await supabase.from('companies').select('*').order('business_name', { ascending: true });
      if (error) throw error;
      return data as Company[];
    },
    getById: async (id) => {
      const { data, error } = await supabase.from('companies').select('*').eq('id', id).single();
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data as Company;
    },
    create: async (companyData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado para cadastrar empresa.');

      // Define o status como 'true' (Ativo) por padrão na criação.
      const payload = { ...companyData, status: true };
      const { data, error } = await supabase.from('companies').insert(payload).select().single();
      if (error) throw error;
      return data as Company;
    },
    update: async (id, companyData) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado para atualizar empresa.');
        
        // Adiciona informações de auditoria
        const payload = {
            ...companyData,
            updated_at: new Date().toISOString(),
            updated_by: user.id,
        };

      const { data, error } = await supabase.from('companies').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data as Company;
    },
    delete: async (id) => {
      const { error } = await supabase.from('companies').delete().eq('id', id);
      if (error) throw error;
    },
    getNextCode: async () => {
      const { data, error } = await supabase.from('companies').select('codigo').order('codigo', { ascending: false }).limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return '001';
      const nextCode = parseInt(data.codigo, 10) + 1;
      return nextCode.toString().padStart(3, '0');
    },
  },
};
