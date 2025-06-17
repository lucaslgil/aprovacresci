import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { FaUser, FaFileExcel, FaUpload, FaArrowLeft, FaExclamationTriangle, FaCheckCircle, FaFileDownload } from 'react-icons/fa';
import { databaseService } from '../../services/database';

interface ImportedEmployee {
  nome: string;
  cpf: string;
  email: string;
  telefone: string | null; // Alterado para aceitar null
  cargo: string;
  setor: string;
  salario: number | null;
  data_admissao: string;
  data_desligamento?: string | null;
  status: 'ativo' | 'inativo';
  company_id?: string;
}

export function ImportEmployees() {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ImportedEmployee[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);

  const [fileContent, setFileContent] = useState<ArrayBuffer | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError('');
    setSuccess('');
    setPreview([]); // Limpa a pré-visualização anterior
    setFileContent(null); // Limpa o conteúdo do arquivo anterior

    console.log('=== ARQUIVO SELECIONADO ===');
    console.log('Nome do arquivo:', selectedFile.name);
    console.log('Tipo MIME:', selectedFile.type);

    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !['xlsx', 'xls'].includes(fileExtension)) {
      setError('Por favor, selecione um arquivo Excel válido (.xlsx ou .xls)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        console.log('Arquivo carregado com sucesso:', selectedFile.name);
        setFileContent(e.target.result as ArrayBuffer);
      }
    };
    
    reader.onerror = () => {
      console.error('Erro ao ler o arquivo');
      setError('Erro ao ler o arquivo. Tente novamente.');
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  // Função para processar o arquivo e exibir a pré-visualização
  const handleProcessFile = async () => {
    if (!fileContent) {
      setError('Nenhum arquivo carregado');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('=== INÍCIO DO PROCESSAMENTO ===');
      console.log('Processando planilha XLSX...');
      
      const workbook = XLSX.read(fileContent, { 
        type: 'array',
        cellDates: true,
        dateNF: 'dd/mm/yyyy'
      });
      
      console.log('Planilhas encontradas:', workbook.SheetNames);
      const firstSheetName = workbook.SheetNames[0];
      console.log('Usando planilha:', firstSheetName);
      
      const worksheet = workbook.Sheets[firstSheetName];
      console.log('Convertendo planilha para JSON...');
      
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
        raw: false,
        dateNF: 'dd/mm/yyyy',
        defval: ''
      });

      console.log('Dados brutos da planilha:', jsonData);

      if (jsonData.length === 0) {
        throw new Error('A planilha está vazia');
      }

      // Mapear os dados para o formato esperado
      const mappedData = jsonData
        .filter((row) => {
          // Filtra linhas vazias
          const hasData = Object.values(row).some(val => val != null && val !== '');
          if (!hasData) {
            console.log('Linha vazia encontrada, pulando...');
          }
          return hasData;
        })
        .map((row, rowIndex) => {
          // Processa cada linha válida
          const processedRow: ImportedEmployee = {
            nome: row['Nome']?.toString().trim() || 'Não informado',
            cpf: row['CPF'] ? String(row['CPF']).replace(/\D/g, '') : '',
            email: row['E-mail']?.toString().trim() || '',
            telefone: row['Telefone'] ? String(row['Telefone']).replace(/\D/g, '') : null,
            cargo: row['Cargo']?.toString().trim() || 'Não informado',
            setor: row['Setor']?.toString().trim() || 'Não informado',
            salario: row['Salário'] ? 
              parseFloat(String(row['Salário']).replace(/[^\d,]/g, '').replace(',', '.')) : 
              null,
            data_admissao: row['Data de Admissão']?.toString().trim() || '',
            data_desligamento: row['Data de Desligamento']?.toString().trim() || null,
            status: (row['Status'] && String(row['Status']).toLowerCase() === 'inativo') ? 'inativo' : 'ativo'
          };
          
          console.log(`Linha ${rowIndex + 2} processada:`, processedRow);
          return processedRow;
        });

      console.log('Dados mapeados para pré-visualização:', mappedData);
      setPreview(mappedData);
      
    } catch (err) {
      console.error('Erro ao processar o arquivo:', err);
      setError(`Erro ao processar o arquivo: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    console.log('Iniciando importação...');
    if (preview.length === 0) {
      const errorMsg = 'Nenhum dado para importar. Por favor, carregue e processe o arquivo primeiro.';
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    // Validar campos obrigatórios e formatar dados
    const errors: string[] = [];
    const cpfSet = new Set<string>();
    const emailSet = new Set<string>();
    console.log('Validando dados dos funcionários...');
    
    const employeesToImport = preview.map((row, index) => {
      // Validações
      if (!row.cpf || row.cpf.trim() === '') {
        errors.push(`Linha ${index + 2}: CPF é obrigatório`);
      } else if (row.cpf.length !== 11) {
        errors.push(`Linha ${index + 2}: CPF deve ter 11 dígitos`);
      } else if (cpfSet.has(row.cpf)) {
        errors.push(`Linha ${index + 2}: CPF ${row.cpf} está duplicado no arquivo`);
      } else {
        cpfSet.add(row.cpf);
      }
      
      // Validação de e-mail
      if (row.email) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
          errors.push(`Linha ${index + 2}: E-mail inválido`);
        } else if (emailSet.has(row.email.toLowerCase())) {
          errors.push(`Linha ${index + 2}: E-mail ${row.email} já está em uso por outro funcionário`);
        } else {
          emailSet.add(row.email.toLowerCase());
        }
      }
      
      // Validação de salário
      if (row.salario !== null && row.salario !== undefined) {
        if (isNaN(Number(row.salario)) || Number(row.salario) < 0) {
          errors.push(`Linha ${index + 2}: Salário inválido`);
        } else if (Number(row.salario) > 1000000) {
          errors.push(`Linha ${index + 2}: Salário excede o valor máximo permitido (R$ 1.000.000,00)`);
        }
      }

      // Função para converter data para o formato YYYY-MM-DD
      const formatDateForDB = (dateInput: any): string | null => {
        console.log('\n=== formatDateForDB ===');
        console.log('Entrada:', dateInput, 'Tipo:', typeof dateInput);
        
        if (!dateInput) {
          console.log('Data vazia, retornando null');
          return null;
        }
        
        try {
          // Se for um número (data serial do Excel)
          if (typeof dateInput === 'number') {
            console.log('Convertendo de número serial do Excel');
            const date = XLSX.SSF.parse_date_code(dateInput);
            if (date) {
              const formatted = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
              console.log('Data convertida do Excel:', formatted);
              return formatted;
            }
          }
          
          // Se for um objeto Date
          if (dateInput instanceof Date) {
            const formatted = dateInput.toISOString().split('T')[0];
            console.log('Convertido de objeto Date:', formatted);
            return formatted;
          }
          
          // Se for uma string
          const dateStr = String(dateInput).trim();
          console.log('Processando string de data:', dateStr);
          
          // Se já estiver no formato YYYY-MM-DD, retorna direto
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            console.log('Já está no formato YYYY-MM-DD');
            return dateStr;
          }
          
          // Tentar converter de DD/MM/YYYY para YYYY-MM-DD (com / ou - como separador)
          const dateMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
          if (dateMatch) {
            const day = dateMatch[1].padStart(2, '0');
            const month = dateMatch[2].padStart(2, '0');
            const year = dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3];
            const formatted = `${year}-${month}-${day}`;
            console.log('Data convertida de DD/MM/YYYY para YYYY-MM-DD:', formatted);
            return formatted;
          }
          
          // Tentar converter de YYYY/MM/DD para YYYY-MM-DD
          const isoMatch = dateStr.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
          if (isoMatch) {
            const year = isoMatch[1];
            const month = isoMatch[2].padStart(2, '0');
            const day = isoMatch[3].padStart(2, '0');
            const formatted = `${year}-${month}-${day}`;
            console.log('Data convertida de YYYY/MM/DD para YYYY-MM-DD:', formatted);
            return formatted;
          }
          
          // Tentar converter de timestamp (se for o caso)
          if (/^\d+$/.test(dateStr)) {
            const date = new Date(parseInt(dateStr));
            if (!isNaN(date.getTime())) {
              const formatted = date.toISOString().split('T')[0];
              console.log('Convertido de timestamp para YYYY-MM-DD:', formatted);
              return formatted;
            }
          }
          
          console.error('Formato de data não reconhecido:', dateStr);
          return null;
          
        } catch (e) {
          console.error('Erro ao formatar data:', e);
          return null;
        }
      };
      
      // Processar data de admissão
      let dataAdmissao: string | null = null;
      
      // Primeiro, tenta converter diretamente do valor bruto
      if (row.data_admissao) {
        // Se for uma string no formato DD/MM/YYYY
        if (typeof row.data_admissao === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(row.data_admissao)) {
          const [day, month, year] = row.data_admissao.split('/');
          dataAdmissao = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          console.log('Data de admissão convertida diretamente de DD/MM/YYYY:', dataAdmissao);
        } else {
          // Tenta outros formatos usando a função formatDateForDB
          dataAdmissao = formatDateForDB(row.data_admissao);
        }
      }
      
      // Garante que a data esteja no formato YYYY-MM-DD sem informações de timezone
      if (dataAdmissao) {
        // Remove qualquer informação de timezone e hora, mantendo apenas a data
        dataAdmissao = dataAdmissao.split('T')[0];
        console.log('Data de admissão formatada para envio:', dataAdmissao);
      } else {
        errors.push(`Linha ${index + 2}: Data de admissão inválida ou não informada (formato esperado: DD/MM/YYYY)`);
        console.error('Falha ao processar data de admissão. Valor original:', row.data_admissao, 'Tipo:', typeof row.data_admissao);
      }
      
      // Processar data de desligamento (pode ser nula)
      const dataDesligamento = row.data_desligamento ? formatDateForDB(row.data_desligamento) : null;
      
      console.log('\n=== Datas processadas ===');
      console.log('Data de admissão:', { 
        original: row.data_admissao, 
        tipoOriginal: typeof row.data_admissao,
        processada: dataAdmissao 
      });
      
      if (row.data_desligamento) {
        console.log('Data de desligamento:', { 
          original: row.data_desligamento, 
          tipoOriginal: typeof row.data_desligamento,
          processada: dataDesligamento 
        });
      }

      // Dados do funcionário para envio à API
      const employeeData = {
        nome: row.nome || 'Não informado',
        cpf: row.cpf,
        email: row.email || `${row.cpf}@empresa.com`,
        telefone: row.telefone || undefined,
        cargo: row.cargo || 'Não informado',
        setor: row.setor || 'Não informado',
        salario: row.salario || null,
        dataAdmissao: dataAdmissao || null,
        dataDesligamento: dataDesligamento || null,
        status: (row.status as 'ativo' | 'inativo') || 'ativo',
        itensVinculados: []
      };
      
      console.log('Dados do funcionário formatados para envio:', {
        ...employeeData,
        dataAdmissao: employeeData.dataAdmissao || 'Não informada',
        dataDesligamento: employeeData.dataDesligamento || 'Não informada',
        salario: employeeData.salario || 'Não informado'
      });
      
      console.log('Dados do funcionário a serem enviados:', {
        ...employeeData,
        // Garante que as datas sejam mostradas corretamente no log
        dataAdmissao: employeeData.dataAdmissao || 'Não informada',
        dataDesligamento: employeeData.dataDesligamento || 'Não informada'
      });
      return employeeData;
    });

    if (errors.length > 0) {
      const errorMsg = `Encontrados ${errors.length} erro(s) de validação`;
      console.error(errorMsg, errors);
      // Limita a exibição para os primeiros 10 erros para não sobrecarregar a UI
      const maxErrorsToShow = 10;
      const errorsToShow = errors.length > maxErrorsToShow 
        ? [...errors.slice(0, maxErrorsToShow), `...e mais ${errors.length - maxErrorsToShow} erros`]
        : errors;
      
      setError(`Corrija os seguintes erros para continuar:\n\n${errorsToShow.join('\n')}`);
      
      // Rola para o topo para mostrar os erros
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      console.log('Iniciando envio dos dados para a API...');
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Contadores para relatório
      let successCount = 0;
      const errorDetails: string[] = [];
      
      // Processar um por um para melhor rastreamento
      for (let i = 0; i < employeesToImport.length; i++) {
        const emp = employeesToImport[i];
        const currentIndex = i + 1;
        const total = employeesToImport.length;
        
        console.log(`Processando funcionário ${currentIndex}/${total}:`, {
          ...emp,
          // Garante que as datas sejam mostradas corretamente no log
          dataAdmissao: emp.dataAdmissao || 'Não informada',
          dataDesligamento: emp.dataDesligamento || 'Não informada'
        });
        
        try {
          // Atualiza o status de carregamento para mostrar o progresso
          setSuccess(`Importando funcionários... (${currentIndex}/${total})`);
          
          const result = await databaseService.employees.create(emp);
          console.log(`Funcionário ${currentIndex} importado com sucesso:`, {
            ...result,
            // Garante que as datas sejam mostradas corretamente no log
            dataAdmissao: result.dataAdmissao || 'Não informada',
            dataDesligamento: result.dataDesligamento || 'Não informada'
          });
          successCount++;
          
          // Pequeno delay para não sobrecarregar a API
          if (currentIndex < total) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
        } catch (error: any) {
          console.error(`Erro ao importar funcionário ${currentIndex}:`, error);
          const errorMessage = error?.message || 'Erro desconhecido';
          errorDetails.push(`Linha ${currentIndex + 1} (${emp.nome || 'Sem nome'}): ${errorMessage}`);
          
          // Se for um erro de duplicação, continuar para o próximo
          if (errorMessage.includes('já existe') || errorMessage.includes('já está em uso')) {
            continue;
          }
          
          // Para outros erros, o usuário decide se continua
          const shouldContinue = window.confirm(
            `Erro ao importar funcionário ${currentIndex}/${total}: ${errorMessage}\n\n` +
            'Deseja continuar com os demais registros?'
          );
          
          if (!shouldContinue) {
            throw new Error('Importação interrompida pelo usuário');
          }
        }
      }
      
      // Monta mensagem de sucesso com resumo
      let successMsg = `Importação concluída com sucesso!\n`;
      successMsg += `• ${successCount} de ${employeesToImport.length} funcionários importados`;
      
      if (errorDetails.length > 0) {
        successMsg += `\n\n${errorDetails.length} registro(s) com erro:\n`;
        successMsg += errorDetails.slice(0, 5).join('\n');
        if (errorDetails.length > 5) {
          successMsg += `\n...e mais ${errorDetails.length - 5} erro(s)`;
        }
      }
      
      console.log(successMsg);
      setSuccess(successMsg);
      setPreview([]);
      
      // Rola para o topo para mostrar a mensagem de sucesso
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const error = err as Error;
      let errorMsg = 'Erro ao importar funcionários';
      
      if (error.message === 'Importação interrompida pelo usuário') {
        errorMsg = 'Importação interrompida pelo usuário. Alguns registros podem ter sido importados.';
      } else {
        errorMsg = `Erro na importação: ${error.message || 'Erro desconhecido'}`;
      }
      
      console.error(errorMsg, error);
      setError(`${errorMsg}. Verifique o console para mais detalhes.`);
      
      // Rola para o topo para mostrar a mensagem de erro
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
      
      // Limpa o arquivo após a importação (seja sucesso ou erro)
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      setFileContent(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setIsGeneratingTemplate(true);
      const response = await fetch('/modelo_importacao_colaboradores.xlsx');
      if (!response.ok) throw new Error('Falha ao baixar o modelo');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'modelo_importacao_colaboradores.xlsx';
      document.body.appendChild(a);
      a.click();
      
      // Limpar
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      setError('Erro ao baixar o modelo. Por favor, tente novamente.');
      console.error('Erro ao baixar o modelo:', err);
    } finally {
      setIsGeneratingTemplate(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FaUser className="h-8 w-8 text-indigo-600 mr-3" />
              Importar Colaboradores
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Importe uma lista de colaboradores a partir de um arquivo CSV.
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link
              to="/employees"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FaArrowLeft className="h-4 w-4 mr-2" />
              Voltar para a lista
            </Link>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              disabled={isGeneratingTemplate}
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaFileDownload className="h-4 w-4 mr-2" />
              {isGeneratingTemplate ? 'Gerando...' : 'Baixar Modelo'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 shadow-sm">
            <div className="flex items-center">
              <FaExclamationTriangle className="h-5 w-5 text-red-500 mr-3" />
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 shadow-sm">
            <div className="flex items-center">
              <FaCheckCircle className="h-5 w-5 text-green-500 mr-3" />
              <h3 className="text-sm font-medium text-green-800">{success}</h3>
            </div>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecione o arquivo CSV
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <FaFileExcel className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                  >
                    <span>Enviar um arquivo</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1">ou arraste e solte</p>
                </div>
                <p className="text-xs text-gray-500">
                  Excel (.xlsx, .xls) até 10MB
                </p>
                {fileContent && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={handleProcessFile}
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processando...
                        </>
                      ) : (
                        <>
                          <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                          </svg>
                          Visualizar Dados
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Faça o download do{' '}
              <a
                href="/modelo_importacao_colaboradores.xlsx"
                download
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                modelo de planilha
              </a>{' '}
              para garantir o formato correto.
            </p>
          </div>

          {preview.length > 0 && (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Pré-visualização ({preview.length} colaboradores)
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nome
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          CPF
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cargo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Setor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {preview.slice(0, 5).map((emp, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {emp.nome}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {emp.cpf ? emp.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : 'Não informado'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {emp.cargo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {emp.setor}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${emp.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {emp.status === 'ativo' ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {preview.length > 5 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-2 text-center text-sm text-gray-500">
                            + {preview.length - 5} colaboradores não exibidos
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaUpload className="h-4 w-4 mr-2" />
                  {loading ? 'Importando...' : 'Confirmar Importação'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
