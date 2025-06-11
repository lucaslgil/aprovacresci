-- Criação da tabela de usuários
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Criação da tabela de perfis
CREATE TABLE profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Criação da tabela de projetos
CREATE TABLE projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Criação da tabela de tarefas
CREATE TABLE tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR NOT NULL,
    description TEXT,
    status VARCHAR NOT NULL DEFAULT 'pending',
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Criação da tabela de itens
CREATE TABLE items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    codigo VARCHAR NOT NULL UNIQUE,
    item VARCHAR NOT NULL,
    modelo VARCHAR,
    numero_serie VARCHAR,
    detalhes TEXT,
    nota_fiscal VARCHAR,
    fornecedor VARCHAR,
    setor VARCHAR,
    responsavel VARCHAR,
    status VARCHAR NOT NULL DEFAULT 'Ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Criação da tabela de colaboradores
CREATE TABLE employees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome VARCHAR NOT NULL,
    cpf VARCHAR UNIQUE,
    cargo VARCHAR,
    setor VARCHAR,
    email VARCHAR UNIQUE,
    telefone VARCHAR,
    status VARCHAR NOT NULL DEFAULT 'ativo',
    itens_vinculados UUID[] DEFAULT '{}', -- Array de UUIDs
    data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    salario DECIMAL(10,2) DEFAULT 0.00,
    data_admissao TIMESTAMP WITH TIME ZONE NULL, -- Data de Admissão
    data_desligamento TIMESTAMP WITH TIME ZONE NULL -- Data de Desligamento
);

-- Criação de índices para melhor performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);

-- Índice para a tabela de itens
CREATE INDEX idx_items_codigo ON items(codigo);
CREATE INDEX idx_items_status ON items(status);

-- Função para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar o updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar o updated_at da tabela items
CREATE TRIGGER update_items_updated_at
    BEFORE UPDATE ON items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Criação da tabela de histórico de salários
CREATE TABLE salary_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    valor_anterior DECIMAL(10,2) NOT NULL,
    valor_novo DECIMAL(10,2) NOT NULL,
    data_alteracao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    motivo TEXT NOT NULL,
    usuario_alteracao UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhor performance
CREATE INDEX idx_salary_history_employee_id ON salary_history(employee_id);
CREATE INDEX idx_salary_history_data_alteracao ON salary_history(data_alteracao);

-- Criar função para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar o updated_at
CREATE TRIGGER update_salary_history_updated_at
    BEFORE UPDATE ON salary_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Criar política de segurança RLS (Row Level Security)
ALTER TABLE salary_history ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para usuários autenticados
CREATE POLICY "Usuários autenticados podem ler histórico de salários"
    ON salary_history
    FOR SELECT
    TO authenticated
    USING (true);

-- Política para permitir inserção apenas para usuários autenticados
CREATE POLICY "Usuários autenticados podem inserir histórico de salários"
    ON salary_history
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Política para permitir atualização apenas para usuários autenticados
CREATE POLICY "Usuários autenticados podem atualizar histórico de salários"
    ON salary_history
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Política para permitir deleção apenas para usuários autenticados
CREATE POLICY "Usuários autenticados podem deletar histórico de salários"
    ON salary_history
    FOR DELETE
    TO authenticated
    USING (true); 