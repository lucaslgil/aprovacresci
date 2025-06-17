import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { databaseService } from '../../services/database';
import { Employee } from '../../types/Employee';
import {
  FaUser,
  FaEdit,
  FaTrash,
  FaPlus,
  FaExclamationTriangle,
  FaCheckCircle,
  FaSearch,
  FaFilter,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaFilePdf,
  FaMoneyBillWave,
  FaFileImport
} from 'react-icons/fa';


export function ListEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{
    setor: string;
    cargo: string;
    status: string;
  }>({
    setor: '',
    cargo: '',
    status: '',
  });
  const [sortColumn, setSortColumn] = useState<string | null>('nome_completo');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await databaseService.employees.getAll();
      setEmployees(data);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar colaboradores:', err);
      setError('Erro ao carregar a lista de colaboradores. Tente novamente.');
      ;
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (employee: Employee) => {
    try {
      await databaseService.employees.delete(employee.id);
      setEmployees(employees.filter(e => e.id !== employee.id));
      setSuccess('Colaborador excluído com sucesso!');
      ;
      setEmployeeToDelete(null);
    } catch (err) {
      console.error('Erro ao excluir colaborador:', err);
      setError('Erro ao excluir colaborador. Tente novamente.');
      ;
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.cpf && employee.cpf.includes(searchTerm)) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSetor = !filters.setor || employee.setor === filters.setor;
    const matchesCargo = !filters.cargo || employee.cargo === filters.cargo;
    const matchesStatus = !filters.status || employee.status === filters.status;

    return matchesSearch && matchesSetor && matchesCargo && matchesStatus;
  });

  const sortedEmployees = React.useMemo(() => {
    let sortableEmployees = [...filteredEmployees];
    if (sortColumn) {
      sortableEmployees.sort((a, b) => {
        const aValue = a[sortColumn as keyof Employee] || '';
        const bValue = b[sortColumn as keyof Employee] || '';

        if (aValue < bValue) {
          return sortDirection === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableEmployees;
  }, [filteredEmployees, sortColumn, sortDirection]);

  const uniqueSetores = [...new Set(employees.map(employee => employee.setor).filter(Boolean))];
  const uniqueCargos = [...new Set(employees.map(employee => employee.cargo).filter(Boolean))];
  const uniqueStatus = [...new Set(employees.map(employee => employee.status).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto px-4 sm:px-6 lg:px-12">
        {/* Cabeçalho */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FaUser className="h-8 w-8 text-indigo-600 mr-3" />
              Lista de Colaboradores
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Gerencie os colaboradores da empresa.
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
              to="/employees/import"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FaFileImport className="h-4 w-4 mr-2" />
              Importar Colaboradores
            </Link>
            <Link
              to="/employees/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FaPlus className="h-4 w-4 mr-2" />
              Novo Colaborador
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
          <div className="mb-6 p-4 bg-white rounded-lg shadow">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="setor" className="block text-sm font-medium text-gray-700">
                  Setor
                </label>
                <select
                  id="setor"
                  value={filters.setor}
                  onChange={(e) => setFilters({ ...filters, setor: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Todos</option>
                  {uniqueSetores.map((setor) => (
                    <option key={setor} value={setor}>
                      {setor}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="cargo" className="block text-sm font-medium text-gray-700">
                  Cargo
                </label>
                <select
                  id="cargo"
                  value={filters.cargo}
                  onChange={(e) => setFilters({ ...filters, cargo: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Todos</option>
                  {uniqueCargos.map((cargo) => (
                    <option key={cargo} value={cargo}>
                      {cargo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Todos</option>
                  {uniqueStatus.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              placeholder="Pesquisar por nome, CPF ou email..."
            />
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('nome_completo')}
                >
                  <div className="flex items-center">
                    Nome
                    {sortColumn === 'nome_completo' && (
                      sortDirection === 'asc' ? <FaSortAlphaUp className="ml-2" /> : <FaSortAlphaDown className="ml-2" />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('cpf')}
                >
                  <div className="flex items-center">
                    CPF
                    {sortColumn === 'cpf' && (
                      sortDirection === 'asc' ? <FaSortAlphaUp className="ml-2" /> : <FaSortAlphaDown className="ml-2" />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('cargo')}
                >
                  <div className="flex items-center">
                    Cargo
                    {sortColumn === 'cargo' && (
                      sortDirection === 'asc' ? <FaSortAlphaUp className="ml-2" /> : <FaSortAlphaDown className="ml-2" />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('setor')}
                >
                  <div className="flex items-center">
                    Setor
                    {sortColumn === 'setor' && (
                      sortDirection === 'asc' ? <FaSortAlphaUp className="ml-2" /> : <FaSortAlphaDown className="ml-2" />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    {sortColumn === 'status' && (
                      sortDirection === 'asc' ? <FaSortAlphaUp className="ml-2" /> : <FaSortAlphaDown className="ml-2" />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('salario_atual')}
                >
                  <div className="flex items-center">
                    Salário
                    {sortColumn === 'salario_atual' && (
                      sortDirection === 'asc' ? <FaSortAlphaUp className="ml-2" /> : <FaSortAlphaDown className="ml-2" />
                    )}
                  </div>
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    Carregando...
                  </td>
                </tr>
              ) : sortedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    Nenhum colaborador encontrado.
                  </td>
                </tr>
              ) : (
                sortedEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{employee.nome_completo}</div>
                      <div className="text-sm text-gray-500">{employee.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.cpf}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.cargo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.setor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        employee.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {employee.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(employee.salario_atual || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <Link
                          to={`/employees/edit/${employee.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <FaEdit className="h-5 w-5" />
                        </Link>
                        <Link
                          to={`/employees/term/${employee.id}`}
                          className="text-green-600 hover:text-green-900"
                        >
                          <FaFilePdf className="h-5 w-5" />
                        </Link>
                        <Link
                          to={`/employees/salary-history/${employee.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Histórico de Salários"
                        >
                          <FaMoneyBillWave className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => setEmployeeToDelete(employee)}
                          className="text-red-600 hover:text-red-900"
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

      {/* Modal de Confirmação de Exclusão */}
      {employeeToDelete && (
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
                      Excluir Colaborador
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Tem certeza que deseja excluir o colaborador {employeeToDelete.nome_completo}? Esta ação não pode ser desfeita.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => handleDelete(employeeToDelete)}
                >
                  Excluir
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setEmployeeToDelete(null)}
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