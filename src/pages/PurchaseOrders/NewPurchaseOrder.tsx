import React, { useState, useEffect, useMemo } from 'react';
import { databaseService, PurchaseOrder, Supplier } from '../../services/database';
import { useNavigate } from 'react-router-dom';

import {
  FaShoppingCart,
  FaUser, // Para Solicitante e Usuário
  FaClipboardList, // Para Descrição
  FaTruck, // Para Fornecedor
  FaDollarSign, // Para Valor
  FaCalendarAlt, // Para Data
  FaSave,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
} from 'react-icons/fa';

interface FormData {
  solicitante: string;
  descricao: string;
  supplier_id: string | null;
  valor: number | null;
  data_solicitacao: string;
}

export function NewPurchaseOrder() {
  const navigate = useNavigate();
  
  // Get current date in YYYY-MM-DD format
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  const currentDate = `${year}-${month}-${day}`;

  const [formData, setFormData] = useState<FormData>({
    solicitante: '',
    descricao: '',
    supplier_id: null,
    valor: null,
    data_solicitacao: currentDate,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierLoading, setSupplierLoading] = useState(true);
  const [supplierText, setSupplierText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setSupplierLoading(true);
        const suppliersData = await databaseService.suppliers.getAll();
        setSuppliers(suppliersData);
      } catch (error: any) {
        ;
      } finally {
        setSupplierLoading(false);
      }
    };
    fetchSuppliers();
  }, []);

  const filteredSuppliers = useMemo(() => {
    if (!supplierText) return [];
    const lowerCaseText = supplierText.toLowerCase();
    return suppliers.filter(supplier =>
      (supplier.nome_fantasia?.toLowerCase().includes(lowerCaseText) ||
      supplier.razao_social.toLowerCase().includes(lowerCaseText) ||
      supplier.cnpj?.toLowerCase().includes(lowerCaseText))
    );
  }, [supplierText, suppliers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let updatedValue: string | number | null = value;

    if (name === 'valor') {
       updatedValue = parseFloat(value.replace(',', '.'));
       if (isNaN(updatedValue)) updatedValue = null;
    } else if (value === '') {
        updatedValue = null;
    }

    setFormData({ ...formData, [name]: updatedValue });
  };

  const handleSupplierTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setSupplierText(value);
    setFormData(prevData => ({ ...prevData, supplier_id: null }));
    setShowSuggestions(true);
  };

  const handleSupplierSelect = (supplier: Supplier) => {
    setSupplierText(supplier.nome_fantasia || supplier.razao_social || '');
    setFormData(prevData => ({ ...prevData, supplier_id: supplier.id }));
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.solicitante || !formData.descricao || !formData.data_solicitacao) {
      setError('Por favor, preencha os campos obrigatórios: Solicitante, Descrição e Data Solicitação.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const newOrder: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at' | 'suppliers'> = {
        solicitante: formData.solicitante,
        descricao: formData.descricao,
        supplier_id: formData.supplier_id,
        valor: formData.valor,
        data_solicitacao: formData.data_solicitacao,
        data_aprovacao: null,
        status: 'Aguardando aprovação',
        user_id: 'seu_user_id_aqui',
      };

      await databaseService.purchaseOrders.create(newOrder as PurchaseOrder);
      
      setSuccess('Ordem de compra salva com sucesso!');
      setTimeout(() => {
        navigate('/purchase-orders/approve');
      }, 2000);
    } catch (err) {
      console.error('Erro detalhado ao salvar ordem de compra:', err);
      setError('Erro ao salvar ordem de compra. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/purchase-orders/approve');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FaShoppingCart className="h-8 w-8 text-indigo-600 mr-3" />
              Nova Ordem de Compra
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Preencha os dados abaixo para criar uma nova ordem de compra.
            </p>
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

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white shadow-lg rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">

                {/* Solicitante */}
                <div className="sm:col-span-3">
                  <label htmlFor="solicitante" className="block text-sm font-medium text-gray-700 mb-1">
                    Solicitante
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="h-5 w-5 text-indigo-500" />
                    </div>
                    <input
                      type="text"
                      name="solicitante"
                      id="solicitante"
                      required
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-base"
                      placeholder="Nome do solicitante"
                      value={formData.solicitante}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                 {/* Data Solicitação */}
                 <div className="sm:col-span-3">
                  <label htmlFor="data_solicitacao" className="block text-sm font-medium text-gray-700 mb-1">
                    Data Solicitação
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaCalendarAlt className="h-5 w-5 text-indigo-500" />
                    </div>
                    <input
                      type="date"
                      name="data_solicitacao"
                      id="data_solicitacao"
                      required
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-base"
                      value={formData.data_solicitacao}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Descrição */}
                <div className="sm:col-span-6">
                  <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                      <FaClipboardList className="h-5 w-5 text-indigo-500" />
                    </div>
                    <textarea
                      id="descricao"
                      name="descricao"
                      rows={3}
                      required
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-base"
                      placeholder="Detalhes da ordem de compra"
                      value={formData.descricao}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Fornecedor (Text input with suggestions) */}
                <div className="sm:col-span-3">
                  <label htmlFor="supplier_text" className="block text-sm font-medium text-gray-700 mb-1">
                    Fornecedor (Opcional)
                  </label>
                  <div className="relative rounded-md shadow-sm z-50">
                    {supplierLoading ? (
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        Carregando fornecedores...
                      </span>
                    ) : (
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaTruck className="h-5 w-5 text-indigo-500" />
                      </div>
                    )}
                    <input
                      type="text"
                      name="supplier_text"
                      id="supplier_text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-base"
                      placeholder="Nome do fornecedor (Opcional)"
                      value={supplierText}
                      onChange={handleSupplierTextChange}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
                      autoComplete="off"
                    />

                    {showSuggestions && filteredSuppliers.length > 0 && (
                      <ul className="absolute z-50 mt-0 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                        {filteredSuppliers.map((supplier) => (
                          <li
                            key={supplier.id}
                            className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 hover:bg-indigo-600 hover:text-white"
                            onClick={() => handleSupplierSelect(supplier)}
                          >
                            {supplier.nome_fantasia || supplier.razao_social}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Valor */}
                <div className="sm:col-span-3">
                  <label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-1">
                    Valor (Opcional)
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaDollarSign className="h-5 w-5 text-indigo-500" />
                    </div>
                    <input
                      type="number"
                      name="valor"
                      id="valor"
                      step="0.01"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-base"
                      placeholder="Ex: 150.75"
                      value={formData.valor || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FaTimes className="h-4 w-4 mr-2 text-gray-500" />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.solicitante || !formData.descricao || !formData.data_solicitacao}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaSave className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar Ordem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 