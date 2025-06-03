import React, { useEffect, useState } from 'react';
import { databaseService, Supplier } from '../../services/database';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { BuildingOffice2Icon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

export function ListSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        const data = await databaseService.suppliers.getAll();
        setSuppliers(data);
      } catch (err: any) {
        setError(err.message);
        toast.error(`Erro ao buscar fornecedores: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este fornecedor?')) {
      try {
        await databaseService.suppliers.delete(id);
        setSuppliers(suppliers.filter(supplier => supplier.id !== id));
        toast.success('Fornecedor excluído com sucesso!');
      } catch (err: any) {
        toast.error(`Erro ao excluir fornecedor: ${err.message}`);
      }
    }
  };

  if (loading) {
    return <div className="text-center text-gray-600">Carregando fornecedores...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600">Erro: {error}</div>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Fornecedores</h1>
          <p className="mt-2 text-sm text-gray-700">
            Uma lista de todos os fornecedores cadastrados.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            to="/cadastros/fornecedores/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            Cadastrar Fornecedor
          </Link>
        </div>
      </div>
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      Nome Fantasia
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Razão Social
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      CNPJ
                    </th>
                     <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Telefone
                    </th>
                     <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      CEP
                    </th>
                     <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Cidade/Estado
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {supplier.nome_fantasia}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {supplier.razao_social}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {supplier.cnpj}
                      </td>
                       <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {supplier.telefone}
                      </td>
                       <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {supplier.cep}
                      </td>
                       <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {`${supplier.cidade || ''}/${supplier.estado || ''}`}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <Link to={`/cadastros/fornecedores/edit/${supplier.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                           <PencilIcon className="h-5 w-5" aria-hidden="true" />
                        </Link>
                         <button
                          onClick={() => handleDelete(supplier.id)}
                          className="text-red-600 hover:text-red-900"
                         >
                           <TrashIcon className="h-5 w-5" aria-hidden="true" />
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 