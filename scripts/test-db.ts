import { supabase } from '../src/lib/supabase'

async function testDatabase() {
  try {
    // Testa a inserção de um item
    const { data, error } = await supabase
      .from('items')
      .insert([
        {
          codigo: 'TEST001',
          item: 'Item de Teste',
          status: 'Ativo'
        }
      ])
      .select()

    if (error) {
      console.error('Erro ao inserir item:', error)
      return
    }

    console.log('Item inserido com sucesso:', data)

    // Testa a leitura dos itens
    const { data: items, error: readError } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false })

    if (readError) {
      console.error('Erro ao ler itens:', readError)
      return
    }

    console.log('Itens encontrados:', items)
  } catch (error) {
    console.error('Erro ao testar banco de dados:', error)
  }
}

testDatabase() 