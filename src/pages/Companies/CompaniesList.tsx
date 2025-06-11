import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BuildingOffice2Icon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useCompanies } from '../../hooks/useCompanies';

export function CompaniesList() {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [companyToDeleteId, setCompanyToDeleteId] = useState<string | null>(null);
  
  // Usando o hook useCompanies para gerenciar o estado das empresas
  const {
    companies = [],
    isLoading,
    error,
    deleteCompany,
    isDeleting
  } = useCompanies();

  const confirmDelete = (id: string) => {
    setCompanyToDeleteId(id);
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    if (!companyToDeleteId || isDeleting) return;

    try {
      await deleteCompany(companyToDeleteId);
      ;
    } catch (err: any) {
      ;
    } finally {
      setShowDeleteModal(false);
      setCompanyToDeleteId(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setCompanyToDeleteId(null);
  };

  if (isLoading) {
    return <div className="text-center text-gray-600 py-8">Carregando empresas...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600 py-8">Erro ao carregar empresas: {error.message}</div>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Empresas</h1>
          <p className="mt-2 text-sm text-gray-700">
            Lista de todas as empresas cadastradas no sistema.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            to="/cadastros/empresas/new"
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <BuildingOffice2Icon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Nova Empresa
          </Link>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Código
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Nome Fantasia
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Razão Social
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Documento
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Telefone
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Cidade/UF
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {companies.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-4 text-sm text-gray-500 text-center">
                        Nenhuma empresa cadastrada.
                      </td>
                    </tr>
                  ) : (
                    companies.map((company) => (
                      <tr key={company.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {company.code || 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 font-medium">
                          {company.fantasy_name || 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {company.business_name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {company.person_type === 'Fisica' ? company.cpf : company.cnpj || 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {company.phone || 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {company.city ? `${company.city}/${company.state || ''}` : 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${company.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {company.status ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex items-center justify-end gap-4">
                            <Link 
                              to={`/cadastros/empresas/edit/${company.id}`} 
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Editar"
                            >
                              <PencilIcon className="h-5 w-5" aria-hidden="true" />
                            </Link>
                            <button
                              onClick={() => confirmDelete(company.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Excluir"
                            >
                              <TrashIcon className="h-5 w-5" aria-hidden="true" />
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
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={cancelDelete}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Confirmar Exclusão
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={executeDelete}
                >
                  Excluir
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={cancelDelete}
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
