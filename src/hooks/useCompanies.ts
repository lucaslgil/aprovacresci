import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databaseService } from '../services/database';
import { Company } from '../types/Company';
import { useCompanies } from '../hooks/useCompanies';

export function useCompanies() {
  const queryClient = useQueryClient();

  // Buscar todas as empresas
  const { 
    data: companies = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery<Company[], Error>({
    queryKey: ['companies'],
    queryFn: async () => {
      try {
        return await databaseService.companies.getAll();
      } catch (error) {
        console.error('Erro ao buscar empresas:', error);
        throw new Error('Falha ao carregar empresas');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Criar uma nova empresa
  const createCompany = useMutation<Company, Error, Omit<Company, 'id' | 'created_at' | 'situacao'>>({
    mutationFn: async (companyData) => {
      try {
        return await databaseService.companies.create(companyData);
      } catch (error) {
        console.error('Erro ao criar empresa:', error);
        throw new Error('Falha ao criar empresa');
      }
    },
    onSuccess: () => {
      // Invalida a query de empresas para forçar um novo fetch
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });

  // Atualizar uma empresa existente
  const updateCompany = useMutation<Company, Error, [string, Partial<Omit<Company, 'created_at'>>]>({
    mutationFn: async ([id, data]) => {
      try {
        return await databaseService.companies.update(id, data);
      } catch (error) {
        console.error('Erro ao atualizar empresa:', error);
        throw new Error('Falha ao atualizar empresa');
      }
    },
    onSuccess: () => {
      // Invalida a query de empresas para forçar um novo fetch
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });

  // Função auxiliar para usar com o Formik
  const updateCompanyWithFormik = async (values: Partial<Omit<Company, 'created_at'>>, id: string) => {
    return await updateCompany.mutateAsync([id, values]);
  };

  // Excluir uma empresa
  const deleteCompany = useMutation<void, Error, string>({
    mutationFn: async (id) => {
      try {
        await databaseService.companies.delete(id);
      } catch (error) {
        console.error('Erro ao excluir empresa:', error);
        throw new Error('Falha ao excluir empresa');
      }
    },
    onSuccess: () => {
      // Invalida a query de empresas para forçar um novo fetch
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });

  // Buscar o próximo código disponível
  const { data: nextCode } = useQuery<string>({
    queryKey: ['nextCompanyCode'],
    queryFn: async () => {
      try {
        return await databaseService.companies.getNextCode();
      } catch (error) {
        console.error('Erro ao buscar próximo código:', error);
        return '1'; // Valor padrão em caso de erro
      }
    },
    enabled: true, // Habilita a busca automática
  });

  return {
    companies,
    isLoading,
    error,
    refetch,
    createCompany: createCompany.mutateAsync,
    updateCompany: updateCompany.mutateAsync,
    updateCompanyWithFormik,
    deleteCompany: deleteCompany.mutateAsync,
    nextCode,
    isCreating: createCompany.isPending,
    isUpdating: updateCompany.isPending,
    isDeleting: deleteCompany.isPending,
  };
}
