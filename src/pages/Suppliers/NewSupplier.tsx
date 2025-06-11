import React, { useState } from 'react';
import { databaseService, Supplier } from '../../services/database';
import { useNavigate } from 'react-router-dom';

// Assuming you have Heroicons or react-icons installed
import { BuildingOffice2Icon } from '@heroicons/react/24/outline';

interface FormData {
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  telefone: string;
  cep: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export function NewSupplier() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    nome_fantasia: '',
    razao_social: '',
    cnpj: '',
    telefone: '',
    cep: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
  });
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCepSearch = async () => {
    const cep = formData.cep.replace(/\D/g, ''); // Remove non-numeric characters
    if (cep.length !== 8) {
      ;
      return;
    }

    setCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!response.ok) {
         ;
         return;
      }
      const data = await response.json();

      if (data.erro) {
         ;
         setFormData(prevData => ({
            ...prevData,
            endereco: '',
            bairro: '',
            cidade: '',
            estado: '',
          }));
      } else {
        setFormData(prevData => ({
          ...prevData,
          endereco: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          estado: data.uf || '',
        }));
        ;
      }
    } catch (error: any) {
      ;
    } finally {
      setCepLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Basic validation (can be expanded)
      if (!formData.nome_fantasia || !formData.razao_social || !formData.cnpj) {
        ;
        setLoading(false);
        return;
      }

      const newSupplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'> = {
        nome_fantasia: formData.nome_fantasia,
        razao_social: formData.razao_social,
        cnpj: formData.cnpj,
        telefone: formData.telefone,
        cep: formData.cep,
        endereco: formData.endereco,
        numero: formData.numero,
        bairro: formData.bairro,
        cidade: formData.cidade,
        estado: formData.estado,
      };

      await databaseService.suppliers.create(newSupplier);
      ;
      navigate('/cadastros/fornecedores'); // Navigate back to the list or a success page
    } catch (error: any) {
      ;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-center">
               <BuildingOffice2Icon className="h-12 w-12 text-cyan-600" />
              <h2 className="text-3xl font-extrabold text-gray-900 ml-3">Novo Fornecedor</h2>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="rounded-md shadow-sm -space-y-px">
                <div>
                  <label htmlFor="nome_fantasia" className="sr-only">Nome Fantasia</label>
                  <input
                    id="nome_fantasia"
                    name="nome_fantasia"
                    type="text"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Nome Fantasia"
                    value={formData.nome_fantasia}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="razao_social" className="sr-only">Razão Social</label>
                  <input
                    id="razao_social"
                    name="razao_social"
                    type="text"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Razão Social"
                    value={formData.razao_social}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="cnpj" className="sr-only">CNPJ</label>
                  <input
                    id="cnpj"
                    name="cnpj"
                    type="text"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="CNPJ"
                    value={formData.cnpj}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="telefone" className="sr-only">Telefone</label>
                  <input
                    id="telefone"
                    name="telefone"
                    type="text"
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                  />
                </div>
                <div className="flex items-center">
                  <div className="flex-grow">
                    <label htmlFor="cep" className="sr-only">CEP</label>
                    <input
                      id="cep"
                      name="cep"
                      type="text"
                      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      placeholder="CEP"
                      value={formData.cep}
                      onChange={handleChange}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCepSearch}
                    className="ml-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    disabled={cepLoading || formData.cep.length !== 8}
                  >
                    {cepLoading ? 'Buscando...' : 'Buscar CEP'}
                  </button>
                </div>
                <div>
                  <label htmlFor="endereco" className="sr-only">Endereço</label>
                  <input
                    id="endereco"
                    name="endereco"
                    type="text"
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Endereço"
                    value={formData.endereco}
                    onChange={handleChange}
                    disabled // Usually populated by CEP
                  />
                </div>
                 <div>
                  <label htmlFor="numero" className="sr-only">Número</label>
                  <input
                    id="numero"
                    name="numero"
                    type="text"
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Número"
                    value={formData.numero}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="bairro" className="sr-only">Bairro</label>
                  <input
                    id="bairro"
                    name="bairro"
                    type="text"
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Bairro"
                    value={formData.bairro}
                    onChange={handleChange}
                    disabled // Usually populated by CEP
                  />
                </div>
                 <div>
                  <label htmlFor="cidade" className="sr-only">Cidade</label>
                  <input
                    id="cidade"
                    name="cidade"
                    type="text"
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Cidade"
                    value={formData.cidade}
                    onChange={handleChange}
                    disabled // Usually populated by CEP
                  />
                </div>
                 <div>
                  <label htmlFor="estado" className="sr-only">Estado</label>
                  <input
                    id="estado"
                    name="estado"
                    type="text"
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Estado"
                    value={formData.estado}
                    onChange={handleChange}
                    disabled // Usually populated by CEP
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : 'Cadastrar Fornecedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 