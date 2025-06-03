import { supabase } from '../src/lib/supabase'
import fs from 'fs'
import path from 'path'

async function setupExecSql() {
  try {
    // Lê o arquivo create_exec_sql.sql
    const sqlPath = path.join(process.cwd(), 'scripts', 'create_exec_sql.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    // Executa o SQL diretamente via API REST
    const { error } = await supabase.rpc('exec_sql', { query: sql })

    if (error) {
      console.error('Erro ao configurar exec_sql:', error)
      return
    }

    console.log('Configuração do exec_sql concluída com sucesso!')
  } catch (error) {
    console.error('Erro ao configurar exec_sql:', error)
  }
}

setupExecSql() 