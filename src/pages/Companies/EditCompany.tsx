import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BuildingOffice2Icon } from '@heroicons/react/24/outline';
import { ArrowLeftIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/20/solid';
import { useCompanies } from '../../hooks/useCompanies';
import { CompanyFormData } from '../../types/Company';
import { useAuthStore } from '../../store/auth';


// Usamos CompanyFormData importado de types/Company

export function EditCompany() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CompanyFormData>({
    code: null,
    business_name: '',
    fantasy_name: null,
    person_type: 'Juridica', // Valor padrão, será sobrescrito pelos dados carregados
    cpf: null,
    cnpj: null,
    state_registration: null,
    phone: null,
    zip_code: null,
    address: null,
    number: null,
    neighborhood: null,
    city: null,
    state: null,
    status: true, // Valor padrão, será sobrescrito pelos dados carregados
    additional_data: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const { updateCompanyWithFormik, companies, isLoading, error: companiesError } = useCompanies();
  const { user } = useAuthStore();
  
  // Verifica se o usuário está logado
  if (!user) {
    navigate('/login');
    return null;
  }
  
  const [saving, setSaving] = useState(false);

  // Buscar os dados da empresa quando o componente montar ou o ID mudar
  useEffect(() => {
    console.log('ID recebido:', id);
    console.log('Empresas carregadas:', companies);
    
    if (!id) {
      ;
      return;
    }

    const company = companies.find(c => c.id === id);
    console.log('Empresa encontrada:', company);
    
    if (company) {
      setFormData({
        code: company.code ?? null,
        business_name: company.business_name,
        fantasy_name: company.fantasy_name ?? null,
        person_type: company.person_type,
        cpf: company.cpf ?? null,
        cnpj: company.cnpj ?? null,
        state_registration: company.state_registration ?? null,
        phone: company.phone ?? null,
        zip_code: company.zip_code ?? null,
        address: company.address ?? null,
        number: company.number ?? null,
        neighborhood: company.neighborhood ?? null,
        city: company.city ?? null,
        state: company.state ?? null,
        status: company.status,
        additional_data: company.additional_data ?? null,
      });
    }
  }, [id, companies]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // Lidar com checkbox para o campo 'status'
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData({ ...formData, [name]: newValue });
  };

  const handleCepSearch = async () => {
    const cep = formData.zip_code?.replace(/\D/g, ''); // Remove non-numeric characters
    if (!cep || cep.length !== 8) {
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
         setFormData((prevData: CompanyFormData) => ({
            ...prevData,
            address: null,
            neighborhood: null,
            city: null,
            state: null,
          }));
      } else {
        setFormData((prevData: CompanyFormData) => ({
          ...prevData,
          address: data.logradouro || null,
          neighborhood: data.bairro || null,
          city: data.localidade || null,
          state: data.uf || null,
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
    
    // Validar se o ID é uma UUID válida
    if (!id || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)) {
      setError('ID da empresa inválido');
      return;
    }

    setSaving(true);
    setError(null);

    const cleanData = {
      code: formData.code || null,
      business_name: formData.business_name.trim(),
      fantasy_name: formData.fantasy_name?.trim() || null,
      person_type: formData.person_type,
      cpf: formData.cpf?.trim() || null,
      cnpj: formData.cnpj?.trim() || null,
      state_registration: formData.state_registration?.trim() || null,
      phone: formData.phone?.trim() || null,
      zip_code: formData.zip_code?.trim() || null,
      address: formData.address?.trim() || null,
      number: formData.number?.trim() || null,
      neighborhood: formData.neighborhood?.trim() || null,
      city: formData.city?.trim() || null,
      state: formData.state?.trim() || null,
      status: formData.status ?? null,
      additional_data: formData.additional_data?.trim() || null
    } as CompanyFormData;

    // Adiciona o updated_by do usuário logado
    cleanData.updated_by = user.id;

    try {
      await updateCompanyWithFormik(cleanData, id);
      setSuccess('Empresa atualizada com sucesso!');
      setError(null);
      setTimeout(() => {
        navigate('/cadastros/empresas');
      }, 1500);
    } catch (error) {
      setError('Erro ao atualizar empresa. Por favor, tente novamente.');
      console.error('Erro ao atualizar empresa:', error);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center text-gray-600">Carregando...</div>;
  }

  if (companiesError) {
      return <div className="text-center text-red-600">Erro: {companiesError instanceof Error ? companiesError.message : String(companiesError)}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
             <BuildingOffice2Icon className="h-8 w-8 text-cyan-600 mr-2" />
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">Editar Cadastro de Empresa</h2>
              <p className="text-sm text-gray-500">Atualize os dados da empresa.</p>
            </div>
          </div>
           <button
            type="button"
            onClick={() => navigate('/cadastros/empresas')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" aria-hidden="true" />
            Voltar
          </button>
        </div>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Mensagem de Sucesso */}
          {success && (
            <div className="rounded-md bg-green-50 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Mensagem de Erro */}
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Campo Código */}
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">Código</label>
              <input
                id="code"
                name="code"
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Código"
                value={formData.code || ''}
                onChange={handleChange}
              />
            </div>

            {/* Campo Razão Social (coluna 2) */}
            <div className="md:col-span-1">
              <label htmlFor="business_name" className="block text-sm font-medium text-gray-700">Razão Social <span className="text-red-500">*</span></label>
              <input
                id="business_name"
                name="business_name"
                type="text"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Razão Social"
                value={formData.business_name}
                onChange={handleChange}
              />
            </div>

            {/* Campo Nome Fantasia (coluna 1) */}
            <div>
              <label htmlFor="fantasy_name" className="block text-sm font-medium text-gray-700">Nome Fantasia</label>
              <input
                id="fantasy_name"
                name="fantasy_name"
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Nome Fantasia"
                value={formData.fantasy_name || ''}
                onChange={handleChange}
              />
            </div>

            {/* Campo Tipo de Pessoa (coluna 2) */}
            <div className="md:col-span-1">
              <label htmlFor="person_type" className="block text-sm font-medium text-gray-700">Tipo de Pessoa <span className="text-red-500">*</span></label>
              <select
                id="person_type"
                name="person_type"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.person_type}
                onChange={handleChange}
              >
                <option value="Juridica">Pessoa Jurídica</option>
                <option value="Fisica">Pessoa Física</option>
              </select>
            </div>

            {/* Campos de Documento Condicionais (span duas colunas) */}
            {formData.person_type === 'Fisica' ? (
              // Campo CPF para Pessoa Física
              <div className="md:col-span-2">
                <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">CPF <span className="text-red-500">*</span></label>
                <input
                  id="cpf"
                  name="cpf"
                  type="text"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="CPF"
                  value={formData.cpf || ''}
                  onChange={handleChange}
                />
              </div>
            ) : (
              // Campos CNPJ e Inscrição Estadual para Pessoa Jurídica
              <>
                {/* Campo CNPJ (coluna 1) */}
                <div>
                  <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700">CNPJ <span className="text-red-500">*</span></label>
                  <input
                    id="cnpj"
                    name="cnpj"
                    type="text"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="CNPJ"
                    value={formData.cnpj || ''}
                    onChange={handleChange}
                  />
                </div>
                {/* Campo Inscrição Estadual (coluna 2) */}
                <div>
                  <label htmlFor="state_registration" className="block text-sm font-medium text-gray-700">Inscrição Estadual</label>
                  <input
                    id="state_registration"
                    name="state_registration"
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Inscrição Estadual"
                    value={formData.state_registration || ''}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}

            {/* Campo Telefone (coluna 1) */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefone</label>
              <input
                id="phone"
                name="phone"
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Telefone"
                value={formData.phone || ''}
                onChange={handleChange}
              />
            </div>

            {/* Campo CEP com botão de busca (coluna 2) */}
            <div>
               <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700">CEP</label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  id="zip_code"
                  name="zip_code"
                  type="text"
                  className="block w-full rounded-none rounded-l-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="CEP"
                  value={formData.zip_code || ''}
                  onChange={handleChange}
                />
                 <button
                    type="button"
                    onClick={handleCepSearch}
                    className="inline-flex items-center rounded-none rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                    disabled={cepLoading || (formData.zip_code?.replace(/\D/g, '').length !== 8)}
                  >
                    {cepLoading ? 'Buscando...' : 'Buscar'}
                  </button>
              </div>
            </div>

             {/* Campos de Endereço (span duas colunas) */}
             <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Campo Endereço */}
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">Endereço</label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Endereço"
                    value={formData.address || ''}
                    onChange={handleChange}
                    disabled
                  />
                </div>
                {/* Campo Número */}
                <div>
                  <label htmlFor="number" className="block text-sm font-medium text-gray-700">Número</label>
                  <input
                    id="number"
                    name="number"
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Número"
                    value={formData.number || ''}
                    onChange={handleChange}
                  />
                </div>
             </div>

            {/* Bairro, Cidade, Estado (span duas colunas, em 3 colunas internas)*/}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Campo Bairro */}
                <div>
                  <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700">Bairro</label>
                  <input
                    id="neighborhood"
                    name="neighborhood"
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Bairro"
                    value={formData.neighborhood || ''}
                    onChange={handleChange}
                    disabled
                  />
                </div>
                 {/* Campo Cidade */}
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">Cidade</label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Cidade"
                    value={formData.city || ''}
                    onChange={handleChange}
                    disabled
                  />
                </div>
                 {/* Campo Estado */}
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700">Estado</label>
                  <input
                    id="state"
                    name="state"
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Estado"
                    value={formData.state || ''}
                    onChange={handleChange}
                    disabled
                  />
                </div>
            </div>

             {/* Campo Situação (coluna 1) */}
            <div>
               <label htmlFor="status" className="block text-sm font-medium text-gray-700">Situação</label>
                <div className="flex items-center">
                  <input
                    id="status"
                    name="status"
                    type="checkbox"
                    checked={formData.status}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="status" className="ml-2 block text-sm text-gray-700">
                    Ativo
                  </label>
                </div>
            </div>

            {/* Campo Dados Adicionais (coluna 2) */}
             <div>
              <label htmlFor="additional_data" className="block text-sm font-medium text-gray-700">Dados Adicionais</label>
              <textarea
                id="additional_data"
                name="additional_data"
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Informações adicionais"
                value={formData.additional_data || ''}
                onChange={handleChange}
              />
            </div>

          </div>

          {/* Botão de Submissão */}
          <div className="pt-6">
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Atualizar Empresa'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
} 