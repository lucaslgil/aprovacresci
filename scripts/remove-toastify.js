import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diretório raiz do projeto
const rootDir = path.join(__dirname, '..', 'src');

// Função para processar um arquivo
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Remover importações do toastify
    const importRegex = /import\s*\{?\s*toast\s*\}?\s*from\s*['"]react-toastify['"];?\n?/g;
    if (importRegex.test(content)) {
      content = content.replace(importRegex, '');
      modified = true;
    }

    // Remover chamadas toast.*
    const toastCallRegex = /\btoast\.(success|error|info|warning|warn|dark)\([^)]*\)/g;
    if (toastCallRegex.test(content)) {
      content = content.replace(toastCallRegex, '');
      modified = true;
    }

    // Salvar o arquivo se foi modificado
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Atualizado: ${path.relative(rootDir, filePath)}`);
    }
  } catch (error) {
    console.error(`Erro ao processar ${filePath}:`, error.message);
  }
}

// Função para percorrer diretórios recursivamente
function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  files.forEach(file => {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      processFile(fullPath);
    }
  });
}

// Iniciar o processo
console.log('Removendo referências ao Toastify...');
processDirectory(rootDir);
console.log('Remoção concluída!');

// Exportar as funções para testes ou uso externo
export { processFile, processDirectory };
