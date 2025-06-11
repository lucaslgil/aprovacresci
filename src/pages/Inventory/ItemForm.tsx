import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { databaseService, Item, Supplier } from '../../services/database';
import {
  FaBox,
  FaExclamationTriangle,
  FaCheckCircle,
  FaArrowLeft
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
        ;
        setLoading(false);
      }
    } catch (err) {
      console.error('Erro ao carregar item:', err);
      setError('Erro ao carregar dados do item. Tente novamente.');
      ;
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
      ;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Basic validation (can be expanded)
      if (!formData.codigo || !formData.item || !formData.status) {
        setError('Código, Item e Status são obrigatórios.');
        ;
        setLoading(false);
        return;
      }

      // Check if code is unique only on creation or if code has changed on update
      if (!isEditing || (isEditing && id && (await databaseService.items.getById(id))?.codigo !== formData.codigo)) {
         const isUnique = await databaseService.items.isCodeUnique(formData.codigo);
         if (!isUnique) {
           setError('O código do item já existe. Por favor, use um código único.');
           ;
           setLoading(false);
           return;
         }
      }

      if (isEditing && id) {
        await databaseService.items.update(id, formData);
        setSuccess('Item atualizado com sucesso!');
        ;
      } else {
        await databaseService.items.create(formData);
        setSuccess('Item cadastrado com sucesso!');
        ;
      }
      navigate('/inventory');
    } catch (err) {
      console.error('Erro ao salvar item:', err);
      setError(`Erro ao salvar item: ${err instanceof Error ? err.message : String(err)}`);
      ;
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

   const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : parseFloat(value),
    }));
  };



  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto px-4 sm:px-6 lg:px-12">
        {/* Cabeçalho */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FaBox className="h-8 w-8 text-indigo-600 mr-3" />
              {isEditing ? 'Editar Item' : 'Novo Item'}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {isEditing ? 'Atualize os dados do item.' : 'Preencha os dados para cadastrar um novo item.'}
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              onClick={() => navigate('/inventory')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FaArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Lista
            </button>
          </div>
        </div>

        {/* Mensagens de Erro e Sucesso */}
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

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Código */}
                <div>
                  <label htmlFor="codigo" className="block text-sm font-medium text-gray-700">
                    Código *
                  </label>
                  <input
                    type="text"
                    name="codigo"
                    id="codigo"
                    required
                    value={formData.codigo}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                {/* Item */}
                <div>
                  <label htmlFor="item" className="block text-sm font-medium text-gray-700">
                    Item *
                  </label>
                  <input
                    type="text"
                    name="item"
                    id="item"
                    required
                    value={formData.item}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                {/* Modelo */}
                <div>
                  <label htmlFor="modelo" className="block text-sm font-medium text-gray-700">
                    Modelo
                  </label>
                  <input
                    type="text"
                    name="modelo"
                    id="modelo"
                    value={formData.modelo || ''}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                {/* Número de Série */}
                <div>
                  <label htmlFor="numero_serie" className="block text-sm font-medium text-gray-700">
                    Número de Série
                  </label>
                  <input
                    type="text"
                    name="numero_serie"
                    id="numero_serie"
                    value={formData.numero_serie || ''}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                {/* Detalhes */}
                <div className="sm:col-span-2">
                  <label htmlFor="detalhes" className="block text-sm font-medium text-gray-700">
                    Detalhes
                  </label>
                  <textarea
                    name="detalhes"
                    id="detalhes"
                    rows={3}
                    value={formData.detalhes || ''}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                {/* Nota Fiscal */}
                <div>
                  <label htmlFor="nota_fiscal" className="block text-sm font-medium text-gray-700">
                    Nota Fiscal
                  </label>
                  <input
                    type="text"
                    name="nota_fiscal"
                    id="nota_fiscal"
                    value={formData.nota_fiscal || ''}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                {/* Fornecedor */}
                <div>
                  <label htmlFor="supplier_id" className="block text-sm font-medium text-gray-700">
                    Fornecedor
                  </label>
                  <select
                    id="supplier_id"
                    name="supplier_id"
                    value={formData.supplier_id || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">Selecione um fornecedor</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.nome_fantasia}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Setor */}
                <div>
                  <label htmlFor="setor" className="block text-sm font-medium text-gray-700">
                    Setor
                  </label>
                  <input
                    type="text"
                    name="setor"
                    id="setor"
                    value={formData.setor || ''}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                {/* Responsável */}
                <div>
                  <label htmlFor="responsavel" className="block text-sm font-medium text-gray-700">
                    Responsável
                  </label>
                  <input
                    type="text"
                    name="responsavel"
                    id="responsavel"
                    value={formData.responsavel || ''}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                {/* Status */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status *
                  </label>
                  <select
                    id="status"
                    name="status"
                    required
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="Disponível">Disponível</option>
                    <option value="Em Uso">Em Uso</option>
                    <option value="Em Manutenção">Em Manutenção</option>
                    <option value="Descartado">Descartado</option>
                  </select>
                </div>

                 {/* Valor Aproximado */}
                <div>
                  <label htmlFor="valor_aproximado" className="block text-sm font-medium text-gray-700">
                    Valor Aproximado
                  </label>
                   <input
                    type="number"
                    name="valor_aproximado"
                    id="valor_aproximado"
                    step="0.01"
                    value={formData.valor_aproximado || ''}
                    onChange={handleValueChange}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                 {/* Motivo Descarte (Condicional)*/}
                {formData.status === 'Descartado' && (
                   <div>
                    <label htmlFor="motivo_descarte" className="block text-sm font-medium text-gray-700">
                      Motivo do Descarte *
                    </label>
                    <textarea
                      name="motivo_descarte"
                      id="motivo_descarte"
                       rows={3}
                      required={formData.status === 'Descartado'} // Campo obrigatório se o status for Descartado
                      value={formData.motivo_descarte || ''}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
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