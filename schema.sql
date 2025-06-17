-- Habilita a extensão pgcrypto para usar gen_random_uuid() se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "public";

-- Função para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tabela de usuários (mantida do schema original)
CREATE TABLE public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE TRIGGER on_users_updated
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Tabela de perfis (mantida do schema original)
CREATE TABLE public.profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    full_name VARCHAR,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE TRIGGER on_profiles_updated
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Tabela de projetos (mantida do schema original)
CREATE TABLE public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE TRIGGER on_projects_updated
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Tabela de tarefas (mantida do schema original)
CREATE TABLE public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR NOT NULL,
    description TEXT,
    status VARCHAR NOT NULL DEFAULT 'pending',
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE TRIGGER on_tasks_updated
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Tabela de itens (mantida do schema original)
CREATE TABLE public.items (
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
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_items_codigo ON public.items(codigo);
CREATE INDEX idx_items_status ON public.items(status);
CREATE TRIGGER on_items_updated
BEFORE UPDATE ON public.items
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- Tabela de funcionários (ATUALIZADA)
CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_completo TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    cpf TEXT NOT NULL UNIQUE,
    data_nascimento DATE,
    data_admissao DATE NOT NULL,
    cargo TEXT,
    departamento TEXT,
    setor TEXT,
    endereco TEXT,
    cidade TEXT,
    estado TEXT,
    cep TEXT,
    telefone TEXT,
    salario_inicial NUMERIC(10, 2) NOT NULL,
    salario_atual NUMERIC(10, 2) NOT NULL,
    status TEXT DEFAULT 'Ativo' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.employees IS 'Tabela contendo as informações dos funcionários.';
CREATE TRIGGER on_employees_updated
BEFORE UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Tabela de histórico de salários (Corrigida conforme feedback)
CREATE TABLE public.salary_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    valor_anterior NUMERIC(10, 2) NOT NULL,
    valor_novo NUMERIC(10, 2) NOT NULL,
    data_alteracao TIMESTAMPTZ NOT NULL DEFAULT now(),
    motivo TEXT NOT NULL,
    usuario_alteracao UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.salary_history IS 'Histórico de alterações salariais dos funcionários.';
CREATE INDEX idx_salary_history_employee_id ON public.salary_history(employee_id);
CREATE TRIGGER on_salary_history_updated
BEFORE UPDATE ON public.salary_history
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- --- Políticas de Segurança (Row Level Security) ---
-- Habilitar RLS em todas as tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_history ENABLE ROW LEVEL SECURITY;

-- Políticas de Exemplo: Permitir acesso total a usuários autenticados.
-- ATENÇÃO: Ajuste estas regras para corresponder às suas necessidades de segurança.
CREATE POLICY "Allow full access to authenticated users on users" ON public.users FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users on profiles" ON public.profiles FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users on projects" ON public.projects FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users on tasks" ON public.tasks FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users on items" ON public.items FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users on employees" ON public.employees FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users on salary_history" ON public.salary_history FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');