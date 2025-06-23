import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { databaseService } from '../../services/database';
import { SalaryIncreaseModal } from '../../components/SalaryIncreaseModal';
import { EmployeeFormData, Employee } from '../../types/Employee';
import { 
  FaExclamationTriangle,
  FaCheckCircle,
  FaArrowLeft,
  FaEyeSlash,
  FaChartLine,
  FaBox
} from 'react-icons/fa';
import { 
  UserIcon, 
  IdentificationIcon, 
  PhoneIcon, 
  BriefcaseIcon, 
  BuildingOfficeIcon, 
  CalendarIcon, 
  CurrencyDollarIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { EmployeeSalaryHistory } from './EmployeeSalaryHistory';
import { Listbox, Transition } from '@headlessui/react';
import { Item } from '../../services/database';

// Função para formatar valor monetário para exibição (ex: 5000.5 -> '5.000,50')
const formatCurrency = (value: number | string | null): string => {
  if (value === null || value === '') return '';
  const numberValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numberValue)) return '';
  return new Intl.NumberFormat('pt-BR', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numberValue);
};

// Função para converter valor formatado para número (ex: '5.000,50' -> 5000.5)
const parseCurrency = (value: string): number => {
  if (!value) return 0;
  // Remove todos os pontos de milhar e substitui vírgula por ponto
  const numberValue = parseFloat(
    value.replace(/\./g, '').replace(',', '.')
  );
  return isNaN(numberValue) ? 0 : numberValue;
};

// Interface for InputField props
interface InputFieldProps {
  icon: React.ReactElement;
  label: React.ReactNode;
  name: string;
  value: string | number | null | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  type?: string;
  required?: boolean;
  readOnly?: boolean;
  step?: string | number;
  min?: string | number;
  className?: string;
  isCurrency?: boolean; // Nova prop para indicar se é um campo monetário
}

// Reusable InputField component with explicit types
const InputField: React.FC<InputFieldProps> = ({ 
  icon, 
  label, 
  name, 
  value, 
  onChange, 
  type = 'text', 
  required = false, 
  readOnly = false,
  step,
  min,
  className = '',
  isCurrency = false
}) => {
  // Estado interno para o valor formatado
  const [displayValue, setDisplayValue] = useState<string>('');

  // Atualiza o valor formatado quando o valor externo muda
  useEffect(() => {
    if (isCurrency) {
      const safeValue = value === null || value === undefined || value === '' ? '' : value;
      
      // Se o valor for zero ou '0', formata como '0,00'
      if (safeValue === 0 || safeValue === '0') {
        setDisplayValue('0,00');
        return;
      }
      
      // Garante que o valor seja formatado corretamente
      if (safeValue) {
        const numericValue = typeof safeValue === 'string' ? parseFloat(safeValue) : safeValue;
        if (!isNaN(numericValue)) {
          setDisplayValue(formatCurrency(numericValue));
          return;
        }
      }
      
      // Se não houver valor ou for inválido, define como vazio
      setDisplayValue('');
    }
  }, [value, isCurrency]);

  // Manipulador de perda de foco para campos monetários
  const handleCurrencyBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9,]/g, '');
    if (!rawValue) {
      setDisplayValue('');
      return;
    }
    
    // Formata o valor corretamente ao sair do campo
    const numericValue = parseCurrency(rawValue);
    setDisplayValue(formatCurrency(numericValue));
    
    // Atualiza o valor no formulário
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name,
        value: numericValue.toString()
      }
    };
    
    onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
  };
  
  // Manipulador de mudança para campos monetários
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove tudo que não for número
    const rawValue = e.target.value.replace(/\D/g, '');
    // Converte para número
    let numericValue = parseInt(rawValue, 10);
    if (isNaN(numericValue)) numericValue = 0;
    // Divide por 100 para obter os centavos
    const floatValue = numericValue / 100;
    // Formata para moeda brasileira
    const formatted = floatValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    setDisplayValue(formatted);
    // Dispara o evento com o valor numérico como string
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name,
        value: floatValue.toString()
      }
    };
    onChange(syntheticEvent as unknown as React.ChangeEvent<HTMLInputElement>);
  };

  // Estilo base para todos os inputs
  const baseStyles = 'block w-full pl-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-150';
  
  // Estilo para campos desabilitados
  const disabledStyles = readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white hover:border-gray-400';
  
  // Estilo para campos de data
  const isDateField = type === 'date';
  const dateStyles = isDateField ? 'pr-10' : '';
  
  // Estilo para campos monetários
  const currencyStyles = isCurrency ? 'text-left pl-14 pr-10' : '';
  
  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative rounded-md shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {React.cloneElement(icon, { 
            className: `h-5 w-5 text-gray-400 ${isCurrency ? 'opacity-0' : ''}` 
          })}
        </div>
        {isCurrency && (
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <span className="text-gray-700 font-medium ml-1">R$</span>
          </div>
        )}
        <input
          type={isCurrency ? 'text' : type}
          name={name}
          id={name}
          value={isCurrency ? displayValue : (value || '')}
          onChange={isCurrency ? handleCurrencyChange : onChange}
          required={required}
          readOnly={readOnly}
          step={step}
          min={min}
          inputMode={isCurrency ? 'decimal' : undefined}
          className={`${baseStyles} ${disabledStyles} ${dateStyles} ${currencyStyles} ${className} ${isCurrency ? 'text-left' : ''}`}
          onBlur={isCurrency ? handleCurrencyBlur : undefined}
        />
        {isDateField && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
          </div>
        )}
      </div>
    </div>
  );
};

export function EmployeeForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formState, setFormState] = useState<EmployeeFormData>({
    nome_completo: '',
    cpf: '',
    email: '',
    telefone: null,
    cargo: null,
    setor: null,
    departamento: null,
    status: 'ativo',
    salario_atual: null,
    salario_inicial: null,
    data_admissao: new Date().toISOString().split('T')[0],
    data_desligamento: null,
    data_nascimento: null,
    endereco: null,
    cidade: null,
    estado: null,
    cep: null,
    empresa_id: null,
    company_id: null,
    itens_vinculados: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSalaryIncreaseModal, setShowSalaryIncreaseModal] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<Item[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemSearch, setItemSearch] = useState('');
  const [showAvailableItems, setShowAvailableItems] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const employeeData = await databaseService.employees.getById(id);
        if (employeeData) {
          setFormState({
            nome_completo: employeeData.nome_completo || '',
            cpf: formatCPF(employeeData.cpf) || '',
            email: employeeData.email || '',
            telefone: employeeData.telefone || null,
            cargo: employeeData.cargo || null,
            setor: employeeData.setor || null,
            departamento: employeeData.departamento || null,
            status: employeeData.status || 'ativo',
            salario_atual: employeeData.salario_atual || null,
            salario_inicial: employeeData.salario_inicial || null,
            data_admissao: employeeData.data_admissao ? new Date(employeeData.data_admissao).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            data_desligamento: employeeData.data_desligamento ? new Date(employeeData.data_desligamento).toISOString().split('T')[0] : null,
            data_nascimento: employeeData.data_nascimento ? new Date(employeeData.data_nascimento).toISOString().split('T')[0] : null,
            endereco: employeeData.endereco || null,
            cidade: employeeData.cidade || null,
            estado: employeeData.estado || null,
            cep: employeeData.cep || null,
            empresa_id: employeeData.empresa_id || null,
            company_id: employeeData.company_id || null,
            itens_vinculados: employeeData.itens_vinculados || null,
          });
        } else {
          setError('Funcionário não encontrado.');
        }
      } catch (err) {
        console.error('Erro ao carregar dados do funcionário:', err);
        setError('Erro ao carregar dados do funcionário. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    // Carrega itens do inventário
    const fetchItems = async () => {
      try {
        setItemsLoading(true);
        const items = await databaseService.items.getAll();
        setInventoryItems(items);
      } catch (err) {
        console.error('Erro ao carregar itens do inventário:', err);
      } finally {
        setItemsLoading(false);
      }
    };

    fetchData();
    fetchItems();
  }, [id]);

  const formatCPF = (cpf: string | null): string => {
    if (!cpf) return '';
    // Remove qualquer caractere que não seja número
    const numericCPF = cpf.replace(/\D/g, '');
    
    // Aplica a formatação 999.999.999-99
    return numericCPF
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(\-\d{2})\d+?$/, '$1'); // Limita ao formato 999.999.999-99
  };
  
  
  const unformatCPF = (cpf: string): string => {
    // Remove todos os caracteres não numéricos
    return cpf.replace(/\D/g, '');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: string | number | null = value;
    
    // Limpa erros de validação anteriores ao começar a edição
    if (error && error.includes('salário')) {
      setError(null);
    }
    
    // Aplica formatação de CPF
    if (name === 'cpf') {
      parsedValue = formatCPF(value);
    }
    // Para campos numéricos, converte para número
    else if (type === 'number') {
      parsedValue = value === '' ? null : Number(value);
      
      // Validação para garantir que o salário atual não seja menor que o salário inicial
      if (name === 'salario_atual' && parsedValue !== null) {
        if (formState.salario_inicial !== null && parsedValue < formState.salario_inicial) {
          setError('O salário atual não pode ser menor que o salário inicial.');
        }
      } 
      // Validação para garantir que o salário inicial não seja maior que o salário atual
      else if (name === 'salario_inicial' && parsedValue !== null) {
        if (formState.salario_atual !== null && parsedValue > formState.salario_atual) {
          setError('O salário inicial não pode ser maior que o salário atual.');
        }
      }
    }

    setFormState(prevState => ({
      ...prevState,
      [name]: parsedValue,
      ...(name === 'status' && value === 'inativo' && !prevState.data_desligamento && { data_desligamento: new Date().toISOString().split('T')[0] }),
      ...(name === 'status' && value === 'ativo' && { data_desligamento: null }),
    }));
  };

  const handleSalaryUpdate = async (newSalary: number, showSuccess = true) => {
    try {
      // Atualiza o banco de dados primeiro
      if (id) {
        await databaseService.employees.update(id, { 
          salario_atual: newSalary,
          // Atualiza também o salário inicial se for nulo
          ...(formState.salario_inicial === null && { salario_inicial: newSalary })
        });
      }
      // Atualiza o estado local após a confirmação do banco de dados
      setFormState(prev => ({
        ...prev,
        salario_atual: newSalary,
        // Atualiza também o salário inicial se for nulo
        ...(prev.salario_inicial === null && { salario_inicial: newSalary })
      }));
      // Só mostra mensagem de sucesso se solicitado
      if (showSuccess) {
        setSuccess('Salário atualizado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao processar atualização de salário:', error);
      setError('Ocorreu um erro ao processar a atualização do salário. Por favor, tente novamente.');
      // Recarrega os dados do funcionário para garantir consistência
      if (id) {
        try {
          const employeeData = await databaseService.employees.getById(id);
          if (employeeData) {
            setFormState(prev => ({
              ...prev,
              salario_atual: employeeData.salario_atual,
              salario_inicial: employeeData.salario_inicial
            }));
          }
        } catch (err) {
          console.error('Erro ao recarregar dados do funcionário:', err);
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validação de salário
    const salarioAtual = formState.salario_atual === null ? null : Number(formState.salario_atual);
    const salarioInicial = formState.salario_inicial === null ? null : Number(formState.salario_inicial);
    
    // Valida se o salário inicial não é maior que o salário atual
    if (salarioInicial !== null && salarioAtual !== null && salarioInicial > salarioAtual) {
      setError('O salário inicial não pode ser maior que o salário atual.');
      setLoading(false);
      return;
    }
    
    // Valida se o salário atual não é menor que o salário inicial
    if (salarioInicial !== null && salarioAtual !== null && salarioAtual < salarioInicial) {
      setError('O salário atual não pode ser menor que o salário inicial.');
      setLoading(false);
      return;
    }

    const dataToSave = {
      ...formState,
      cpf: unformatCPF(formState.cpf), // Remove formatação do CPF antes de salvar
      salario_atual: salarioAtual,
      salario_inicial: formState.salario_inicial === null ? salarioAtual : salarioInicial,
    };

    try {
      let savedEmployee: Employee | undefined;
      if (isEditing && id) {
        savedEmployee = await databaseService.employees.update(id, dataToSave);
      } else {
        savedEmployee = await databaseService.employees.create(dataToSave);
      }
      
      if (savedEmployee) {
        setSuccess(`Funcionário ${isEditing ? 'atualizado' : 'cadastrado'} com sucesso!`);
        setTimeout(() => navigate('/employees'), 2000);
      }
    } catch (err) {
      console.error('Erro ao salvar funcionário:', err);
      setError('Erro ao salvar funcionário. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Handler para seleção de itens vinculados
  const handleLinkedItemsChange = (selectedIds: string[]) => {
    setFormState(prev => ({
      ...prev,
      itens_vinculados: selectedIds
    }));
  };

  // --- filteredItems helper ---
  const filteredItems = inventoryItems.filter(item => {
    const search = itemSearch.toLowerCase();
    return (
      item.item.toLowerCase().includes(search) ||
      (item.modelo && item.modelo.toLowerCase().includes(search)) ||
      (item.codigo && item.codigo.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-md max-w-6xl">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate('/employees')} 
          className="text-gray-600 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-blue-50"
        >
          <FaArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold ml-2 text-gray-800">
          {isEditing ? 'Editar Funcionário' : 'Novo Funcionário'}
        </h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <FaExclamationTriangle className="inline-block mr-2" />
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <FaCheckCircle className="inline-block mr-2" />
          <span className="block sm:inline">{success}</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-8">
            {/* Seção de Informações Pessoais */}
            <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-3">Informações Pessoais</h3>
                <p className="mt-1 text-sm text-gray-500">Dados de identificação do funcionário.</p>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <InputField icon={<UserIcon />} label="Nome Completo" name="nome_completo" value={formState.nome_completo} onChange={handleChange} required />
                </div>
                <div className="sm:col-span-3">
                  <InputField icon={<IdentificationIcon />} label="CPF" name="cpf" value={formState.cpf} onChange={handleChange} required />
                </div>
                <div className="sm:col-span-3">
                  <InputField icon={<UserIcon />} label="E-mail" name="email" type="email" value={formState.email} onChange={handleChange} />
                </div>
                <div className="sm:col-span-3">
                  <InputField icon={<PhoneIcon />} label="Telefone" name="telefone" value={formState.telefone} onChange={handleChange} />
                </div>
              </div>
            </div>
          </div>

          {/* Seção de Informações do Cargo */}
          <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-3">Informações do Cargo</h3>
              <p className="mt-1 text-sm text-gray-500">Detalhes sobre a posição do funcionário na empresa.</p>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <InputField 
                  icon={<BriefcaseIcon className="h-5 w-5 text-gray-400" />} 
                  label="Cargo" 
                  name="cargo" 
                  value={formState.cargo} 
                  onChange={handleChange} 
                  className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="sm:col-span-2">
                <InputField 
                  icon={<BuildingOfficeIcon className="h-5 w-5 text-gray-400" />} 
                  label="Setor" 
                  name="setor" 
                  value={formState.setor} 
                  onChange={handleChange} 
                  className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="sm:col-span-2">
                <InputField 
                  icon={<CalendarIcon className="h-5 w-5 text-gray-400" />} 
                  label="Data de Admissão" 
                  name="data_admissao" 
                  type="date" 
                  value={formState.data_admissao} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {formState.status === 'ativo' ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <select 
                    id="status" 
                    name="status" 
                    value={formState.status} 
                    onChange={handleChange} 
                    className="block w-full pl-10 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md appearance-none bg-white h-[42px] transition-all duration-150 hover:border-gray-400"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
              {formState.status === 'inativo' && (
                <div className="sm:col-span-2">
                  <InputField 
                    icon={<CalendarIcon className="h-5 w-5 text-gray-400" />} 
                    label="Data de Desligamento" 
                    name="data_desligamento" 
                    type="date" 
                    value={formState.data_desligamento} 
                    onChange={handleChange} 
                  />
                </div>
              )}
            </div>
          </div>

          {/* Seção de Salário + Histórico */}
          <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-3">Salário</h3>
              <p className="mt-1 text-sm text-gray-500">Informações salariais do funcionário.</p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-x-6 w-full">
              <div className="flex items-start">
                <InputField 
                  icon={<CurrencyDollarIcon className="h-5 w-5 text-gray-400" />} 
                  label={<span className="flex items-center">Salário Inicial</span>} 
                  name="salario_inicial"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formState.salario_inicial ?? ''}
                  onChange={handleChange}
                  isCurrency
                  className="w-48"
                />
              </div>
              <div className="flex items-start">
                <InputField 
                  icon={<CurrencyDollarIcon className="h-5 w-5 text-gray-400" />} 
                  label={<span className="flex items-center">Salário Atual</span>} 
                  name="salario_atual"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formState.salario_atual ?? ''}
                  onChange={handleChange}
                  isCurrency
                  className="w-48"
                  readOnly
                />
              </div>
              {isEditing && (
                <div className="flex flex-row gap-4 items-start h-full">
                  <div className="flex flex-col items-center w-48">
                    <span className="block h-6"></span>
                    <button 
                      type="button" 
                      onClick={() => setShowSalaryIncreaseModal(true)}
                      className="bg-blue-500 text-white px-4 py-2 h-[38px] w-full rounded-md hover:bg-blue-600 flex items-center gap-2 transition-colors"
                    >
                      <CurrencyDollarIcon className="h-4 w-4" />
                      Ajustar Salário
                    </button>
                  </div>
                  <div className="flex flex-col items-center w-48">
                    <span className="block h-6"></span>
                    <button
                      type="button"
                      onClick={() => setShowCharts((prev) => !prev)}
                      className="border border-blue-500 text-blue-600 px-4 py-2 h-[38px] w-full rounded-md hover:bg-blue-50 flex items-center gap-2 transition-colors"
                    >
                      {showCharts ? <FaEyeSlash className="h-4 w-4" /> : <FaChartLine className="h-4 w-4" />}
                      {showCharts ? 'Ocultar Gráficos' : 'Mostrar Gráficos'}
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* Histórico salarial integrado */}
            {isEditing && id && (
              <div className="mt-8">
                <EmployeeSalaryHistory employeeId={id} showCharts={showCharts} />
              </div>
            )}
          </div>

          {/* Seção de Itens do Inventário Vinculados */}
          <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-3">Itens do Inventário Vinculados</h3>
              <p className="mt-1 text-sm text-gray-500">Selecione os itens do inventário que deseja vincular a este funcionário.</p>
            </div>
            {/* Itens vinculados acima do campo de busca */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Itens vinculados</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {(formState.itens_vinculados && formState.itens_vinculados.length > 0) ? (
                  formState.itens_vinculados.map((id: string) => {
                    const item = inventoryItems.find(i => i.id === id);
                    if (!item) return null;
                    return (
                      <div key={id} className="relative flex flex-col items-start gap-1 p-3 rounded bg-blue-100 border border-blue-200 text-xs text-blue-900 transition-colors shadow-sm h-full text-left">
                        <button
                          type="button"
                          className="absolute top-1 right-1 text-red-500 hover:text-red-700 text-lg font-bold px-1 focus:outline-none"
                          onClick={() => handleLinkedItemsChange((formState.itens_vinculados as string[]).filter(x => x !== id))}
                          title="Remover item"
                        >
                          ×
                        </button>
                        <div className="flex items-center gap-2 mb-1">
                          <FaBox className="h-4 w-4 text-blue-400" />
                          <span className="font-semibold">{item.item}</span>
                        </div>
                        {item.modelo && <div className="text-blue-800">Modelo: {item.modelo}</div>}
                        {item.codigo && <div className="text-blue-700 text-xs">Código: {item.codigo}</div>}
                        {item.numero_serie && <div className="text-blue-700 text-xs">Nº Série: {item.numero_serie}</div>}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-gray-400 text-xs col-span-full">Nenhum item vinculado</div>
                )}
              </div>
            </div>
            {/* Campo de busca */}
            <div className="mb-4">
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Buscar item por nome, modelo ou código..."
                value={itemSearch}
                onChange={e => setItemSearch(e.target.value)}
              />
            </div>
            {/* Itens disponíveis em cards ordenados por código */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-700">Itens disponíveis</h4>
                <button
                  type="button"
                  className="text-xs px-3 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-200 transition-colors"
                  onClick={() => setShowAvailableItems(v => !v)}
                  aria-expanded={showAvailableItems}
                  aria-controls="available-items-list"
                >
                  {showAvailableItems ? 'Ocultar' : 'Exibir'}
                </button>
              </div>
              {showAvailableItems && (
                <div id="available-items-list" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {itemsLoading ? (
                    <div className="text-gray-500 text-sm col-span-full">Carregando itens...</div>
                  ) : (
                    (() => {
                      const available = filteredItems
                        .filter(item => !(formState.itens_vinculados || []).includes(item.id))
                        .sort((a, b) => {
                          const codeA = parseInt(a.codigo || '0', 10);
                          const codeB = parseInt(b.codigo || '0', 10);
                          return codeA - codeB;
                        });
                      if (available.length === 0) {
                        return <div className="text-gray-400 text-xs col-span-full">Nenhum item disponível</div>;
                      }
                      return available.map(item => (
                        <button
                          type="button"
                          key={item.id}
                          className="flex flex-col items-start gap-1 p-3 rounded bg-white hover:bg-blue-50 border border-gray-200 text-xs text-gray-800 transition-colors shadow-sm h-full text-left"
                          onClick={() => handleLinkedItemsChange([...(formState.itens_vinculados || []), item.id])}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <FaBox className="h-4 w-4 text-blue-400" />
                            <span className="font-semibold text-blue-900">{item.item}</span>
                          </div>
                          {item.modelo && <div className="text-gray-600">Modelo: {item.modelo}</div>}
                          {item.codigo && <div className="text-gray-400 text-xs">Código: {item.codigo}</div>}
                          {item.numero_serie && <div className="text-gray-400 text-xs">Nº Série: {item.numero_serie}</div>}
                        </button>
                      ));
                    })()
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">Clique para adicionar/remover itens vinculados ao colaborador.</p>
          </div>

          <div className="pt-5 bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/employees')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 118-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Salvando...
                  </>
                ) : 'Salvar'}
              </button>
            </div>
          </div>
        </form>
      </div>
      
      <SalaryIncreaseModal
        isOpen={showSalaryIncreaseModal}
        onClose={() => setShowSalaryIncreaseModal(false)}
        employeeId={id || ''}
        currentSalary={formState.salario_atual || 0}
        onSalaryUpdated={handleSalaryUpdate}
      />
    </div>
  );
}
