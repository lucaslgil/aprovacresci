import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

export async function generateEmployeeTemplate() {
  // Dados de exemplo
  const data = [
    // Cabeçalhos
    {
      'Nome': 'João da Silva',
      'CPF': '12345678901',
      'E-mail': 'joao.silva@empresa.com',
      'Telefone': '11999998888',
      'Cargo': 'Desenvolvedor',
      'Setor': 'TI',
      'Salário': 5000.00,
      'Data de Admissão': '01/01/2023',
      'Data de Desligamento': '',
      'Status': 'Ativo'
    },
    // Outro exemplo
    {
      'Nome': 'Maria Oliveira',
      'CPF': '98765432100',
      'E-mail': 'maria.oliveira@empresa.com',
      'Telefone': '11999997777',
      'Cargo': 'Analista de RH',
      'Setor': 'Recursos Humanos',
      'Salário': 4500.00,
      'Data de Admissão': '15/02/2023',
      'Data de Desligamento': '',
      'Status': 'Ativo'
    }
  ];
  
  try {
    // Criar uma nova pasta de trabalho
    const wb = XLSX.utils.book_new();
    
    // Converter os dados para uma planilha
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Adicionar a planilha à pasta de trabalho
    XLSX.utils.book_append_sheet(wb, ws, 'Colaboradores');
    
    // Criar a pasta public se não existir
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Salvar o arquivo XLSX
    const outputPath = path.join(publicDir, 'modelo_importacao_colaboradores.xlsx');
    XLSX.writeFile(wb, outputPath);
    
    console.log(`✅ Modelo gerado com sucesso em: ${outputPath}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao gerar o modelo:', error);
    return false;
  }
}
