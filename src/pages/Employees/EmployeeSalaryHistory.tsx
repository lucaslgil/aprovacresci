import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { databaseService } from '../../services/database';
import { Employee, SalaryHistory } from '../../types/Employee';
import { Item } from '../../services/database';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import {
  FaUser,
  FaArrowLeft,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaHistory,
  FaCalendarAlt,
  FaUserEdit,
  FaCheckCircle,
  FaFilePdf,
  FaDownload,
  FaChartLine,
  FaEye,
  FaEyeSlash,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa';


// Importações para o Chart.js e react-chartjs-2
import { Line, Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Importar e registrar elementos para gráfico de barra (para o combo chart)
import {
  BarElement,
  BarController // Necessário para combo chart
} from 'chart.js';

// Registrar os componentes necessários do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  BarController // Registrar BarController para combo chart
);

export function EmployeeSalaryHistory() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [salaryHistory, setSalaryHistory] = useState<SalaryHistory[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showCharts, setShowCharts] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const employeeData = await databaseService.employees.getById(id!);
      if (employeeData) {
        setEmployee(employeeData);
        const history = await databaseService.salaryHistory.getByEmployeeId(id!);
        // Ordenar o histórico por data_alteracao crescente para o gráfico
        const sortedHistory = history.sort((a, b) => new Date(a.data_alteracao).getTime() - new Date(b.data_alteracao).getTime());
        setSalaryHistory(sortedHistory);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar histórico de salários. Tente novamente.');
      ;
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (date: any) => {
    if (!(date instanceof Date) || isNaN(date.getTime()) || typeof date.toLocaleDateString !== 'function') {
      console.error('Valor inválido ou não-Date passado para formatDate:', date);
      console.error('Tipo do valor:', typeof date);
      console.error('É instância de Date?', date instanceof Date);
      console.error('getTime() resulta em NaN?', isNaN(date?.getTime?.()));
      console.error('typeof toLocaleDateString:', typeof date?.toLocaleDateString);

      return 'Data inválida';
    }
    return date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatDateOnly = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Data inválida';
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
    } catch (e) {
      console.error('Erro ao formatar data:', e);
      return 'Data inválida';
    }
  };

  // Ordenar histórico salarial por data (mais recente primeiro)
  const sortedSalaryHistory = [...salaryHistory].sort((a, b) => new Date(b.data_alteracao).getTime() - new Date(a.data_alteracao).getTime());

  // Preparar dados para o gráfico de Evolução Salarial (Line Chart)
  const salaryEvolutionChartData = {
    labels: sortedSalaryHistory.map(history => formatDate(new Date(history.data_alteracao))), // Datas no eixo X
    datasets: [
      {
        label: 'Salário (R$)',
        data: sortedSalaryHistory.map(history => history.valor_novo), // Novos valores de salário no eixo Y
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1,
        fill: false,
        yAxisID: 'y', // Liga ao eixo Y principal
      },
    ],
  };

  const salaryEvolutionChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Evolução Salarial ao Longo do Tempo',
      },
      tooltip: {
        callbacks: {
            label: function(context: any) {
                let label = context.dataset.label || '';
                if (label) {
                    label += ': ';
                }
                if (context.raw !== null) {
                    label += formatCurrency(context.raw);
                }
                return label;
            }
        }
    }
    },
    scales: {
        y: {
            ticks: {
                callback: function(value: string | number) {
                    return formatCurrency(Number(value)); // Formata os valores do eixo Y como moeda
                }
            }
        }
    }
  };

  // Preparar dados e opções para o gráfico de Variação Salarial (Combo Bar/Line Chart)
  const salaryVariationChartData = {
    labels: sortedSalaryHistory.map(history => formatDate(new Date(history.data_alteracao))), // Datas no eixo X
    datasets: [
      {
        type: 'bar' as const, // Tipo de gráfico: barra
        label: 'Variação Salarial (R$)',
        data: sortedSalaryHistory.map(history => history.valor_novo - history.valor_anterior), // Variação no eixo Y
        backgroundColor: sortedSalaryHistory.map(history =>
          (history.valor_novo - history.valor_anterior) > 0 ? 'rgba(75, 192, 192, 0.5)' : 'rgba(255, 99, 132, 0.5)' // Cores: verde para aumento, vermelho para redução
        ),
        borderColor: sortedSalaryHistory.map(history =>
          (history.valor_novo - history.valor_anterior) > 0 ? 'rgb(75, 192, 192)' : 'rgb(255, 99, 132)'
        ),
        yAxisID: 'y-variation', // Liga a um eixo Y diferente para a variação
      },
      {
        type: 'line' as const, // Tipo de gráfico: linha
        label: 'Novo Salário (R$)',
        data: sortedSalaryHistory.map(history => history.valor_novo), // Novos valores de salário no eixo Y
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.1,
        fill: false,
        yAxisID: 'y-salary', // Liga a um eixo Y diferente para o salário
      },
    ],
  };

  const salaryVariationChartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Variação e Novo Salário ao Longo do Tempo',
      },
      tooltip: {
         callbacks: {
            label: function(context: any) {
                let label = context.dataset.label || '';
                if (label) {
                    label += ': ';
                }
                if (context.raw !== null) {
                    // Formata como moeda ou apenas o número dependendo do dataset
                    if (context.dataset.type === 'bar') {
                        label += formatCurrency(context.raw);
                    } else {
                         label += formatCurrency(context.raw);
                    }
                }
                return label;
            }
        }
    }
    },
    scales: {
      y: { // Eixo Y para o primeiro dataset (variação) - pode ser invisível ou compartilhado
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        id: 'y-variation',
         ticks: {
                callback: function(value: string | number) {
                    return formatCurrency(Number(value)); // Formata os valores do eixo Y como moeda
                }
            }
      },
      'y-salary': { // Eixo Y para o segundo dataset (novo salário)
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        id: 'y-salary',
        grid: {
          drawOnChartArea: false, // Não desenhar linhas de grade para este eixo
        },
         ticks: {
                callback: function(value: string | number) {
                    return formatCurrency(Number(value)); // Formata os valores do eixo Y como moeda
                }
            }
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-500">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto px-4 sm:px-6 lg:px-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <FaExclamationTriangle className="h-5 w-5 text-red-500 mr-3" />
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto px-4 sm:px-6 lg:px-12">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <FaExclamationTriangle className="h-5 w-5 text-yellow-500 mr-3" />
              <h3 className="text-sm font-medium text-yellow-800">Colaborador não encontrado.</h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto px-4 sm:px-6 lg:px-12">
        {/* Cabeçalho */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FaMoneyBillWave className="h-8 w-8 text-indigo-600 mr-3" />
              Histórico de Salários
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Histórico de alterações salariais do colaborador {employee.nome}
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <button
              onClick={() => navigate(`/employees/edit/${employee.id}`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FaUserEdit className="h-4 w-4 mr-2" />
              Editar Colaborador
            </button>
            <button
              onClick={() => navigate('/employees')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FaArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </button>
          </div>
        </div>

        {/* Informações do Colaborador */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Informações do Colaborador
            </h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Nome</dt>
                <dd className="mt-1 text-sm text-gray-900">{employee.nome}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Cargo</dt>
                <dd className="mt-1 text-sm text-gray-900">{employee.cargo}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Setor</dt>
                <dd className="mt-1 text-sm text-gray-900">{employee.setor}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Salário Atual</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatCurrency(employee.salario)}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Data de Admissão</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDateOnly(employee.dataAdmissao)}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Data de Desligamento</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDateOnly(employee.dataDesligamento)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Botão para Exibir/Esconder Gráficos */}
        <div className="mb-4">
          <button
            onClick={() => setShowCharts(!showCharts)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {showCharts ? (
              <>
                <FaEyeSlash className="h-4 w-4 mr-2" />
                Esconder Gráficos
              </>
            ) : (
              <>
                <FaChartLine className="h-4 w-4 mr-2" />
                Exibir Gráficos
              </>
            )}
          </button>
        </div>

        {/* Gráficos - Renderizado condicionalmente */}
        {showCharts && salaryHistory.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 h-80">
               <Line options={salaryEvolutionChartOptions} data={salaryEvolutionChartData} />
            </div>
             <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 h-80">
               <Chart type='bar' options={salaryVariationChartOptions} data={salaryVariationChartData} />
            </div>
          </div>
        )}

        {/* Histórico de Salários */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <FaHistory className="h-5 w-5 text-indigo-600 mr-2" />
              Histórico de Alterações
            </h3>
          </div>
          <div className="border-t border-gray-200">
            {salaryHistory.length === 0 ? (
              <div className="px-4 py-5 sm:px-6 text-center text-gray-500">
                Nenhuma alteração salarial registrada.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor Anterior
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Novo Valor
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Variação
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Motivo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedSalaryHistory.map((history) => {
                      const variacao = history.valor_novo - history.valor_anterior;
                      const percentual = (variacao / history.valor_anterior) * 100;
                      
                      return (
                        <tr key={history.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <FaCalendarAlt className="h-4 w-4 text-gray-400 mr-2" />
                              {history.data_alteracao ? formatDate(new Date(history.data_alteracao)) : 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(history.valor_anterior)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {formatCurrency(history.valor_novo)}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${history.valor_novo - history.valor_anterior >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            <div className="flex items-center">
                                {history.valor_novo - history.valor_anterior >= 0 ? <FaArrowUp className="mr-1"/> : <FaArrowDown className="mr-1"/>}
                                {formatCurrency(history.valor_novo - history.valor_anterior)} ({history.valor_anterior !== 0 ? ((history.valor_novo / history.valor_anterior - 1) * 100).toFixed(2) : 'N/A'}%)
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {history.motivo || 'N/A'}
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