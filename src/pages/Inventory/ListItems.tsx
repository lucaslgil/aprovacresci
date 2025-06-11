import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { databaseService, Item } from '../../services/database';
import {
  FaBox,
  FaEdit,
  FaTrash,
  FaPlus,
  FaExclamationTriangle,
  FaCheckCircle,
  FaSearch,
  FaFilter,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaSortNumericDown,
  FaSortNumericUp
} from 'react-icons/fa';

export function ListItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{
    setor: string;
    responsavel: string;
    item: string;
  }>({
    setor: '',
    responsavel: '',
    item: '',
  });
  const [sortColumn, setSortColumn] = useState<string | null>('codigo');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await databaseService.items.getAll();
      setItems(data);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar itens:', err);
      setError('Erro ao carregar a lista de itens. Tente novamente.');
      ;
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: Item) => {
    try {
      await databaseService.items.delete(item.id);
      setSuccess('Item excluído com sucesso!');
      setItemToDelete(null);
      loadItems();
      ;
    } catch (err) {
      console.error('Erro ao excluir item:', err);
      setError('Erro ao excluir item. Tente novamente.');
      ;
    }
  };

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.detalhes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.numero_serie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.setor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.responsavel?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSetor = !filters.setor || item.setor?.toLowerCase() === filters.setor.toLowerCase();
    const matchesResponsavel = !filters.responsavel || item.responsavel?.toLowerCase() === filters.responsavel.toLowerCase();
    const matchesItem = !filters.item || item.item?.toLowerCase() === filters.item.toLowerCase();

    return matchesSearch && matchesSetor && matchesResponsavel && matchesItem;
  });

  const sortedItems = React.useMemo(() => {
    let sortableItems = [...filteredItems];
    if (sortColumn) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortColumn as keyof Item] || '';
        const bValue = b[sortColumn as keyof Item] || '';

        if (aValue < bValue) {
          return sortDirection === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredItems, sortColumn, sortDirection]);

  const uniqueSetores = [...new Set(items.map(item => item.setor).filter(Boolean))];
  const uniqueResponsaveis = [...new Set(items.map(item => item.responsavel).filter(Boolean))];
  const uniqueItems = [...new Set(items.map(item => item.item).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto px-4 sm:px-6 lg:px-12">
        {/* Cabeçalho */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FaBox className="h-8 w-8 text-indigo-600 mr-3" />
              Lista de Itens
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Gerencie os itens do seu inventário.
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FaFilter className="h-4 w-4 mr-2" />
              Filtros
            </button>
            <Link
              to="/inventory/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FaPlus className="h-4 w-4 mr-2" />
              Novo Item
            </Link>
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

        {/* Filtros */}
        {showFilters && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Setor</label>
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={filters.setor || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, setor: e.target.value }))}
                >
                  <option value="">Todos os setores</option>
                  {uniqueSetores.map(setor => (
                    <option key={setor || ''} value={setor || ''}>{setor}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Responsável</label>
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={filters.responsavel || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, responsavel: e.target.value }))}
                >
                  <option value="">Todos os responsáveis</option>
                  {uniqueResponsaveis.map(responsavel => (
                    <option key={responsavel || ''} value={responsavel || ''}>{responsavel}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Item</label>
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={filters.item || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, item: e.target.value }))}
                >
                  <option value="">Todos os itens</option>
                  {uniqueItems.map(item => (
                    <option key={item || ''} value={item || ''}>{item}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Barra de Pesquisa */}
        <div className="mb-6">
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-3 py-2 sm:text-sm border-gray-300 rounded-md"
              placeholder="Pesquisar itens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="divide-y divide-gray-200 w-full">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    { id: 'codigo', label: 'Código', sortable: true },
                    { id: 'item', label: 'Item', sortable: true },
                    { id: 'detalhes', label: 'Detalhes', sortable: true },
                    { id: 'modelo', label: 'Modelo', sortable: true },
                    { id: 'numero_serie', label: 'Número de Série', sortable: true },
                    { id: 'setor', label: 'Setor', sortable: true },
                    { id: 'responsavel', label: 'Responsável', sortable: true },
                    { id: 'acoes', label: 'Ações', sortable: false }
                  ].map((column) => (
                    <th
                      key={column.id}
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.sortable ? 'cursor-pointer hover:text-gray-700' : ''}`}
                      onClick={() => column.sortable && handleSort(column.id)}
                    >
                      <div className="flex items-center justify-between">
                        {column.label}
                        {column.sortable && sortColumn === column.id && (
                          sortDirection === 'asc' ? <FaSortAlphaUp className="ml-2" /> : <FaSortAlphaDown className="ml-2" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                      {searchTerm ? 'Nenhum item encontrado para a pesquisa.' : 'Nenhum item cadastrado.'}
                    </td>
                  </tr>
                ) : (
                  sortedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {item.codigo}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {item.item}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {item.detalhes || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {item.modelo || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {item.numero_serie || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {item.setor || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {item.responsavel || '-'}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <Link
                            to={`/inventory/edit/${item.id}`}
                            className="text-indigo-600 hover:text-indigo-900 transition-colors duration-150"
                            title="Editar item"
                          >
                            <FaEdit className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => setItemToDelete(item)}
                            className="text-red-600 hover:text-red-900 transition-colors duration-150"
                            title="Excluir item"
                          >
                            <FaTrash className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {itemToDelete && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

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
                        Tem certeza que deseja excluir o item {itemToDelete.item} (Código: {itemToDelete.codigo})?
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
                  onClick={() => handleDelete(itemToDelete)}
                >
                  Excluir
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setItemToDelete(null)}
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