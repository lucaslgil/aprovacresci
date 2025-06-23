import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { employeeService } from '../../services/employeeService';
import { salaryHistoryService } from '../../services/salaryHistoryService';
import { Employee, SalaryHistory } from '../../types/Employee';
import {
  FaArrowLeft,
  FaHistory,
  FaCalendarAlt,
  FaEyeSlash,
  FaExclamationTriangle,
  FaChartLine,
} from 'react-icons/fa';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ChartData, ChartOptions, TooltipItem } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import React from 'react';

// Registrar componentes necessários do Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

// --- Tipos Helper ---
interface LineChartData extends ChartData<'line', number[], string> {}
interface BarChartData extends ChartData<'bar', number[], string> {}
interface LineChartOptions extends ChartOptions<'line'> {}
interface BarChartOptions extends ChartOptions<'bar'> {}

// --- Componentes de UI Helper ---
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center" role="status" aria-live="polite">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
      <p className="mt-4 text-gray-600">Carregando dados do funcionário...</p>
    </div>
  </div>
);

const ErrorMessage = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="bg-red-50 border-l-4 border-red-500 p-4 w-full max-w-md" role="alert">
      <div className="flex">
        <div className="flex-shrink-0">
          <FaExclamationTriangle className="h-5 w-5 text-red-500" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">Erro ao carregar dados</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{message}</p>
          </div>
          <div className="mt-4">
            <button
              onClick={onRetry}
              className="text-sm font-medium text-red-800 hover:text-red-700 focus:outline-none focus:underline transition duration-150 ease-in-out"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const NotFoundMessage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <FaExclamationTriangle className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-lg font-medium text-gray-900">Funcionário não encontrado</h3>
      <p className="mt-1 text-gray-500">Não foi possível encontrar o funcionário com o ID fornecido.</p>
    </div>
  </div>
);

interface EmployeeSalaryHistoryProps {
  employeeId?: string;
}

export function EmployeeSalaryHistory({ employeeId, showCharts: showChartsProp }: EmployeeSalaryHistoryProps & { showCharts?: boolean } = {}) {
  const params = useParams<{ id: string }>();
  const id = employeeId || params.id;
  const navigate = useNavigate();

  // Hooks de Estado
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [salaryHistory, setSalaryHistory] = useState<SalaryHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCharts, setShowCharts] = useState(showChartsProp !== undefined ? showChartsProp : true);

  // Sincroniza showCharts com prop
  useEffect(() => {
    if (showChartsProp !== undefined) setShowCharts(showChartsProp);
  }, [showChartsProp]);

  // --- Funções Utilitárias Memoizadas ---
  const safeToDate = useCallback((date: any): Date => {
    if (!date) return new Date(NaN);
    const d = new Date(date);
    return isNaN(d.getTime()) ? new Date(NaN) : d;
  }, []);

  const formatCurrency = useCallback((value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }, []);

  const formatDate = useCallback((date: any): string => {
    const d = safeToDate(date);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }, [safeToDate]);

  // Função para formatar data como MM/YYYY
  const formatMonthYear = useCallback((date: any): string => {
    const d = safeToDate(date);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' });
  }, [safeToDate]);

  // --- Lógica de Carregamento de Dados ---
  const sortedHistory = useMemo(() => {
    if (!employee) return [];

    // Se não houver histórico de alterações, exibe apenas o salário inicial
    if (!salaryHistory || salaryHistory.length === 0) {
      if (employee.salario_inicial) {
        return [{
          id: 'initial',
          employee_id: employee.id,
          valor_anterior: employee.salario_inicial,
          valor_novo: employee.salario_inicial,
          data_alteracao: employee.data_admissao || new Date(0).toISOString(),
          motivo: 'Salário Inicial',
          usuario_alteracao: 'Sistema',
        }];
      }
      return [];
    }

    // Ordena o histórico por data
    const orderedHistory = [...salaryHistory].sort((a, b) => safeToDate(a.data_alteracao).getTime() - safeToDate(b.data_alteracao).getTime());

    // Monta o histórico formatado, garantindo que o salário anterior de cada alteração seja o valor_novo da alteração anterior
    const formattedHistory: Omit<SalaryHistory, 'created_at' | 'updated_at'>[] = [];
    if (employee.salario_inicial) {
      formattedHistory.push({
        id: 'initial',
        employee_id: employee.id,
        valor_anterior: employee.salario_inicial,
        valor_novo: employee.salario_inicial,
        data_alteracao: employee.data_admissao || new Date(0).toISOString(),
        motivo: 'Salário Inicial',
        usuario_alteracao: 'Sistema',
      });
    }
    for (let i = 0; i < orderedHistory.length; i++) {
      const prev = i === 0 ? employee.salario_inicial : orderedHistory[i - 1].valor_novo;
      formattedHistory.push({
        ...orderedHistory[i],
        valor_anterior: prev,
      });
    }

    // Adiciona o salário atual como o último ponto, se diferente do último histórico
    const lastHistory = formattedHistory[formattedHistory.length - 1];
    if (lastHistory && employee.salario_atual !== lastHistory.valor_novo) {
      formattedHistory.push({
        id: 'current',
        employee_id: employee.id,
        valor_anterior: lastHistory.valor_novo,
        valor_novo: employee.salario_atual,
        data_alteracao: new Date().toISOString(),
        motivo: 'Salário Atual',
        usuario_alteracao: 'Sistema',
      });
    }

    return formattedHistory;
  }, [employee, salaryHistory, safeToDate]);

  const salaryEvolutionChartData: LineChartData = useMemo(() => {
    if (!employee) return { labels: [], datasets: [] };

    const labels: string[] = [];
    const data: number[] = [];

    if (sortedHistory.length > 0) {
      labels.push(employee.data_admissao ? formatMonthYear(employee.data_admissao) : 'Início');
      data.push(sortedHistory[0].valor_anterior);

      sortedHistory.forEach(h => {
        labels.push(formatMonthYear(h.data_alteracao));
        data.push(h.valor_novo);
      });
    } else {
      labels.push(employee.data_admissao ? formatMonthYear(employee.data_admissao) : 'Salário Atual');
      data.push(employee.salario_atual);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Evolução Salarial',
          data,
          fill: true,
          backgroundColor: 'rgba(79, 70, 229, 0.2)',
          borderColor: 'rgba(79, 70, 229, 1)',
          tension: 0.1,
        },
      ],
    };
  }, [employee, sortedHistory, formatMonthYear]);

  const salaryVariationChartData: BarChartData = useMemo(() => {
    if (sortedHistory.length === 0) return { labels: [], datasets: [] };

    const labels = sortedHistory.map(h => formatDate(h.data_alteracao));
    const data = sortedHistory.map(h => {
      const anterior = Number(h.valor_anterior) || 0;
      const novo = Number(h.valor_novo) || 0;
      return novo - anterior;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Variação por Alteração',
          data,
          backgroundColor: data.map(d => d >= 0 ? 'rgba(22, 163, 74, 0.6)' : 'rgba(220, 38, 38, 0.6)'),
          borderColor: data.map(d => d >= 0 ? 'rgba(22, 163, 74, 1)' : 'rgba(220, 38, 38, 1)'),
          borderWidth: 1,
        },
      ],
    };
  }, [sortedHistory, formatDate]);

  const chartOptions: LineChartOptions | BarChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: TooltipItem<'line'> | TooltipItem<'bar'>) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'category', // Força o eixo X a ser categórico
        title: {
          display: true,
          text: 'MÊS/ANO',
        },
        ticks: {
          autoSkip: false,
          maxRotation: 0,
          minRotation: 0,
          color: '#444',
          font: {
            size: 12,
          },
        },
        grid: {
          display: true,
        },
      },
      y: {
        min: 0, // Garante que o eixo Y comece em zero
        ticks: {
          callback: function(value) {
            return formatCurrency(Number(value));
          }
        }
      }
    }
  }), [formatCurrency]);

  // --- Lógica de Carregamento de Dados ---
  const loadData = useCallback(async () => {
    if (!id) {
      setError('ID do funcionário não fornecido.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const emp = await employeeService.getById(id);
      if (emp) {
        setEmployee(emp);
        const history = await salaryHistoryService.getByEmployeeId(id);
        setSalaryHistory(history);
      } else {
        setEmployee(null);
        setSalaryHistory([]);
      }
    } catch (err: any) {
      console.error("Erro ao carregar dados:", err);
      setError(err.message || 'Ocorreu um erro desconhecido.');
      setEmployee(null);
      setSalaryHistory([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Renderização ---
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadData} />;
  if (!employee) return <NotFoundMessage />;

  return (
    <div className={employeeId ? '' : 'min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8'}>
      <div className={employeeId ? '' : 'max-w-7xl mx-auto'}>
        {/* Só mostra o botão Voltar se NÃO estiver embutido no formulário */}
        {!employeeId && (
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FaArrowLeft className="mr-2" />
              Voltar
            </button>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <div className="md:flex md:items-center md:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-gray-900 truncate" title={employee.nome_completo}>
                  {employee.nome_completo}
                </h2>
                <p className="text-sm text-gray-500">{employee.cargo || 'N/A'} • {employee.departamento || 'N/A'}</p>
              </div>
              {/* Botão de gráficos removido daqui, agora está no topo do formulário */}
            </div>
          </div>
          <div className="mt-6 border-t border-gray-200">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Salário Atual</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(employee.salario_atual)}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Salário Inicial</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(employee.salario_inicial)}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Data de Admissão</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(employee.data_admissao)}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    employee.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {employee.status}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {showCharts && sortedHistory.length === 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="text-center">
              <FaChartLine className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Sem dados para gráficos</h3>
              <p className="mt-1 text-sm text-gray-500">
                Não há histórico salarial para gerar os gráficos.
              </p>
            </div>
          </div>
        )}

        {showCharts && sortedHistory.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 h-80">
              <h4 className="text-md font-medium text-gray-800 mb-4">Evolução Salarial</h4>
              <Line options={chartOptions as LineChartOptions} data={salaryEvolutionChartData} />
            </div>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 h-80">
              <h4 className="text-md font-medium text-gray-800 mb-4">Variação por Alteração</h4>
              <Bar options={chartOptions as BarChartOptions} data={salaryVariationChartData} />
            </div>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div className="flex items-center">
              <FaHistory className="h-6 w-6 text-gray-500 mr-3" />
              <h3 className="text-lg leading-6 font-medium text-gray-900">Histórico de Alterações Salariais</h3>
            </div>
            {sortedHistory.length > 0 && (
              <span className="text-sm text-gray-500">
                {sortedHistory.length} registro{sortedHistory.length !== 1 ? 's' : ''} encontrado{sortedHistory.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="border-t border-gray-200">
            {sortedHistory.length === 0 ? (
              <div className="px-4 py-5 sm:px-6 text-center text-gray-500">
                Nenhuma alteração salarial registrada.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salário Anterior</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Novo Salário</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variação</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[...sortedHistory].reverse().map((history) => {
                      const valorAnterior = Number(history.valor_anterior) || 0;
                      const valorNovo = Number(history.valor_novo) || 0;
                      const variacao = valorNovo - valorAnterior;
                      
                      let percentual = 0;
                      let percentualFormatado = '0.00';
                      
                      if (valorAnterior > 0) {
                        percentual = ((valorNovo / valorAnterior) - 1) * 100;
                        percentualFormatado = Math.abs(percentual).toFixed(2);
                      } else if (valorNovo > 0) {
                        percentual = 100;
                        percentualFormatado = '100.00';
                      }
                      
                      const isAumento = variacao > 0;
                      const isReducao = variacao < 0;
                      
                      return (
                        <tr key={history.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <FaCalendarAlt className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                              {formatDate(history.data_alteracao)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {formatCurrency(valorAnterior)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {formatCurrency(valorNovo)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-1">
                              <span className={`px-2 py-1 inline-flex items-center text-xs leading-4 font-medium rounded ${
                                isAumento 
                                  ? 'bg-green-100 text-green-800' 
                                  : isReducao 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-gray-100 text-gray-800'
                              }`}>
                                {isAumento ? (
                                  <svg className="h-3 w-3 mr-1 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                                  </svg>
                                ) : isReducao ? (
                                  <svg className="h-3 w-3 mr-1 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 13.586 4.707 10.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 15.414 14.586 19H12z" clipRule="evenodd" />
                                  </svg>
                                ) : null}
                                {formatCurrency(Math.abs(variacao))}
                              </span>
                              {percentual !== 0 && (
                                <span className={`text-xs ${isAumento ? 'text-green-600' : 'text-red-600'}`}>
                                  {isAumento ? '+' : (isReducao ? '-' : '')}{percentualFormatado}%
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {history.motivo || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}