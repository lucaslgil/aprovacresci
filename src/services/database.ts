import { supabase } from '../lib/supabase'
import.meta.env;
import { Employee, EmployeeFormData, SalaryHistory } from '../types/Employee'
import { Company } from '../types/Company'

export interface Item {
  id: string
  codigo: string
  item: string
  modelo: string | null
  numero_serie: string | null
  detalhes: string | null
  nota_fiscal: string | null
  supplier_id: string | null
  setor: string | null
  responsavel: string | null
  status: string
  valor_aproximado: number | null;
  motivo_descarte?: string | null; // Novo campo para motivo de descarte
  created_at: string
  updated_at: string
  suppliers?: Supplier
}

// New interface for Purchase Order
export interface PurchaseOrder {
  id: string
  user_id: string // ID do usuário que criou a ordem
  solicitante: string // Solicitante da ordem
  descricao: string // Descrição/detalhes da ordem
  supplier_id: string | null; // Now stores the ID of the supplier (optional)
  valor: number | null; // Valor total (opcional), allow null
  data_solicitacao: string // Data da solicitação
  data_aprovacao: string | null // Data de aprovação (opcional), allow null
  status: 'Aguardando aprovação' | 'Aguardando Orçamento' | 'Orçamento Aprovado' | 'Compra Realizada' | 'Recusada' // Status da ordem
  motivo_recusa?: string | null; // Novo campo para motivo de recusa/cancelamento
  created_at: string
  updated_at: string
  suppliers?: Supplier; // The related supplier data (will be null if no supplier_id)
}

// New interface for Supplier
export interface Supplier {
  id: string;
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  telefone?: string; // Optional
  cep?: string; // Optional, but used for lookup
  endereco?: string; // Populated by CEP lookup
  numero?: string; // Specific number, not from CEP
  bairro?: string; // Populated by CEP lookup
  cidade?: string; // Populated by CEP lookup
  estado?: string; // Populated by CEP lookup
  created_at: string;
  updated_at: string;
}

export interface DatabaseService {
  items: {
    getAll: () => Promise<Item[]>;
    getById: (id: string) => Promise<Item | null>;
    create: (data: Omit<Item, 'id' | 'created_at' | 'updated_at' | 'suppliers'>) => Promise<Item>;
    update: (id: string, data: Partial<Omit<Item, 'suppliers'>>) => Promise<Item>;
    delete: (id: string) => Promise<void>;
    getNextCode: () => Promise<string>;
    isCodeUnique: (codigo: string) => Promise<boolean>;
  };
  purchaseOrders: {
    create: (order: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at' | 'status' | 'user_id' | 'suppliers'>) => Promise<PurchaseOrder>;
    getPendingOrders: () => Promise<PurchaseOrder[]>;
    getAll: () => Promise<PurchaseOrder[]>;
    update: (id: string, order: Partial<Omit<PurchaseOrder, 'suppliers'>>) => Promise<PurchaseOrder>;
    approveOrder: (orderId: string) => Promise<PurchaseOrder[] | null>;
    approveBudget: (orderId: string) => Promise<PurchaseOrder[] | null>;
    realizePurchase: (orderId: string) => Promise<PurchaseOrder[] | null>;
    rejectOrder: (orderId: string, motivo?: string | null) => Promise<PurchaseOrder[] | null>;
  };
  suppliers: {
    getAll: () => Promise<Supplier[]>;
    getById: (id: string) => Promise<Supplier>;
    create: (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => Promise<Supplier>;
    update: (id: string, supplier: Partial<Supplier>) => Promise<Supplier>;
    delete: (id: string) => Promise<void>;
  };
  employees: {
    getAll: () => Promise<Employee[]>;
    getById: (id: string) => Promise<Employee | null>;
    create: (data: EmployeeFormData) => Promise<Employee>;
    update: (id: string, data: Partial<EmployeeFormData>) => Promise<Employee>;
    delete: (id: string) => Promise<void>;
    vincularItem: (employeeId: string, itemId: string) => Promise<void>;
    desvincularItem: (employeeId: string, itemId: string) => Promise<void>;
  };
  salaryHistory: {
    getAll: () => Promise<SalaryHistory[]>;
    getByEmployeeId: (employeeId: string) => Promise<SalaryHistory[]>;
    create: (data: Omit<SalaryHistory, 'id'>) => Promise<SalaryHistory>;
    delete: (id: string) => Promise<void>;
  };
  users: {
    getUsersByIds: (ids: string[]) => Promise<{ [id: string]: string }>;
  };
  companies: {
    getAll: () => Promise<Company[]>;
    getById: (id: string) => Promise<Company | null>;
    create: (data: Omit<Company, 'id' | 'created_at' | 'situacao'>) => Promise<Company>;
    update: (id: string, data: Partial<Omit<Company, 'created_at'>>) => Promise<Company>;
    delete: (id: string) => Promise<void>;
    getNextCode: () => Promise<string>;
  };
}

const databaseService: DatabaseService = {
  items: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*, suppliers(*)')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Item[]
    },

    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('items')
        .select('*, suppliers(*)')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data as Item
    },

    create: async (item: Omit<Item, 'id' | 'created_at' | 'updated_at' | 'suppliers'>) => {
      const { data, error } = await supabase
        .from('items')
        .insert([item])
        .select()
        .single()
      
      if (error) throw error
      return data as Item
    },

    update: async (id: string, item: Partial<Omit<Item, 'suppliers'>>) => {
      const { data, error } = await supabase
        .from('items')
        .update(item)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data as Item
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },

    getNextCode: async (): Promise<string> => {
      try {
        const { data, error } = await supabase
          .from('items')
          .select('codigo')
          .order('codigo', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
          return '000001';
        }

        // Converte todos os códigos para números
        const codes = data.map(item => parseInt(item.codigo)).filter(code => !isNaN(code));
        
        // Se não houver códigos válidos, retorna 000001
        if (codes.length === 0) {
          return '000001';
        }

        // Encontra o primeiro número disponível
        let nextNumber = 1;
        for (const code of codes) {
          if (code !== nextNumber) {
            break;
          }
          nextNumber++;
        }

        return nextNumber.toString().padStart(6, '0');
      } catch (error) {
        console.error('Erro ao gerar próximo código:', error);
        return '000001';
      }
    },

    isCodeUnique: async (codigo: string) => {
      const { data, error } = await supabase
        .from('items')
        .select('codigo')
        .eq('codigo', codigo)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return !data
    }
  },

  purchaseOrders: {
    create: async (order: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at' | 'status' | 'user_id' | 'suppliers'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('purchase_orders')
        .insert([{
          ...order,
          user_id: user.id,
          status: 'Aguardando aprovação',
        }])
        .select()
        .single();

      if (error) throw error;
      return data as PurchaseOrder;
    },

    getPendingOrders: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*, suppliers(*)')
        .eq('status', 'Pendente')
        .order('data_solicitacao', { ascending: false });

      if (error) throw error;
      return data as PurchaseOrder[];
    },

    getAll: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*, suppliers(*)') // Select related supplier data
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PurchaseOrder[];
    },

    update: async (id: string, order: Partial<Omit<PurchaseOrder, 'suppliers'>>) => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update(order)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as PurchaseOrder;
    },

    approveOrder: async (orderId: string) => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({
          status: 'Aguardando Orçamento',
          data_aprovacao: new Date().toISOString().split('T')[0], // Set current date in YYYY-MM-DD format
        })
        .eq('id', orderId)
        .select();

      if (error) throw error;
      return data;
    },

    approveBudget: async (orderId: string) => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({
          status: 'Orçamento Aprovado',
          // data_aprovacao pode ser mantido ou adicionar um novo campo data_orcamento_aprovado se necessário
        })
        .eq('id', orderId)
        .select();

      if (error) throw error;
      return data;
    },

    realizePurchase: async (orderId: string) => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({
          status: 'Compra Realizada',
          // Adicionar campo data_compra_realizada se necessário
        })
        .eq('id', orderId)
        .select();

      if (error) throw error;
      return data;
    },

    rejectOrder: async (orderId: string, motivo: string | null = null) => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({
          status: 'Recusada',
          data_aprovacao: new Date().toISOString().split('T')[0], // Optional: might set rejection date too
          motivo_recusa: motivo,
        })
        .eq('id', orderId)
        .select();

      if (error) throw error;
      return data;
    },
  },

  suppliers: {
    getAll: async () => {
       const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('nome_fantasia', { ascending: true });

      if (error) throw error;
      return data as Supplier[];
    },

    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Supplier;
    },

    create: async (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([supplier])
        .select()
        .single();

      if (error) throw error;
      return data as Supplier;
    },

     update: async (id: string, supplier: Partial<Supplier>) => {
      const { data, error } = await supabase
        .from('suppliers')
        .update(supplier)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Supplier;
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
  },

  employees: {
    getAll: async (): Promise<Employee[]> => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, nome, cpf, cargo, setor, email, telefone, status, itensVinculados:itens_vinculados, dataCadastro:data_cadastro, dataAtualizacao:data_atualizacao, salario, dataAdmissao:data_admissao, dataDesligamento:data_desligamento')
        .order('nome', { ascending: true });

      if (error) throw error;

      return data as Employee[];
    },
    getById: async (id: string): Promise<Employee | null> => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, nome, cpf, cargo, setor, email, telefone, status, itensVinculados:itens_vinculados, dataCadastro:data_cadastro, dataAtualizacao:data_atualizacao, salario, dataAdmissao:data_admissao, dataDesligamento:data_desligamento, company_id')
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as Employee;
    },
    create: async (data: EmployeeFormData): Promise<Employee> => {
      const { data: createdEmployee, error } = await supabase
        .from('employees')
        .insert([{ // Use um objeto para inserir, mapeando para snake_case
           nome: data.nome,
           cpf: data.cpf,
           cargo: data.cargo,
           setor: data.setor,
           email: data.email,
           telefone: data.telefone,
           status: data.status,
           itens_vinculados: data.itensVinculados || [], // Mapeamento e default
           salario: data.salario,
           data_admissao: data.dataAdmissao, // Mapeamento
           data_desligamento: data.dataDesligamento, // Mapeamento
           company_id: data.company_id // Adicionando o company_id
        }])
        // Selecionar todos os campos para corresponder à interface Employee, mapeando snake_case para camelCase
        .select('id, nome, cpf, cargo, setor, email, telefone, status, itensVinculados:itens_vinculados, dataCadastro:data_cadastro, dataAtualizacao:data_atualizacao, salario, dataAdmissao:data_admissao, dataDesligamento:data_desligamento, company_id')
        .single();

      if (error) throw error;
      
      return createdEmployee as Employee;
    },
    update: async (id: string, data: Partial<EmployeeFormData>): Promise<Employee> => {
       // Construir o objeto de payload com nomes de colunas do banco de dados (snake_case)
       const updatePayload: any = {};
       if (data.nome !== undefined) updatePayload.nome = data.nome;
       if (data.cpf !== undefined) updatePayload.cpf = data.cpf;
       if (data.email !== undefined) updatePayload.email = data.email;
       if (data.telefone !== undefined) updatePayload.telefone = data.telefone;
       if (data.cargo !== undefined) updatePayload.cargo = data.cargo;
       if (data.status !== undefined) updatePayload.status = data.status;
       if (data.setor !== undefined) updatePayload.setor = data.setor;
       if (data.itensVinculados !== undefined) updatePayload.itens_vinculados = data.itensVinculados;
       if (data.salario !== undefined) updatePayload.salario = data.salario;
       if (data.dataAdmissao !== undefined) updatePayload.data_admissao = data.dataAdmissao;
       if (data.dataDesligamento !== undefined) updatePayload.data_desligamento = data.dataDesligamento;
       if (data.company_id !== undefined) updatePayload.company_id = data.company_id; // Adicionando o company_id

      const { data: updatedEmployee, error } = await supabase
        .from('employees')
        .update(updatePayload)
        .eq('id', id)
        .select('id, nome, cpf, cargo, setor, email, telefone, status, itensVinculados:itens_vinculados, dataCadastro:data_cadastro, dataAtualizacao:data_atualizacao, salario, dataAdmissao:data_admissao, dataDesligamento:data_desligamento, company_id') // Selecionar campos para corresponder à interface

      if (error) throw error;

       return updatedEmployee[0] as Employee; // supabase update retorna um array, pegar o primeiro elemento
    },
    delete: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    vincularItem: async (employeeId: string, itemId: string): Promise<void> => {
      const employee = await databaseService.employees.getById(employeeId);
      if (!employee) throw new Error('Employee not found');

      const updatedItemsVinculados = employee.itensVinculados ? [...employee.itensVinculados, itemId] : [itemId];

      await databaseService.employees.update(employeeId, { itensVinculados: updatedItemsVinculados });
    },
    desvincularItem: async (employeeId: string, itemId: string): Promise<void> => {
      const employee = await databaseService.employees.getById(employeeId);
      if (!employee) throw new Error('Employee not found');

      const updatedItemsVinculados = employee.itensVinculados ? employee.itensVinculados.filter(id => id !== itemId) : [];

      await databaseService.employees.update(employeeId, { itensVinculados: updatedItemsVinculados });
    },
  },
  salaryHistory: {
    getAll: async (): Promise<SalaryHistory[]> => {
      const { data, error } = await supabase
        .from('salary_history')
        .select('id, employee_id, valor_anterior, valor_novo, data_alteracao, motivo, usuario_alteracao, created_at, updated_at')
        .order('data_alteracao', { ascending: false });

      if (error) throw error;
      return data as SalaryHistory[];
    },
    getByEmployeeId: async (employeeId: string): Promise<SalaryHistory[]> => {
      const { data, error } = await supabase
        .from('salary_history')
        .select('id, employee_id, valor_anterior, valor_novo, data_alteracao, motivo, usuario_alteracao')
        .eq('employee_id', employeeId)
        .order('data_alteracao', { ascending: false });

      if (error) throw error;

      return data as SalaryHistory[];
    },
    create: async (data: Omit<SalaryHistory, 'id'>): Promise<SalaryHistory> => {
      const insertPayload = {
        employee_id: data.employee_id,
        valor_anterior: data.valor_anterior,
        valor_novo: data.valor_novo,
         data_alteracao: data.data_alteracao,
         motivo: data.motivo,
         usuario_alteracao: data.usuario_alteracao,
       };
      const { data: newHistory, error } = await supabase
        .from('salary_history')
        .insert([insertPayload])
        .select('id, employee_id, valor_anterior, valor_novo, data_alteracao, motivo, usuario_alteracao, created_at, updated_at')
        .single();

      if (error) throw error;
      return newHistory as SalaryHistory;
    },
    delete: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('salary_history')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
  },
  users: {
    getUsersByIds: async (ids: string[]): Promise<{ [id: string]: string }> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome')
        .in('id', ids);

      if (error) throw error;

      const usersMap: { [id: string]: string } = {};
      data.forEach(user => {
        usersMap[user.id] = user.nome;
      });

      return usersMap;
    },
  },
  companies: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('business_name', { ascending: true });
      
      if (error) throw error;
      return data as Company[];
    },

    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Company;
    },

    create: async (company: Omit<Company, 'id' | 'created_at' | 'status'>) => {
      // Adicionar verificação de autenticação
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado para cadastrar empresa.');
      }

      // Define o status como TRUE (Ativo) por padrão na criação
      const companyData = { ...company, status: true };
      const { data, error } = await supabase
        .from('companies')
        .insert([companyData])
        .select()
        .single();

      if (error) {
         console.error('Erro Supabase ao criar empresa:', error);
         throw error;
      }
      return data as Company;
    },

    update: async (id: string, company: Partial<Omit<Company, 'created_at'>>) => {
      console.log('=== INÍCIO DA ATUALIZAÇÃO DE EMPRESA ===');
      console.log('ID da empresa:', id);
      console.log('Dados da empresa a serem atualizados:', JSON.stringify(company, null, 2));
      
      // Verificar se o ID é válido
      if (!id) {
        const error = new Error('ID da empresa não fornecido');
        console.error('Erro:', error.message);
        throw error;
      }
      
      // Verificar se há dados para atualizar
      if (!company || Object.keys(company).length === 0) {
        const error = new Error('Nenhum dado fornecido para atualização');
        console.error('Erro:', error.message);
        throw error;
      }
      
      try {
        console.log('Iniciando atualização no Supabase...');
        
        // Log do objeto company antes de processar
        console.log('Objeto company recebido:', JSON.stringify(company, null, 2));
        
        // Verificar se há campos obrigatórios
        const requiredFields = ['business_name', 'person_type'];
        const missingFields = requiredFields.filter(field => !(field in company));
        
        if (missingFields.length > 0) {
          const errorMessage = `Campos obrigatórios não fornecidos: ${missingFields.join(', ')}`;
          console.error('Erro de validação:', errorMessage);
          throw new Error(errorMessage);
        }
        
        // Validar tipo de pessoa e campos relacionados
        if (company.person_type === 'Fisica' && !company.cpf) {
          throw new Error('CPF é obrigatório para pessoa física');
        } else if (company.person_type === 'Juridica' && !company.cnpj) {
          throw new Error('CNPJ é obrigatório para pessoa jurídica');
        }
        
        // Verificar se o usuário está autenticado
        console.log('Verificando autenticação do usuário...');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('Erro ao verificar autenticação:', authError);
          throw new Error('Falha ao verificar autenticação do usuário');
        }
        
        console.log('Usuário autenticado:', user ? `ID: ${user.id}` : 'Não autenticado');
        
        if (!user) {
          throw new Error('Usuário não autenticado para atualizar empresa.');
        }
        
        // Criar cópia do objeto para evitar modificar o original
        const companyToUpdate = { ...company };
        
        // Remover campos undefined para evitar erros no Supabase
        Object.keys(companyToUpdate).forEach(key => {
          if (companyToUpdate[key] === undefined) {
            delete companyToUpdate[key];
          }
        });
        
        // Adicionar informações de auditoria
        const companyWithAudit = {
          ...companyToUpdate,
          updated_at: new Date().toISOString(),
          updated_by: user.id
        };
        
        console.log('Dados com auditoria para atualização:', JSON.stringify(companyWithAudit, null, 2));
        
        // Fazer a requisição de atualização
        console.log('=== DADOS PARA ATUALIZAÇÃO ===');
        console.log('Tabela: companies');
        console.log('ID:', id);
        
        // Verificar e formatar os dados antes de enviar
        const dataToSend: Record<string, any> = { ...companyWithAudit };
        
        // Mapeamento de tipos esperados para cada campo
        const fieldTypes: Record<string, string> = {
          code: 'number',
          business_name: 'string',
          fantasy_name: 'string',
          person_type: 'string',
          cpf: 'string',
          cnpj: 'string',
          state_registration: 'string',
          phone: 'string',
          zip_code: 'string',
          address: 'string',
          number: 'string',
          neighborhood: 'string',
          city: 'string',
          state: 'string',
          status: 'boolean',
          additional_data: 'string',
          updated_at: 'string',
          updated_by: 'string'
        };
        
        console.log('=== DADOS APÓS PRIMEIRA VALIDAÇÃO ===');
        console.log(JSON.stringify(dataToSend, null, 2));
        
        // Validar e converter tipos de dados
        for (const [field, value] of Object.entries(dataToSend)) {
          const expectedType = fieldTypes[field];
          
          console.log(`Processando campo: ${field}, valor:`, value, `tipo:`, typeof value);
          
          if (value === null || value === undefined || value === '') {
            // Se o valor for nulo, indefinido ou string vazia, remover do objeto
            console.log(`Removendo campo vazio: ${field}`);
            delete dataToSend[field];
            continue;
          }
          
          if (!expectedType) {
            console.warn(`Campo não reconhecido: ${field}`);
            continue;
          }
          
          try {
            // Converter para o tipo esperado
            switch (expectedType) {
              case 'number':
                dataToSend[field] = Number(value);
                if (isNaN(dataToSend[field])) {
                  console.warn(`Valor inválido para campo numérico: ${field} = ${value}`);
                  delete dataToSend[field];
                }
                break;
                
              case 'boolean':
                if (typeof value === 'string') {
                  dataToSend[field] = value.toLowerCase() === 'true' || value === '1';
                } else if (typeof value === 'number') {
                  dataToSend[field] = value !== 0;
                } else {
                  dataToSend[field] = Boolean(value);
                }
                break;
                
              case 'string':
                // Remover caracteres não numéricos de campos específicos
                if (['cpf', 'cnpj', 'phone', 'zip_code'].includes(field)) {
                  dataToSend[field] = String(value).replace(/\D/g, '');
                } else {
                  dataToSend[field] = String(value).trim();
                }
                break;
                
              default:
                dataToSend[field] = value;
            }
            
            // Verificar se o valor convertido é do tipo esperado
            if (typeof dataToSend[field] !== expectedType) {
              console.warn(`Tipo inesperado para ${field}: esperado ${expectedType}, obtido ${typeof dataToSend[field]}`);
            }
            
          } catch (error) {
            console.error(`Erro ao converter campo ${field}:`, error);
            // Em caso de erro na conversão, remover o campo
            delete dataToSend[field];
          }
        }
        
        // Remover campos vazios
        Object.keys(dataToSend).forEach(key => {
          if (dataToSend[key] === '' || dataToSend[key] === undefined) {
            delete dataToSend[key];
          }
        });
        
        console.log('Dados formatados para envio:', JSON.stringify(dataToSend, null, 2));
        
        // Verificar tipos de dados
        Object.entries(dataToSend).forEach(([key, value]) => {
          console.log(`Campo: ${key}, Tipo: ${typeof value}, Valor:`, value);
        });
        
        console.log('Enviando requisição de atualização para o Supabase...');
        
        console.log('=== REQUISIÇÃO AO SUPABASE ===');
        console.log('Método: PATCH');
        console.log('URL: /rest/v1/companies');
        console.log('Headers:', {
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        });
        console.log('Query Params:', `id=eq.${id}&select=*`);
        console.log('Body:', JSON.stringify(dataToSend, null, 2));
        
        console.log('=== DADOS FINAIS PARA ENVIO ===');
        console.log(JSON.stringify(dataToSend, null, 2));
        
        // Verificar se há campos com valor undefined
        const hasUndefinedFields = Object.entries(dataToSend).some(([key, value]) => value === undefined);
        if (hasUndefinedFields) {
          console.warn('AVISO: Existem campos com valor undefined no objeto de envio');
          console.log('Campos com undefined:', Object.entries(dataToSend)
            .filter(([_, value]) => value === undefined)
            .map(([key]) => key)
          );
        }
        
        // Fazer uma cópia limpa dos dados para envio
        const cleanDataToSend = JSON.parse(JSON.stringify(dataToSend));
        
        // Verificar se há campos obrigatórios faltando
        const requiredFieldsList = ['business_name', 'person_type'];
        const missingRequiredFields = requiredFieldsList.filter(field => !(field in cleanDataToSend));
        
        if (missingRequiredFields.length > 0) {
          const errorMessage = `Campos obrigatórios faltando: ${missingRequiredFields.join(', ')}`;
          console.error('Erro de validação:', errorMessage);
          throw new Error(errorMessage);
        }
        
        // Verificar se o tipo de pessoa e os campos relacionados estão corretos
        if (cleanDataToSend.person_type === 'Fisica' && !cleanDataToSend.cpf) {
          throw new Error('CPF é obrigatório para pessoa física');
        } else if (cleanDataToSend.person_type === 'Juridica' && !cleanDataToSend.cnpj) {
          throw new Error('CNPJ é obrigatório para pessoa jurídica');
        }
        
        // Remover campos que podem causar problemas
        const fieldsToRemove = ['created_at', 'id', 'situacao'];
        fieldsToRemove.forEach(field => {
          if (field in cleanDataToSend) {
            console.log(`Removendo campo ${field} do envio`);
            delete cleanDataToSend[field];
          }
        });
        
        console.log('=== DADOS FINAIS LIMPOS ===');
        console.log(JSON.stringify(cleanDataToSend, null, 2));
        
        console.log('=== ENVIANDO REQUISIÇÃO ===');
        console.log('URL: /rest/v1/companies');
        console.log('Método: PATCH');
        console.log('Headers:', {
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
          'Accept': 'application/vnd.pgrst.object+json'
        });
        console.log('Query: id=eq.' + id + '&select=*');
        
        let updateResult;
        try {
          // Verificar variáveis de ambiente
          if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
            console.error('Variáveis de ambiente do Supabase não configuradas corretamente');
            throw new Error('Configuração do ambiente incompleta');
          }
          
          console.log('URL do Supabase:', import.meta.env.VITE_SUPABASE_URL);
          console.log('Chave anônima do Supabase:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '*** Configurada ***' : 'Não configurada');
          
          const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/companies?id=eq.${id}&select=*`;
          console.log('URL completa da requisição:', url);
          
          // Log detalhado dos dados que serão enviados
          console.log('=== DADOS QUE SERÃO ENVIADOS ===');
          console.log('Tipo de dados:', typeof cleanDataToSend);
          console.log('Dados brutos:', cleanDataToSend);
          console.log('Dados em JSON:', JSON.stringify(cleanDataToSend, null, 2));
          
          // Verificar se há valores inválidos
          const invalidValues = Object.entries(cleanDataToSend)
            .filter(([key, value]) => value === undefined || value === null || value === '');
            
          if (invalidValues.length > 0) {
            console.warn('AVISO: Existem valores inválidos nos dados:', invalidValues);
          }
          
          // Usar fetch diretamente para ter mais controle sobre a requisição
          const response = await fetch(url, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
                'Prefer': 'return=representation',
                'Accept': 'application/vnd.pgrst.object+json'
              },
              body: JSON.stringify(cleanDataToSend)
            }
          );
          
          const responseData = await response.json();
          
          updateResult = {
            data: response.ok ? responseData : null,
            error: !response.ok ? {
              message: 'Erro na requisição',
              details: responseData,
              hint: 'Verifique os dados enviados',
              code: response.status.toString()
            } : null,
            status: response.status,
            statusText: response.statusText
          };
          
          console.log('Resposta bruta do servidor:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            data: responseData
          });
          
        } catch (error) {
          console.error('Erro na requisição ao Supabase:', error);
          if (error instanceof Error) {
            console.error('Mensagem de erro:', error.message);
            if ('response' in error) {
              console.error('Resposta do servidor:', (error as any).response);
            }
          }
          throw error;
        }
        
        console.log('=== RESPOSTA DO SUPABASE ===');
        console.log('Status:', updateResult.status);
        console.log('Status Text:', updateResult.statusText);
        console.log('Dados:', updateResult.data);
        console.log('Erro:', updateResult.error);
        
        // Log detalhado do erro, se houver
        if (updateResult.error) {
          console.error('Detalhes do erro:', {
            code: updateResult.error.code,
            message: updateResult.error.message,
            details: updateResult.error.details,
            hint: updateResult.error.hint
          });
        }
        
        console.log('Resultado da atualização - Status:', updateResult.status);
        console.log('Resultado da atualização - Status Text:', updateResult.statusText);
        console.log('Resultado da atualização - Dados:', JSON.stringify(updateResult.data, null, 2));
        
        if (updateResult.error) {
          console.error('Erro ao atualizar empresa no Supabase:', updateResult.error);
          
          // Verificar se é um erro de permissão
          if (updateResult.error.code === '42501') {
            console.error('Erro de permissão: O usuário não tem permissão para atualizar esta empresa');
          }
          
          // Verificar se é um erro de validação
          if (updateResult.error.code === '23505') {
            console.error('Erro de chave única violada:', updateResult.error.details);
            throw new Error('Já existe uma empresa com estes dados (CPF/CNPJ já cadastrado)');
          }
          
          // Verificar se é um erro de restrição
          if (updateResult.error.code === '23503') {
            console.error('Erro de restrição de chave estrangeira:', updateResult.error.details);
            throw new Error('Erro de integridade referencial. Verifique os relacionamentos.');
          }
          
          // Verificar se é um erro de validação de dados
          if (updateResult.error.code === '22P02' || updateResult.error.code === '22007') {
            console.error('Erro de validação de dados:', updateResult.error.details);
            throw new Error('Dados inválidos fornecidos. Verifique os campos e tente novamente.');
          }
          
          throw updateResult.error;
        }
        
        // Verificar se a atualização foi bem-sucedida
        if (!updateResult.data || updateResult.data.length === 0) {
          console.warn('Nenhum dado retornado na atualização, mas sem erros. Verificando se a empresa ainda existe...');
          
          // Tentar buscar a empresa para verificar se ainda existe
          const { data: existingCompany, error: fetchExistingError } = await supabase
            .from('companies')
            .select('id')
            .eq('id', id)
            .single();
            
          if (fetchExistingError || !existingCompany) {
            throw new Error('A empresa não foi encontrada após a atualização. Ela pode ter sido excluída.');
          }
          
          console.log('A empresa ainda existe no banco de dados, mas nenhum dado foi retornado na atualização.');
        }
        
        // Se chegou até aqui, a atualização foi bem-sucedida
        // Retornar os dados atualizados diretamente do updateResult.data
        if (updateResult.data && updateResult.data.length > 0) {
          console.log('Empresa atualizada com sucesso:', JSON.stringify(updateResult.data[0], null, 2));
          console.log('=== FIM DA ATUALIZAÇÃO DE EMPRESA ===');
          return updateResult.data[0] as Company;
        }
        
        // Se não houver dados no updateResult, tentar buscar novamente
        console.log('Buscando dados atualizados completos da empresa...');
        const { data, error: fetchError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', id)
          .single();
          
        if (fetchError || !data) {
          console.error('Erro ao buscar dados atualizados:', fetchError || 'Dados não encontrados');
          // Se não conseguir buscar os dados atualizados, retornar os dados que foram enviados
          console.log('Retornando dados enviados como fallback');
          return { ...companyWithAudit, id } as Company;
        }
        
        console.log('Empresa atualizada com sucesso (busca pós-atualização):', JSON.stringify(data, null, 2));
        console.log('=== FIM DA ATUALIZAÇÃO DE EMPRESA ===');
        return data as Company;
      } catch (error) {
        console.error('Erro durante a atualização da empresa:', error);
        
        // Log detalhado do erro
        if (error instanceof Error) {
          console.error('Mensagem de erro:', error.message);
          console.error('Stack trace:', error.stack);
          
          // Se for um erro do Supabase, logar detalhes adicionais
          if ('code' in error) {
            console.error('Código do erro:', error.code);
          }
          if ('details' in error) {
            console.error('Detalhes do erro:', error.details);
          }
          if ('hint' in error) {
            console.error('Dica do erro:', error.hint);
          }
        }
        
        console.log('=== FIM DA ATUALIZAÇÃO DE EMPRESA COM ERRO ===');
        throw error;
      }
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    getNextCode: async (): Promise<string> => {
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('code')
          .order('code', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
          return '000001';
        }


        // Converte todos os códigos para números
        const codes = data.map(item => parseInt(item.code)).filter(code => !isNaN(code));
        
        // Se não houver códigos válidos, retorna 000001
        if (codes.length === 0) {
          return '000001';
        }

        // Encontra o primeiro número disponível
        let nextNumber = 1;
        for (const code of codes) {
          if (code !== nextNumber) {
            break;
          }
          nextNumber++;
        }


        return nextNumber.toString().padStart(6, '0');
      } catch (error) {
        console.error('Erro ao gerar próximo código de empresa:', error);
        return '000001';
      }
    },
  },
}

export { databaseService }; 