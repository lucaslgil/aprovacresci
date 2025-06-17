import React, { useState, useEffect } from 'react';
import { FaMoneyBillWave, FaTimes, FaDollarSign, FaCalendarAlt } from 'react-icons/fa';
import { useAuthStore } from '../store/auth';
import { SalaryHistory } from '../types/Employee';
import { employeeService } from '../services/employeeService';
import { salaryHistoryService } from '../services/salaryHistoryService';

interface SalaryIncreaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  currentSalary: number;
  onSalaryUpdated: (newSalary: number) => void;
}

export function SalaryIncreaseModal({
  isOpen,
  onClose,
  employeeId,
  currentSalary,
  onSalaryUpdated,
}: SalaryIncreaseModalProps) {
  const [newSalary, setNewSalary] = useState<number | ''>('');
  const [displaySalary, setDisplaySalary] = useState('');
  const [adjustmentDate, setAdjustmentDate] = useState<string>('');
  const [reason, setReason] = useState('');
  const [employeeData, setEmployeeData] = useState<{ data_admissao: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDateInput = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isMounted = true;
    const loadEmployeeData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await employeeService.getById(employeeId);
        if (isMounted && data) {
          setEmployeeData({ data_admissao: data.data_admissao });
          if (!adjustmentDate) {
            setAdjustmentDate(formatDateForInput(new Date()));
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados do funcionário:', error);
        if (isMounted) {
          setError('Não foi possível carregar os dados do funcionário. Tente novamente.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadEmployeeData();

    return () => {
      isMounted = false;
      setEmployeeData(null);
      setNewSalary('');
      setReason('');
      setAdjustmentDate('');
      setError(null);
    };
  }, [isOpen, employeeId]);

  // Atualiza o valor exibido quando o valor numérico muda
  useEffect(() => {
    if (newSalary === '') {
      setDisplaySalary('');
    } else {
      const numericValue = Number(newSalary);
      if (!isNaN(numericValue) && numericValue >= 0) {
        // Formata o número com separadores de milhar e duas casas decimais
        const formattedValue = numericValue.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
        
        // Só atualiza se o valor formatado for diferente do valor atual
        // Isso evita loop infinito quando o usuário está digitando
        if (formattedValue !== displaySalary.replace(/[^0-9,]/g, '')) {
          setDisplaySalary(formattedValue);
        }
      }
    }
  }, [newSalary]);

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setDisplaySalary(formatted);
    setNewSalary(floatValue);
  };

  const handleSalaryBlur = () => {
    if (!displaySalary) {
      setNewSalary('');
      return;
    }
    
    // Remove todos os caracteres não numéricos, exceto vírgula
    let cleanValue = displaySalary.replace(/[^0-9,]/g, '');
    
    if (!cleanValue) {
      setDisplaySalary('');
      setNewSalary('');
      return;
    }
    
    // Se o valor terminar com vírgula, adiciona '00' para os centavos
    if (cleanValue.endsWith(',')) {
      cleanValue += '00';
    }
    
    // Se não tiver vírgula, adiciona ',00' para os centavos
    if (!cleanValue.includes(',')) {
      cleanValue += ',00';
    }
    
    // Garante que o valor tenha pelo menos um dígito antes da vírgula
    const parts = cleanValue.split(',');
    let numericValue = 0;
    
    if (parts[0] === '') {
      // Caso o usuário tenha digitado apenas uma vírgula
      numericValue = 0;
    } else {
      // Converte para número, tratando a vírgula como separador decimal
      numericValue = parseFloat(cleanValue.replace(',', '.')) || 0;
    }
    
    // Arredonda para 2 casas decimais para evitar problemas de arredondamento
    numericValue = Math.round(numericValue * 100) / 100;
    
    // Formata o valor com separadores de milhar e duas casas decimais
    const formattedValue = numericValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    // Atualiza o estado apenas se o valor formatado for diferente do valor atual
    if (formattedValue !== displaySalary) {
      setDisplaySalary(formattedValue);
    }
    setNewSalary(numericValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    if (newSalary === '' || isNaN(Number(newSalary)) || Number(newSalary) <= 0) {
      setError('O novo salário deve ser um número positivo.');
      return;
    }

    if (Number(newSalary) === currentSalary) {
      setError('O novo salário deve ser diferente do salário atual.');
      return;
    }

    const adjustmentDateObj = parseDateInput(adjustmentDate);
    if (!adjustmentDate || isNaN(adjustmentDateObj.getTime())) {
      setError('A data do ajuste é inválida.');
      return;
    }

    if (employeeData?.data_admissao) {
      const admissionDate = new Date(employeeData.data_admissao);
      if (adjustmentDateObj <= admissionDate) {
        setError('A data do ajuste deve ser posterior à data de admissão.');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const now = new Date().toISOString();
      const historyEntry: Omit<SalaryHistory, 'id'> = {
        employee_id: employeeId,
        valor_anterior: currentSalary,
        valor_novo: Number(newSalary),
        data_alteracao: adjustmentDateObj.toISOString(),
        motivo: reason,
        usuario_alteracao: user?.id || 'sistema',
        created_at: now,
        updated_at: now
      };

      await salaryHistoryService.create(historyEntry);
      await employeeService.update(employeeId, { salario_atual: Number(newSalary) });

      onSalaryUpdated(Number(newSalary));
      onClose();
    } catch (err) {
      console.error('Erro ao salvar o aumento salarial:', err);
      setError('Ocorreu um erro ao salvar o aumento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <form
          onSubmit={handleSubmit}
          className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
        >
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
              <FaMoneyBillWave className="h-6 w-6 text-indigo-600" aria-hidden="true" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Registrar Aumento Salarial
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Salário atual: <strong>{currentSalary.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            {/* Campo Novo Salário */}
            <div className="sm:col-span-1">
              <label htmlFor="new-salary" className="block text-sm font-medium text-gray-700">
                Novo Salário (R$)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaDollarSign className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 font-medium">
                    R$
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    id="new-salary"
                    value={displaySalary}
                    onChange={handleSalaryChange}
                    onBlur={handleSalaryBlur}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-8 pr-3 sm:text-sm border-gray-300 rounded-md py-2 text-left"
                    placeholder="5.000,00"
                    required
                    aria-describedby="new-salary-help"
                  />
                </div>
              </div>
              <p id="new-salary-help" className="mt-1 text-xs text-gray-500">
                O valor deve ser diferente do salário atual.
              </p>
            </div>

            {/* Campo Data do Ajuste */}
            <div className="sm:col-span-1">
              <label htmlFor="adjustment-date" className="block text-sm font-medium text-gray-700">
                Data do Ajuste
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaCalendarAlt className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="date"
                  id="adjustment-date"
                  value={adjustmentDate}
                  onChange={(e) => setAdjustmentDate(e.target.value)}
                  disabled={loading || !employeeData}
                  className={`block w-full border ${!employeeData || loading ? 'bg-gray-100' : ''} border-gray-300 rounded-md shadow-sm py-2 pl-10 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  required
                  aria-label="Data do ajuste salarial"
                  aria-describedby="adjustment-date-help"
                />
                {loading && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                  </div>
                )}
              </div>
              <p id="adjustment-date-help" className="mt-1 text-xs text-gray-500">
                A data deve ser posterior à de admissão.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
              Motivo do Ajuste
            </label>
            <div className="mt-1">
              <textarea
                id="reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                placeholder="Descreva o motivo do reajuste salarial..."
                required
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaTimes className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            <button
              type="submit"
              disabled={loading}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Salvando...' : 'Confirmar Aumento'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
