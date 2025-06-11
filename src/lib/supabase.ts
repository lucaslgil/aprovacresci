import { createClient } from '@supabase/supabase-js'

// Log para depuração
console.log('Variáveis de ambiente carregadas:');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '*** (chave presente)' : 'Não definida');

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: Variáveis de ambiente do Supabase não configuradas corretamente');
  console.error('Certifique-se de que o arquivo .env contém VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Teste de conexão
console.log('Inicializando cliente Supabase...');
console.log('URL do Supabase:', supabaseUrl);