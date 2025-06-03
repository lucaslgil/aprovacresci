-- Função para executar SQL dinamicamente
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS void AS $$
BEGIN
  EXECUTE query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tabela para executar SQL via API
CREATE TABLE IF NOT EXISTS _exec_sql (
  id SERIAL PRIMARY KEY,
  query TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Trigger para executar SQL quando um registro é inserido
CREATE OR REPLACE FUNCTION _exec_sql_trigger()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM exec_sql(NEW.query);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar o trigger
DROP TRIGGER IF EXISTS _exec_sql_trigger ON _exec_sql;
CREATE TRIGGER _exec_sql_trigger
  AFTER INSERT ON _exec_sql
  FOR EACH ROW
  EXECUTE FUNCTION _exec_sql_trigger();

-- Políticas de segurança
ALTER TABLE _exec_sql ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir execução de SQL para usuários autenticados"
  ON _exec_sql
  FOR INSERT
  TO authenticated
  WITH CHECK (true); 