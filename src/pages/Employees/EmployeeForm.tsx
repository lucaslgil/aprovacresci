import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { databaseService } from '../../services/database';
import { Employee, EmployeeFormData, SalaryHistory } from '../../types/Employee';
import { Item } from '../../services/database';
import { 
  FaUser,
  FaExclamationTriangle,
  FaCheckCircle,
  FaSearch,
  FaPlus,
  FaTrash,
  FaArrowLeft,
  FaChevronDown,
  FaTimes,
  FaCheck
} from 'react-icons/fa';
import { Combobox } from '@headlessui/react';

import { useAuthStore } from '../../store/auth';
import type { Company as CompanyType } from '../../types/Company';
import { createClient } from '@supabase/supabase-js';

// Adicione a configuração do Supabase (ajuste se já existir em outro lugar)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export function EmployeeForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const { user } = useAuthStore();

  const [formState, setFormState] = useState<EmployeeFormData>({
    nome: '',
    cpf: '',
    email: '',
    telefone: '',
    cargo: '',
    status: 'ativo',
    itensVinculados: [],
    setor: '',
    salario: 0,
    dataAdmissao: '',
    dataDesligamento: '',
    company_id: '',
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [showAvailableItems, setShowAvailableItems] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<CompanyType | null>(null);

  // Estado para companies
  const [companies, setCompanies] = useState<CompanyType[]>([]);
  const [companyId, setCompanyId] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Carregar todos os itens para a lista de disponíveis
        const allItems = await databaseService.items.getAll();
        setAvailableItems(allItems);

        if (id) {
          // Se for edição, carregar dados do colaborador
          const employeeData = await databaseService.employees.getById(id);
          if (employeeData) {
            setFormState({
              nome: employeeData.nome,
              cpf: employeeData.cpf,
              email: employeeData.email,
              telefone: employeeData.telefone || '', // Tratar como string vazia se nulo
              cargo: employeeData.cargo || '', // Tratar como string vazia se nulo
              status: employeeData.status.toLowerCase() as 'ativo' | 'inativo', // Garantir minúsculas e tipagem correta
              itensVinculados: employeeData.itensVinculados || [], // Garantir array vazio se nulo/undefined
              setor: employeeData.setor || '', // Incluindo setor ao carregar dados para edição
              salario: employeeData.salario || 0, // Incluindo salário ao carregar dados para edição
              dataAdmissao: employeeData.dataAdmissao || '',
              dataDesligamento: employeeData.dataDesligamento || '',
              company_id: employeeData.company_id || '',
            });
            // Popular selectedItems com base nos itensVinculados do colaborador
            const itemsForEmployee = allItems.filter(item =>
              (employeeData.itensVinculados || []).includes(item.id)
            );
            setSelectedItems(itemsForEmployee);
          } else {
            setError('Colaborador não encontrado.');
            // Redirecionar ou mostrar mensagem de erro
          }
        } else {
          // Se for novo, apenas carregar itens disponíveis
          setFormState(prev => ({ ...prev, status: 'ativo' })); // Garantir status inicial correto em caso de criação nova
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError('Erro ao carregar dados. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    
    // Chamar a função fetchData
    fetchData();
  }, [id]); // Dependência do ID para recarregar ao mudar entre new/edit

  // Buscar companies ao carregar o componente
  useEffect(() => {
    async function fetchCompanies() {
      try {
        let companiesData: CompanyType[] = [];
        if (databaseService.companies && databaseService.companies.getAll) {
          companiesData = await databaseService.companies.getAll() as CompanyType[];
        }
        // Busca alternativa direta do Supabase se necessário
        if (!companiesData || companiesData.length === 0) {
          const { data, error } = await supabase
            .from('companies')
            .select('*')
            .order('business_name', { ascending: true });
          if (error) throw error;
          companiesData = (data || []).filter((c: any) => c.id && c.business_name) as CompanyType[];
        }
        setCompanies(companiesData);
      } catch (err) {
        console.error('Erro ao carregar companies:', err);
        setCompanies([]);
      }
    }
    fetchCompanies();
  }, []);

  // Ao editar, carregar company vinculada
  useEffect(() => {
    if (id && companies.length > 0) { // Adicionado companies.length > 0 para garantir que as empresas já foram carregadas
      (async () => {
        const employeeData = await databaseService.employees.getById(id);
        if (employeeData) {
          if (employeeData.company_id) {
            const company = companies.find(c => c.id === employeeData.company_id);
            if (company) {
              setSelectedCompany(company);
              setCompanyId(company.id);
              // Garantir que o formState tenha o company_id
              setFormState(prev => ({
                ...prev,
                company_id: company.id
              }));
            }
          }
        }
      })();
    }
  }, [id, companies]); // Adicionado companies como dependência

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let savedEmployee: Employee;

      // Prepara os dados para salvar, convertendo strings vazias para null em campos de data
      const dataToSave = {
        ...formState,
        company_id: companyId || formState.company_id, // Usar companyId do estado ou do formState
        dataAdmissao: formState.dataAdmissao || null,
        dataDesligamento: formState.dataDesligamento || null
      };

      if (id) {
        // Editar colaborador
        // Verificar se o salário foi alterado para registrar no histórico
        const employee = await databaseService.employees.getById(id);
        
        if (employee && formState.salario !== undefined && employee.salario !== formState.salario) {
          if (!user) {
            console.error('Usuário não autenticado para registrar histórico salarial.');
          } else {
            const salaryHistoryEntry: Omit<SalaryHistory, 'id'> = {
              employee_id: id,
              valor_anterior: employee.salario || 0,
              valor_novo: formState.salario,
              data_alteracao: new Date(),
              motivo: 'Atualização pelo formulário de edição',
              usuario_alteracao: user.id,
            };
            await databaseService.salaryHistory.create(salaryHistoryEntry);
          }
        }

        savedEmployee = await databaseService.employees.update(id, dataToSave);
        setSuccess('Colaborador atualizado com sucesso!');
      } else {
        // Criar novo colaborador
        savedEmployee = await databaseService.employees.create(dataToSave);
        setSuccess('Colaborador cadastrado com sucesso!');

        // Opcional: Registrar o salário inicial como primeiro histórico
        if (formState.salario !== undefined && formState.salario > 0) {
          if (!user) {
            console.error('Usuário não autenticado para registrar histórico salarial inicial.');
          } else {
            const salaryHistoryEntry: Omit<SalaryHistory, 'id'> = {
              employee_id: savedEmployee.id,
              valor_anterior: 0,
              valor_novo: formState.salario,
              data_alteracao: new Date(),
              motivo: 'Salário inicial cadastrado',
              usuario_alteracao: user.id,
            };
            await databaseService.salaryHistory.create(salaryHistoryEntry);
          }
        }
      }
      // Limpa o formulário se for um novo cadastro
      if (!id) {
        setFormState({
          nome: '',
          cpf: '',
          email: '',
          telefone: '',
          cargo: '',
          status: 'ativo',
          itensVinculados: [],
          setor: '',
          salario: 0,
          dataAdmissao: '',
          dataDesligamento: '',
          company_id: '',
        });
        setSelectedItems([]);
        setSelectedCompany(null);
        setCompanyId('');
      }
    } catch (err) {
      console.error('Erro ao salvar colaborador:', err);
      setError('Erro ao salvar colaborador. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Se for um campo de data e o valor for vazio, salva como string vazia (será convertido para null no submit)
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  // Filtrar empresas com base na busca
  const filteredCompanies = query === ''
    ? companies
    : companies.filter((company) =>
        company.business_name.toLowerCase().includes(query.toLowerCase())
      );

  // Handler para selecionar empresa
  const handleCompanySelect = (company: CompanyType) => {
    setSelectedCompany(company);
    setCompanyId(company.id);
    // Atualiza o formState com o ID da empresa selecionada
    setFormState(prev => ({
      ...prev,
      company_id: company.id
    }));
    setQuery('');
  };

  // Limpar seleção
  const clearSelection = () => {
    setSelectedCompany(null);
    setCompanyId('');
    setFormState(prev => ({
      ...prev,
      company_id: ''
    }));
    setQuery('');
  };

  const filteredItems = availableItems.filter(item =>
    (item.item?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (item.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
  );

  const handleAddItem = async (item: Item) => {
    setFormState(prev => ({
      ...prev,
      itensVinculados: [...(prev.itensVinculados || []), item.id], // Garantir que prev.itensVinculados seja array
    }));
    setSelectedItems(prev => [...prev, item]);
  };

  const handleRemoveItem = async (item: Item) => {
    setFormState(prev => ({
      ...prev,
      itensVinculados: (prev.itensVinculados || []).filter(id => id !== item.id), // Garantir que prev.itensVinculados seja array
    }));
    setSelectedItems(prev => prev.filter(selectedItem => selectedItem.id !== item.id));
  };

  if (loading && !formState.nome) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto px-4 sm:px-6 lg:px-12">
        {/* Cabeçalho */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FaUser className="h-8 w-8 text-indigo-600 mr-3" />
              {isEditing ? 'Editar Colaborador' : 'Novo Colaborador'}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {isEditing ? 'Atualize os dados do colaborador.' : 'Preencha os dados para cadastrar um novo colaborador.'}
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              onClick={() => navigate('/employees')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FaArrowLeft className="h-4 w-4 mr-2" />
              Voltar
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
                {/* Nome Completo */}
                <div>
                  <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    name="nome"
                    id="nome"
                    required
                    value={formState.nome}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                {/* CPF */}
                <div>
                  <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">
                    CPF
                  </label>
                  <input
                    type="text"
                    name="cpf"
                    id="cpf"
                    value={formState.cpf}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                {/* Cargo */}
                <div>
                  <label htmlFor="cargo" className="block text-sm font-medium text-gray-700">
                    Cargo
                  </label>
                  <input
                    type="text"
                    name="cargo"
                    id="cargo"
                    value={formState.cargo}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-2"
                  />
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
                    value={formState.setor}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                {/* Company Selection - MOVIDO PARA AQUI */}
                <div className="mb-4 relative">
                  <Combobox as="div" value={selectedCompany} onChange={handleCompanySelect} className="relative">
                    <Combobox.Label className="block text-sm font-medium text-gray-700">
                      Empresa *
                    </Combobox.Label>
                    <div className="relative mt-1">
                      <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-300 sm:text-sm">
                        <Combobox.Input
                          className="w-full border border-gray-300 rounded-md py-2 pl-3 pr-10 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                          displayValue={(company: CompanyType) => company?.business_name || ''}
                          onChange={(event) => setQuery(event.target.value)}
                          placeholder="Buscar empresa..."
                          required
                        />
                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                          {selectedCompany ? (
                            <FaTimes
                              className="h-5 w-5 text-gray-400 hover:text-gray-500"
                              aria-hidden="true"
                              onClick={(e) => {
                                e.stopPropagation();
                                clearSelection();
                              }}
                            />
                          ) : (
                            <FaChevronDown
                              className="h-5 w-5 text-gray-400"
                              aria-hidden="true"
                            />
                          )}
                        </Combobox.Button>
                      </div>
                      
                      <div className="relative z-50">
                        <Combobox.Options 
                          className="absolute mt-1 w-full max-h-60 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm"
                        >
                          {filteredCompanies.length === 0 && query !== '' ? (
                            <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                              Nenhuma empresa encontrada.
                            </div>
                          ) : (
                            filteredCompanies.map((company) => (
                              <Combobox.Option
                                key={company.id}
                                value={company}
                                className={({ active }) =>
                                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                    active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                                  }`
                                }
                              >
                                {({ selected, active }) => (
                                  <>
                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                      {company.business_name}
                                    </span>
                                    {selected && (
                                      <span
                                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                          active ? 'text-white' : 'text-indigo-600'
                                        }`}
                                      >
                                        <FaCheck className="h-5 w-5" aria-hidden="true" />
                                      </span>
                                    )}
                                  </>
                                )}
                              </Combobox.Option>
                            ))
                          )}
                        </Combobox.Options>
                      </div>
                    </div>
                  </Combobox>
                </div>

                {/* E-mail */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    E-mail
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formState.email}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                {/* Telefone */}
                <div>
                  <label htmlFor="telefone" className="block text-sm font-medium text-gray-700">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    name="telefone"
                    id="telefone"
                    value={formState.telefone}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                {/* Status */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formState.status}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>

                {/* Salário */}
                <div>
                  <label htmlFor="salario" className="block text-sm font-medium text-gray-700">
                    Salário
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">R$ </span>
                    </div>
                    <input
                      type="number"
                      name="salario"
                      id="salario"
                      value={formState.salario}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="block w-full pl-7 pr-12 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Data de Admissão */}
                <div>
                  <label htmlFor="dataAdmissao" className="block text-sm font-medium text-gray-700">
                    Data de Admissão
                  </label>
                  <input
                    type="date"
                    name="dataAdmissao"
                    id="dataAdmissao"
                    value={formState.dataAdmissao || ''}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                {/* Data de Desligamento */}
                <div>
                  <label htmlFor="dataDesligamento" className="block text-sm font-medium text-gray-700">
                    Data de Desligamento
                  </label>
                  <input
                    type="date"
                    name="dataDesligamento"
                    id="dataDesligamento"
                    value={formState.dataDesligamento || ''}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                {/* Seção de Itens Vinculados */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg col-span-full"> {/* Adicionado col-span-full para ocupar a largura total */}
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Itens Vinculados
                    </h3>

                    {/* Lista de Itens Vinculados */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Itens Vinculados</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        {selectedItems.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">
                            Nenhum item vinculado.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {selectedItems.map(item => (
                              <div
                                key={item.id}
                                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h5 className="text-sm font-medium text-gray-900">{item.item}</h5>
                                    <p className="text-sm text-gray-500">Código: {item.codigo}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(item)}
                                    className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                  >
                                    <FaTrash className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botão para mostrar/esconder itens disponíveis */}
                    <div className="flex justify-between items-center mb-4 mt-6">
                      <h4 className="text-sm font-medium text-gray-700">Itens Disponíveis para Vincular</h4>
                      <button
                        type="button"
                        onClick={() => setShowAvailableItems(!showAvailableItems)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        {showAvailableItems ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </div>

                    {/* Seção de Itens Disponíveis */}
                    {showAvailableItems && (
                      <>
                        {/* Barra de Pesquisa */}
                        <div className="mb-4">
                          <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FaSearch className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                              placeholder="Pesquisar itens para vincular..."
                            />
                          </div>
                        </div>

                        {/* Lista de Itens */}
                        <div className="mb-6">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              {filteredItems
                                .filter(item => !selectedItems.some(selected => selected.id === item.id))
                                .map(item => (
                                  <div
                                    key={item.id}
                                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                                  >
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h5 className="text-sm font-medium text-gray-900">{item.item}</h5>
                                        <p className="text-sm text-gray-500">Código: {item.codigo}</p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleAddItem(item)}
                                        className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                      >
                                        <FaPlus className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                            {filteredItems.filter(item => !selectedItems.some(selected => selected.id === item.id)).length === 0 && (
                              <p className="text-sm text-gray-500 text-center py-4">
                                Nenhum item disponível para vincular ou todos já estão vinculados.
                              </p>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-5">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/employees')}
                className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                disabled={loading}
              >
                {loading ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Cadastrar Colaborador')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}