-- Migração para atualizar a tabela employees com os campos corretos

-- Adiciona colunas que podem estar faltando
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS data_nascimento DATE,
ADD COLUMN IF NOT EXISTS departamento TEXT,
ADD COLUMN IF NOT EXISTS endereco TEXT,
ADD COLUMN IF NOT EXISTS cidade TEXT,
ADD COLUMN IF NOT EXISTS estado TEXT,
ADD COLUMN IF NOT EXISTS cep TEXT,
ADD COLUMN IF NOT EXISTS salario_inicial NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS salario_atual NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS data_cadastro TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS data_atualizacao TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS empresa_id UUID,
ADD COLUMN IF NOT EXISTS company_id UUID,
ADD COLUMN IF NOT EXISTS itens_vinculados JSONB DEFAULT '[]'::jsonb;

-- Atualiza o trigger para incluir a coluna data_atualizacao
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    NEW.data_atualizacao = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Garante que o trigger está configurado corretamente
DROP TRIGGER IF EXISTS on_employees_updated ON public.employees;
CREATE TRIGGER on_employees_updated
BEFORE UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Comentários para documentação
COMMENT ON COLUMN public.employees.data_nascimento IS 'Data de nascimento do funcionário';
COMMENT ON COLUMN public.employees.departamento IS 'Departamento do funcionário';
COMMENT ON COLUMN public.employees.endereco IS 'Endereço completo do funcionário';
COMMENT ON COLUMN public.employees.cidade IS 'Cidade do endereço do funcionário';
COMMENT ON COLUMN public.employees.estado IS 'Estado do endereço do funcionário';
COMMENT ON COLUMN public.employees.cep IS 'CEP do endereço do funcionário';
COMMENT ON COLUMN public.employees.salario_inicial IS 'Salário inicial do funcionário';
COMMENT ON COLUMN public.employees.salario_atual IS 'Salário atual do funcionário';
COMMENT ON COLUMN public.employees.data_cadastro IS 'Data de cadastro do funcionário';
COMMENT ON COLUMN public.employees.data_atualizacao IS 'Data da última atualização do cadastro';
COMMENT ON COLUMN public.employees.empresa_id IS 'ID da empresa do funcionário (legado)';
COMMENT ON COLUMN public.employees.company_id IS 'ID da empresa do funcionário (novo)';
COMMENT ON COLUMN public.employees.itens_vinculados IS 'Itens vinculados ao funcionário (formato JSON)';

-- Atualiza os valores padrão para garantir consistência
UPDATE public.employees SET
  data_cadastro = COALESCE(data_cadastro, created_at),
  data_atualizacao = COALESCE(data_atualizacao, updated_at),
  salario_inicial = COALESCE(salario_inicial, 0),
  salario_atual = COALESCE(salario_atual, 0),
  itens_vinculados = COALESCE(itens_vinculados, '[]'::jsonb);
