import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { databaseService, Item, Supplier } from '../../services/database';
import {
  FaBox,
  FaExclamationTriangle,
  FaCheckCircle,
  FaArrowLeft,
  FaTruck,
  FaQrcode,
  FaFileAlt,
  FaBuilding,
  FaUser
} from 'react-icons/fa';

export function ItemForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<Omit<Item, 'id' | 'created_at' | 'updated_at' | 'suppliers'>>({
    codigo: '',
    item: '',
    modelo: null,
    numero_serie: null,
    detalhes: null,
    nota_fiscal: null,
    supplier_id: null,
    setor: null,
    responsavel: null,
    status: 'Disponível', // Status inicial padrão
    valor_aproximado: null,
    motivo_descarte: null, // Campo para motivo de descarte
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    if (isEditing && id) {
      loadItem(id);
    }
    loadSuppliers();
  }, [id, isEditing]);

  const loadItem = async (itemId: string) => {
    try {
      setLoading(true);
      const itemData = await databaseService.items.getById(itemId);
      if (itemData) {
        setFormData({
          codigo: itemData.codigo,
          item: itemData.item,
          modelo: itemData.modelo,
          numero_serie: itemData.numero_serie,
          detalhes: itemData.detalhes,
          nota_fiscal: itemData.nota_fiscal,
          supplier_id: itemData.supplier_id,
          setor: itemData.setor,
          responsavel: itemData.responsavel,
          status: itemData.status,
          valor_aproximado: itemData.valor_aproximado,
          motivo_descarte: itemData.motivo_descarte,
        });
      } else {
        setError('Item não encontrado.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Erro ao carregar item:', err);
      setError('Erro ao carregar dados do item. Tente novamente.');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const suppliersData = await databaseService.suppliers.getAll();
      setSuppliers(suppliersData);
    } catch (err) {
      console.error('Erro ao carregar fornecedores:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Basic validation (can be expanded)
      if (!formData.codigo || !formData.item || !formData.status) {
        setError('Código, Item e Status são obrigatórios.');
        setLoading(false);
        return;
      }

      // Check if code is unique only on creation or if code has changed on update
      if (!isEditing || (isEditing && id && (await databaseService.items.getById(id))?.codigo !== formData.codigo)) {
        const isUnique = await databaseService.items.isCodeUnique(formData.codigo);
        if (!isUnique) {
          setError('O código do item já existe. Por favor, use um código único.');
          setLoading(false);
          return;
        }
      }

      if (isEditing && id) {
        await databaseService.items.update(id, formData);
        setSuccess('Item atualizado com sucesso!');
      } else {
        await databaseService.items.create(formData);
        setSuccess('Item cadastrado com sucesso!');
      }
      navigate('/inventory');
    } catch (err) {
      console.error('Erro ao salvar item:', err);
      setError(`Erro ao salvar item: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : value, // Treat empty strings as null for optional fields
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Disponível':
        return 'bg-green-500';
      case 'Em Uso':
        return 'bg-blue-500';
      case 'Em Manutenção':
        return 'bg-yellow-500';
      case 'Descartado':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : parseFloat(value),
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate flex items-center">
              <FaBox className="h-8 w-8 text-indigo-600 mr-3" />
              {isEditing ? 'Editar Item' : 'Novo Item'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {isEditing ? 'Atualize os dados do item.' : 'Preencha os dados para cadastrar um novo item.'}
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              type="button"
              onClick={() => navigate('/inventory')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FaArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Lista
            </button>
          </div>
        </div>

        <div className="mb-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaExclamationTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaCheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">{success}</h3>
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="codigo" className="block text-sm font-medium text-gray-700 mb-1">
                    Código *
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaQrcode className="h-5 w-5 text-indigo-500" />
                    </div>
                    <input
                      type="text"
                      name="codigo"
                      id="codigo"
                      required
                      value={formData.codigo}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-base"
                      placeholder="Digite o código do item"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="item" className="block text-sm font-medium text-gray-700 mb-1">
                    Item *
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaBox className="h-4 w-4 text-indigo-500" />
                    </div>
                    <input
                      type="text"
                      name="item"
                      id="item"
                      required
                      value={formData.item}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-base"
                      placeholder="Digite o nome do item"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="modelo" className="block text-sm font-medium text-gray-700 mb-1">
                    Modelo
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaFileAlt className="h-5 w-5 text-indigo-500" />
                    </div>
                    <input
                      type="text"
                      name="modelo"
                      id="modelo"
                      value={formData.modelo || ''}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-base"
                      placeholder="Digite o modelo do item"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="numero_serie" className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Série
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaQrcode className="h-5 w-5 text-indigo-500" />
                    </div>
                    <input
                      type="text"
                      name="numero_serie"
                      id="numero_serie"
                      value={formData.numero_serie || ''}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-base"
                      placeholder="Digite o número de série"
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="detalhes" className="block text-sm font-medium text-gray-700 mb-1">
                    Detalhes
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                      <FaFileAlt className="h-5 w-5 text-indigo-500" />
                    </div>
                    <textarea
                      id="detalhes"
                      name="detalhes"
                      rows={3}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-base"
                      placeholder="Digite detalhes adicionais sobre o item"
                      value={formData.detalhes || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="nota_fiscal" className="block text-sm font-medium text-gray-700 mb-1">
                    Nota Fiscal
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaFileAlt className="h-5 w-5 text-indigo-500" />
                    </div>
                    <input
                      type="text"
                      name="nota_fiscal"
                      id="nota_fiscal"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-base"
                      placeholder="Digite o número da nota fiscal"
                      value={formData.nota_fiscal || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="supplier_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Fornecedor
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaTruck className="h-5 w-5 text-indigo-500" />
                    </div>
                    <select
                      id="supplier_id"
                      name="supplier_id"
                      value={formData.supplier_id || ''}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-base appearance-none bg-white"
                    >
                      <option value="">Selecione um fornecedor</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.nome_fantasia}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Setor */}
                <div className="sm:col-span-3">
                  <label htmlFor="setor" className="block text-sm font-medium text-gray-700 mb-1">
                    Setor
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaBuilding className="h-5 w-5 text-indigo-500" />
                    </div>
                    <input
                      type="text"
                      name="setor"
                      id="setor"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-base"
                      placeholder="Digite o nome do setor"
                      value={formData.setor || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Responsável */}
                <div className="sm:col-span-3">
                  <label htmlFor="responsavel" className="block text-sm font-medium text-gray-700 mb-1">
                    Responsável
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="h-5 w-5 text-indigo-500" />
                    </div>
                    <input
                      type="text"
                      name="responsavel"
                      id="responsavel"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-base"
                      placeholder="Digite o nome do responsável"
                      value={formData.responsavel || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="sm:col-span-3">
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                    <span className={`ml-2 inline-block h-3 w-3 rounded-full ${getStatusColor(formData.status)}`}></span>
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <select
                      id="status"
                      name="status"
                      required
                      value={formData.status}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-base"
                    >
                      <option value="Disponível">Disponível</option>
                      <option value="Em Uso">Em Uso</option>
                      <option value="Em Manutenção">Em Manutenção</option>
                      <option value="Descartado">Descartado</option>
                    </select>
                  </div>
                </div>

                 {/* Valor Aproximado */}
                <div className="sm:col-span-3">
                  <label htmlFor="valor_aproximado" className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Aproximado
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">R$</span>
                    </div>
                    <input
                      type="number"
                      name="valor_aproximado"
                      id="valor_aproximado"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-base"
                      placeholder="0.00"
                      value={formData.valor_aproximado || ''}
                      onChange={handleValueChange}
                      step="0.01"
                    />
                  </div>
                </div>

                 {/* Motivo Descarte (Condicional) */}
                {formData.status === 'Descartado' && (
                  <div className="sm:col-span-6">
                    <label htmlFor="motivo_descarte" className="block text-sm font-medium text-gray-700 mb-1">
                      Motivo do Descarte *
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                        <FaFileAlt className="h-5 w-5 text-indigo-500" />
                      </div>
                      <textarea
                        id="motivo_descarte"
                        name="motivo_descarte"
                        rows={3}
                        required={formData.status === 'Descartado'}
                        className={`block w-full pl-10 pr-3 py-2 border ${
                          formData.status === 'Descartado' && !formData.motivo_descarte ? 'border-red-300' : 'border-gray-300'
                        } rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-base`}
                        placeholder="Descreva o motivo pelo qual o item foi descartado"
                        value={formData.motivo_descarte || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                    {formData.status === 'Descartado' && !formData.motivo_descarte && (
                      <p className="mt-1 text-sm text-red-600">O motivo do descarte é obrigatório.</p>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/inventory')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
