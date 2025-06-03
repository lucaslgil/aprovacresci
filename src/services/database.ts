import { supabase } from '../lib/supabase'

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

export const databaseService = {
  // Operações para a tabela de itens
  items: {
    async getAll() {
      const { data, error } = await supabase
        .from('items')
        .select('*, suppliers(*)')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Item[]
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('items')
        .select('*, suppliers(*)')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data as Item
    },

    async create(item: Omit<Item, 'id' | 'created_at' | 'updated_at' | 'suppliers'>) {
      const { data, error } = await supabase
        .from('items')
        .insert([item])
        .select()
        .single()
      
      if (error) throw error
      return data as Item
    },

    async update(id: string, item: Partial<Omit<Item, 'suppliers'>>) {
      const { data, error } = await supabase
        .from('items')
        .update(item)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data as Item
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },

    async getNextCode(): Promise<string> {
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

    async isCodeUnique(codigo: string) {
      const { data, error } = await supabase
        .from('items')
        .select('codigo')
        .eq('codigo', codigo)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return !data
    }
  },

  // New operations for the purchase_orders table
  purchaseOrders: {
    async create(order: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at' | 'status' | 'user_id' | 'suppliers'>) {
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

    async getPendingOrders() {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*, suppliers(*)')
        .eq('status', 'Pendente')
        .order('data_solicitacao', { ascending: false });

      if (error) throw error;
      return data as PurchaseOrder[];
    },

    async getAll() {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*, suppliers(*)') // Select related supplier data
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PurchaseOrder[];
    },

    async update(id: string, order: Partial<Omit<PurchaseOrder, 'suppliers'>>) {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update(order)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as PurchaseOrder;
    },

    async approveOrder(orderId: string): Promise<PurchaseOrder[] | null> {
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

    async approveBudget(orderId: string): Promise<PurchaseOrder[] | null> {
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

    async realizePurchase(orderId: string): Promise<PurchaseOrder[] | null> {
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

    async rejectOrder(orderId: string, motivo: string | null = null): Promise<PurchaseOrder[] | null> {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({
          status: 'Recusada',
          data_aprovacao: new Date().toISOString().split('T')[0], // Optional: might set rejection date too
          motivo_recusa: motivo, // Salvando o motivo
        })
        .eq('id', orderId)
        .select();

      if (error) throw error;
      return data;
    },
  },

  // New operations for the suppliers table
  suppliers: {
    async getAll() {
       const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('nome_fantasia', { ascending: true });

      if (error) throw error;
      return data as Supplier[];
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Supplier;
    },

    async create(supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([supplier])
        .select()
        .single();

      if (error) throw error;
      return data as Supplier;
    },

     async update(id: string, supplier: Partial<Supplier>) {
      const { data, error } = await supabase
        .from('suppliers')
        .update(supplier)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Supplier;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
  },
} 