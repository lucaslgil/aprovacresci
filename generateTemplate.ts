import { generateEmployeeTemplate } from './src/utils/generateEmployeeTemplate';

async function main() {
  console.log('Iniciando geração do modelo de importação de colaboradores...');
  const success = await generateEmployeeTemplate();
  process.exit(success ? 0 : 1);
}

main().catch(error => {
  console.error('Erro ao gerar o modelo:', error);
  process.exit(1);
});
