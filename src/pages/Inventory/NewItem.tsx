import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { databaseService, Item, Supplier } from '../../services/database';
import { 
  FaBox, 
  FaBarcode, 
  FaClipboardList, 
  FaFileInvoiceDollar, 
  FaTruck, 
  FaBuilding, 
  FaUser,
  FaSave,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTrash
} from 'react-icons/fa';
import { MdDescription } from 'react-icons/md';
import { toast } from 'react-toastify';
import { CubeIcon, QrCodeIcon, TruckIcon, BuildingOffice2Icon, UserIcon, DocumentTextIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

interface FormData {
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

export function NewItem() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>(); // Get the item ID from the URL
  const [formData, setFormData] = useState<FormData>({
    codigo: '',
    item: '',
    modelo: null,
    numero_serie: null,
    detalhes: null,
    nota_fiscal: null,
    supplier_id: null,
    setor: null,
    responsavel: null,
    status: 'Em Estoque',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierLoading, setSupplierLoading] = useState(true);
  const [supplierText, setSupplierText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const loadItemData = async () => {
      if (id) {
        setIsEditing(true);
        try {
          setLoading(true);
          const itemData = await databaseService.items.getById(id);
          setFormData({
            codigo: itemData.codigo || '',
            item: itemData.item || '',
            modelo: itemData.modelo || null,
            numero_serie: itemData.numero_serie || null,
            detalhes: itemData.detalhes || null,
            nota_fiscal: itemData.nota_fiscal || null,
            supplier_id: itemData.supplier_id || null,
            setor: itemData.setor || null,
            responsavel: itemData.responsavel || null,
            status: itemData.status || 'Em Estoque',
          });
          if (itemData.suppliers) {
            setSupplierText(itemData.suppliers.nome_fantasia || itemData.suppliers.razao_social || '');
          } else {
            setSupplierText('');
          }
          setError(null);
        } catch (err) {
          console.error('Erro ao carregar dados do item:', err);
          setError('Erro ao carregar dados do item. Tente novamente.');
        } finally {
          setLoading(false);
        }
      } else {
        setIsEditing(false);
        const generateNextCode = async () => {
          try {
            const nextCode = await databaseService.items.getNextCode();
            setFormData(prev => ({ ...prev, codigo: nextCode }));
          } catch (err) {
            console.error('Erro ao gerar código:', err);
          }
        };

        generateNextCode();
      }
    };

    loadItemData();
  }, [id]); // Rerun effect when ID changes (for edit mode)

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setSupplierLoading(true);
        const suppliersData = await databaseService.suppliers.getAll();
        setSuppliers(suppliersData);
      } catch (error: any) {
        toast.error(`Erro ao carregar fornecedores: ${error.message}`);
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

  useEffect(() => {
    const isCodeChangedInEdit = isEditing && formData.codigo !== ('initial code fetched from item');
    const shouldValidate = !isEditing || (isEditing && formData.codigo && isCodeChangedInEdit);

    if (shouldValidate) {
       const delayDebounceFn = setTimeout(async () => {
          if (formData.codigo) {
            const isUnique = await databaseService.items.isCodeUnique(formData.codigo);
            if (!isUnique) {
              setCodeError('Código já existe.');
            } else {
              setCodeError(null);
            }
          } else {
             setCodeError('O código é obrigatório.');
          }
       }, 500);
       return () => clearTimeout(delayDebounceFn);
    } else {
        setCodeError(null);
    }

  }, [formData.codigo, isEditing, id]);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const updatedValue = value === '' ? null : value;
    setFormData({ ...formData, [name]: updatedValue });

    if (name === 'codigo') {
      if (value.length === 0) {
        setCodeError('O código é obrigatório');
        return;
      }

      if (!isEditing || (isEditing && value !== formData.codigo)) {
        try {
          const isUnique = await databaseService.items.isCodeUnique(value);
          if (!isUnique) {
            setCodeError('Este código já está em uso');
          } else {
            setCodeError(null);
          }
        } catch (err) {
          console.error('Erro ao validar código:', err);
        }
      } else {
         setCodeError(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (codeError) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const itemDataToSave = {
        codigo: formData.codigo,
        item: formData.item,
        modelo: formData.modelo || null,
        numero_serie: formData.numero_serie || null,
        detalhes: formData.detalhes || null,
        nota_fiscal: formData.nota_fiscal || null,
        supplier_id: formData.supplier_id || null,
        setor: formData.setor || null,
        responsavel: formData.responsavel || null,
        status: formData.status,
      };

      if (isEditing && id) {
        await databaseService.items.update(id, itemDataToSave);
        setSuccess('Item atualizado com sucesso!');
      } else {
        await databaseService.items.create(itemDataToSave);
        setSuccess('Item salvo com sucesso!');
      }
      
      setTimeout(() => {
        navigate('/inventory');
      }, 2000);
    } catch (err) {
      console.error(`Erro ao ${isEditing ? 'atualizar' : 'salvar'} item:`, err);
      setError(`Erro ao ${isEditing ? 'atualizar' : 'salvar'} item. Tente novamente.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return; // Should not happen in edit mode, but for safety

    setLoading(true);
    setError(null);
    setSuccess(null);
    setShowDeleteModal(false);

    try {
      await databaseService.items.delete(id);
      setSuccess('Item excluído com sucesso!');
      setTimeout(() => {
        navigate('/inventory');
      }, 2000);
    } catch (err) {
      console.error('Erro ao excluir item:', err);
      setError('Erro ao excluir item. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/inventory');
  };

  const statusOptions = ['Em Estoque', 'Em Uso', 'Manutenção', 'Descartado', 'Perdido'];

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSuggestions) {
        const target = event.target as Node;
      }
    };
  }, [showSuggestions]);

  if (loading || supplierLoading) {
     return <div className="text-center text-gray-600">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FaBox className="h-8 w-8 text-indigo-600 mr-3" />
              {isEditing ? 'Alterar Item' : 'Novo Item'}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {isEditing ? 'Edite os dados do item abaixo.' : 'Preencha os dados abaixo para cadastrar um novo item no inventário.'}
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
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                {/* Código */}
                <div className="sm:col-span-2">
                  <label htmlFor="codigo" className="block text-sm font-medium text-gray-700 mb-1">
                    Código
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <QrCodeIcon className="h-5 w-5 text-indigo-500" />
                    </div>
                    <input
                      type="text"
                      name="codigo"
                      id="codigo"
                      required
                      className={`block w-full pl-10 pr-3 py-2 border ${
                        codeError ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-base ${
                        isEditing ? 'bg-gray-100' : ''
                      }`}
                      placeholder="000001"
                      value={formData.codigo}
                      onChange={handleInputChange}
                      readOnly={isEditing && !codeError}
                    />
                  </div>
                  {codeError && (
                    <p className="mt-1 text-sm text-red-600">{codeError}</p>
                  )}
                </div>

                {/* Item */}
                <div className="sm:col-span-4">
                  <label htmlFor="item" className="block text-sm font-medium text-gray-700 mb-1">
                    Item
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CubeIcon className="h-5 w-5 text-indigo-500" />
                    </div>
                    <input
                      type="text"
                      name="item"
                      id="item"
                      required
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-base"
                      placeholder="Digite o nome do item"
                      value={formData.item}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Modelo */}
                <div className="sm:col-span-3">
                  <label htmlFor="modelo" className="block text-sm font-medium text-gray-700 mb-1">
                    Modelo
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DocumentTextIcon className="h-5 w-5 text-indigo-500" />
                    </div>
                    <input
                      type="text"
                      name="modelo"
                      id="modelo"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-base"
                      placeholder="Digite o modelo do item"
                      value={formData.modelo || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Número de Série */}
                <div className="sm:col-span-3">
                  <label htmlFor="numero_serie" className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Série
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <QrCodeIcon className="h-5 w-5 text-indigo-500" />
                    </div>
                    <input
                      type="text"
                      name="numero_serie"
                      id="numero_serie"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-base"
                      placeholder="Digite o número de série"
                      value={formData.numero_serie || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Detalhes */}
                <div className="sm:col-span-6">
                  <label htmlFor="detalhes" className="block text-sm font-medium text-gray-700 mb-1">
                    Detalhes
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                      <DocumentTextIcon className="h-5 w-5 text-indigo-500" />
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

                {/* Nota Fiscal */}
                <div className="sm:col-span-3">
                  <label htmlFor="nota_fiscal" className="block text-sm font-medium text-gray-700 mb-1">
                    Nota Fiscal
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DocumentTextIcon className="h-5 w-5 text-indigo-500" />
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

                {/* Fornecedor (Text input with suggestions) */}
                <div className="sm:col-span-3">
                  <label htmlFor="supplier_text" className="block text-sm font-medium text-gray-700 mb-1">
                    Fornecedor
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <TruckIcon className="h-5 w-5 text-indigo-500" />
                    </div>
                    <input
                      type="text"
                      id="supplier_text"
                      name="supplier_text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-base"
                      placeholder="Digite o nome do fornecedor"
                      value={supplierText}
                      onChange={handleSupplierTextChange}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
                      autoComplete="off"
                    />

                    {showSuggestions && filteredSuppliers.length > 0 && (
                      <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
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

                {/* Setor */}
                <div className="sm:col-span-3">
                  <label htmlFor="setor" className="block text-sm font-medium text-gray-700 mb-1">
                    Setor
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <BuildingOffice2Icon className="h-5 w-5 text-indigo-500" />
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
                      <UserIcon className="h-5 w-5 text-indigo-500" />
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

                {/* Status (apenas em edição) */}
                {isEditing && (
                   <div className="sm:col-span-3">
                   <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                     Status
                   </label>
                   <div className="relative rounded-md shadow-sm">
                     <select
                       id="status"
                       name="status"
                       className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-base"
                       value={formData.status}
                       onChange={handleInputChange}
                     >
                       {statusOptions.map((status) => (
                         <option key={status} value={status}>
                           {status}
                         </option>
                       ))}
                     </select>
                   </div>
                 </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            {isEditing && (
               <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <FaTrash className="h-4 w-4 mr-2" />
                Excluir Item
              </button>
            )}
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
              disabled={loading || !!codeError || !formData.item || !formData.codigo}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaSave className="h-4 w-4 mr-2" />
              {loading ? (isEditing ? 'Atualizando...' : 'Salvando...') : (isEditing ? 'Atualizar' : 'Salvar')}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FaExclamationTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Confirmar Exclusão
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Tem certeza que deseja excluir este item ({formData.item} - Código: {formData.codigo})?
                        Esta ação não poderá ser desfeita.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDelete}
                >
                  Excluir
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 