import { supabase } from '../src/lib/supabase'
import fs from 'fs'
import path from 'path'

async function setupDatabase() {
  try {
    // Lê o arquivo setup.sql
    const schemaPath = path.join(process.cwd(), 'setup.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')

    // Divide o schema em comandos individuais
    const commands = schema
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0)

    // Executa cada comando individualmente
    for (const cmd of commands) {
      try {
        // Tenta executar o comando via API REST
        const { error } = await supabase
          .from('items')
          .select('*')
          .limit(1)
          .then(() => {
            console.log(`Tabela já existe: ${cmd.substring(0, 50)}...`)
            return { error: null }
          })
          .catch(async () => {
            // Se a tabela não existe, tenta criar
            const response = await fetch(`${supabase.supabaseUrl}/rest/v1/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabase.supabaseKey,
                'Authorization': `Bearer ${supabase.supabaseKey}`
              },
              body: JSON.stringify({ query: cmd })
            })

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }

            return { error: null }
          })

        if (error) {
          console.error(`Erro ao executar comando: ${cmd}`)
          console.error('Erro:', error)
          continue
        }
        
        console.log(`Comando executado com sucesso: ${cmd.substring(0, 50)}...`)
      } catch (error) {
        console.error(`Erro ao executar comando: ${cmd}`)
        console.error('Erro:', error)
      }
    }

    console.log('Setup do banco de dados concluído!')
  } catch (error) {
    console.error('Erro ao configurar o banco de dados:', error)
  }
}

setupDatabase() 