// Script para verificar a estrutura da tabela companies no Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do cliente Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: As variáveis de ambiente REACT_APP_SUPABASE_URL e REACT_APP_SUPABASE_ANON_KEY são necessárias.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCompaniesTable() {
  try {
    // Verificar se a tabela existe
    const { data: tableExists, error: tableError } = await supabase
      .rpc('table_exists', { table_name: 'companies' });
    
    if (tableError) throw tableError;
    
    if (!tableExists) {
      console.error('Erro: A tabela "companies" não existe no banco de dados.');
      return;
    }
    
    // Obter informações sobre as colunas da tabela
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('*')
      .eq('table_name', 'companies');
      
    if (columnsError) throw columnsError;
    
    console.log('Estrutura da tabela companies:');
    console.table(columns.map(col => ({
      column_name: col.column_name,
      data_type: col.data_type,
      is_nullable: col.is_nullable,
      column_default: col.column_default
    })));
    
    // Verificar restrições da tabela
    const { data: constraints, error: constraintsError } = await supabase
      .from('information_schema.table_constraints')
      .select('*')
      .eq('table_name', 'companies');
      
    if (constraintsError) throw constraintsError;
    
    console.log('\nRestrições da tabela companies:');
    console.table(constraints);
    
    // Verificar chaves estrangeiras
    const { data: foreignKeys, error: fkError } = await supabase
      .from('information_schema.key_column_usage')
      .select('*')
      .eq('table_name', 'companies');
      
    if (fkError) throw fkError;
    
    console.log('\nChaves estrangeiras da tabela companies:');
    console.table(foreignKeys);
    
  } catch (error) {
    console.error('Erro ao verificar a estrutura da tabela companies:', error);
  }
}

checkCompaniesTable();
