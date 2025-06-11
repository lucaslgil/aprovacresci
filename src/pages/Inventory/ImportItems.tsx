import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBox, FaFileExcel, FaUpload, FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';

import * as XLSX from 'xlsx';
import { databaseService } from '../../services/database';

interface ImportedItem {
  codigo: string;
  item: string;
  modelo: string | null;
  numero_serie: string | null;
  detalhes: string | null;
  nota_fiscal: string | null;
  supplier_id: string | null;
  setor: string | null;
  responsavel: string | null;
  status: string;
}

export function ImportItems() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ImportedItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.match(/\.(xls|xlsx)$/)) {
      setError('Por favor, selecione um arquivo Excel válido (.xls ou .xlsx)');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Ler o arquivo Excel
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        // Mapear os dados do Excel para o formato do nosso sistema
        const mappedData = jsonData.map((row: any) => ({
          codigo: row['Código']?.toString() || '',
          item: row['Item']?.toString() || '',
          modelo: row['Modelo']?.toString() || null,
          numero_serie: row['Número de Série']?.toString() || null,
          detalhes: row['Detalhes']?.toString() || null,
          nota_fiscal: row['Nota Fiscal']?.toString() || null,
          supplier_id: null, // Será tratado posteriormente
          setor: row['Setor']?.toString() || null,
          responsavel: row['Responsável']?.toString() || null,
          status: row['Status']?.toString() || 'Em Estoque'
        }));

        setPreview(mappedData);
      } catch (err) {
        setError('Erro ao ler o arquivo Excel. Verifique se o formato está correto.');
        console.error('Erro ao ler arquivo:', err);
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const handleImport = async () => {
    if (!preview.length) {
      setError('Nenhum dado para importar');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Validar dados antes de importar
      // const invalidItems = preview.filter(item => !item.codigo || !item.item);
      // if (invalidItems.length > 0) {
      //   setError(`Existem ${invalidItems.length} itens sem código ou nome. Por favor, corrija os dados antes de importar.`);
      //   return;
      // }

      // Importar os itens
      for (const item of preview) {
        await databaseService.items.create(item);
      }

      ;
      setPreview([]);
      setFile(null);
    } catch (err) {
      console.error('Erro na importação:', err);
      setError('Erro ao importar os dados. Verifique se os códigos são únicos e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FaBox className="h-8 w-8 text-indigo-600 mr-3" />
              Importar Itens
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Importe seus itens através de uma planilha Excel.
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link
              to="/inventory"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FaArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
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

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-6">
              {/* Área de Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FaFileExcel className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <FaUpload className="h-4 w-4 mr-2" />
                    Selecionar Arquivo
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".xls,.xlsx"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    {file ? file.name : 'Nenhum arquivo selecionado'}
                  </p>
                  <div className="mt-4 text-sm text-gray-500">
                    <p className="font-medium mb-2">Formato do arquivo Excel:</p>
                    <p>O arquivo deve conter as seguintes colunas no cabeçalho:</p>
                    <ul className="list-disc list-inside mt-2 text-left max-w-md mx-auto">
                      <li>Código (obrigatório)</li>
                      <li>Item (obrigatório)</li>
                      <li>Modelo</li>
                      <li>Número de Série</li>
                      <li>Detalhes</li>
                      <li>Nota Fiscal</li>
                      <li>Setor</li>
                      <li>Responsável</li>
                      <li>Status (padrão: "Em Estoque")</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Preview dos Dados */}
              {preview.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Preview dos Dados ({preview.length} itens)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Código
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Modelo
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
                        {preview.slice(0, 5).map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.codigo}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.item}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.modelo || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.setor || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.status}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {preview.length > 5 && (
                      <p className="mt-2 text-sm text-gray-500 text-center">
                        Mostrando 5 de {preview.length} itens
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Botão de Importar */}
              {preview.length > 0 && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Importando...' : 'Importar Dados'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 