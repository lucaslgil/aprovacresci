import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BuildingOffice2Icon } from '@heroicons/react/24/outline';
import { ArrowLeftIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/20/solid';
import { useCompanies } from '../../hooks/useCompanies';

interface FormData {
  code: string;
  business_name: string;
  fantasy_name: string;
  person_type: 'Fisica' | 'Juridica';
  cpf: string | null;
  cnpj: string | null;
  state_registration: string | null;
  phone: string | null;
  zip_code: string | null;
  address: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  additional_data: string | null;
  status: boolean;
}

export function NewCompany() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    code: '',
    business_name: '',
    fantasy_name: '',
    person_type: 'Juridica',
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
    additional_data: null,
    status: true, // true para ativo, false para inativo
  });
  const [cepLoading, setCepLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { createCompany, nextCode, isCreating } = useCompanies();
  

  useEffect(() => {
    if (nextCode) {
      setFormData(prev => ({
        ...prev,
        code: nextCode
      }));
    }
  }, [nextCode]); // Executar apenas uma vez ao montar o componente

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCepSearch = async () => {
    const cep = formData.zip_code?.replace(/\D/g, ''); // Remove non-numeric characters
    if (!cep || cep.length !== 8) {
      setError('Por favor, insira um CEP válido com 8 dígitos.');
      return;
    }

    setCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!response.ok) {
         setError('Erro na comunicação com a API de CEP.');
         return;
      }
      const data = await response.json();

      if (data.erro) {
         setError('CEP não encontrado.');
         setFormData(prevData => ({
            ...prevData,
            address: '',
            neighborhood: '',
            city: '',
            state: '',
          }));
      } else {
        setFormData(prevData => ({
          ...prevData,
          address: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || '',
        }));
        setSuccess('Endereço preenchido com sucesso!');
      }
    } catch (error: any) {
      setError(`Erro ao buscar CEP: ${error.message}`);
    } finally {
      setCepLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Iniciando submissão do formulário...');
    
    // Resetar estados de mensagem
    setError(null);
    setSuccess(null);
    
    try {
      console.log('Validando campos obrigatórios...');
      if (!formData.business_name || (formData.person_type === 'Fisica' ? !formData.cpf : !formData.cnpj)) {
        console.log('Campos obrigatórios não preenchidos');
        setError('Por favor, preencha todos os campos obrigatórios');
        return;
      }

      // Validação de CPF/CNPJ
      console.log('Validando CPF/CNPJ...');
      if (formData.person_type === 'Fisica' && formData.cpf) {
        console.log('Validando CPF:', formData.cpf);
        const cpfRegex = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
        const cpfNumeros = formData.cpf.replace(/\D/g, '');
        console.log('CPF formatado:', cpfNumeros);
        
        if (!cpfRegex.test(cpfNumeros)) {
          console.log('CPF inválido:', formData.cpf);
          setError('Por favor, insira um CPF válido.');
          return;
        }
      } else if (formData.cnpj) {
        console.log('Validando CNPJ:', formData.cnpj);
        const cnpjRegex = /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/;
        const cnpjNumeros = formData.cnpj.replace(/\D/g, '');
        console.log('CNPJ formatado:', cnpjNumeros);
        
        if (!cnpjRegex.test(cnpjNumeros)) {
          console.log('CNPJ inválido:', formData.cnpj);
          setError('Por favor, insira um CNPJ válido.');
          return;
        }
      }

      console.log('Preparando dados para envio...');
      const companyData = {
        code: formData.code || null,
        business_name: formData.business_name,
        fantasy_name: formData.fantasy_name || null,
        person_type: formData.person_type,
        cpf: formData.person_type === 'Fisica' ? formData.cpf : null,
        cnpj: formData.person_type === 'Juridica' ? formData.cnpj : null,
        state_registration: formData.state_registration || null,
        phone: formData.phone || null,
        zip_code: formData.zip_code || null,
        address: formData.address || null,
        number: formData.number || null,
        neighborhood: formData.neighborhood || null,
        city: formData.city || null,
        state: formData.state || null,
        additional_data: formData.additional_data || null,
        status: formData.status,
      };

      console.log('Dados da empresa a serem enviados:', JSON.stringify(companyData, null, 2));
      console.log('Chamando createCompany...');
      
      setLoading(true);
      await createCompany(companyData);
      
      console.log('Empresa cadastrada com sucesso!');
      setSuccess('Cadastro realizado com sucesso!');
      
      // Navegar após 2 segundos para mostrar a mensagem de sucesso
      setTimeout(() => {
        console.log('Navegando para /cadastros/empresas...');
        navigate('/cadastros/empresas');
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao cadastrar empresa:', error);
      setError(`Erro ao cadastrar empresa: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
             <BuildingOffice2Icon className="h-8 w-8 text-cyan-600 mr-2" />
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">Novo Cadastro de Empresa</h2>
              <p className="text-sm text-gray-500">Preencha os dados da nova empresa.</p>
            </div>
          </div>
           <button
            type="button"
            onClick={() => navigate('/companies')}
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
              <label htmlFor="codigo" className="block text-sm font-medium text-gray-700">Código</label>
              <input
                id="code"
                name="code"
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Automático"
                value={formData.code || ''}
                onChange={handleChange}
              />
            </div>

            {/* Campo Razão Social (coluna 2) */}
            <div className="md:col-span-1">
              <label htmlFor="razao_social" className="block text-sm font-medium text-gray-700">Razão Social <span className="text-red-500">*</span></label>
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
              <label htmlFor="nome_fantasia" className="block text-sm font-medium text-gray-700">Nome Fantasia</label>
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
              <label htmlFor="tipo_pessoa" className="block text-sm font-medium text-gray-700">Tipo de Pessoa <span className="text-red-500">*</span></label>
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
                  <label htmlFor="inscricao_estadual" className="block text-sm font-medium text-gray-700">Inscrição Estadual</label>
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
              <label htmlFor="telefone" className="block text-sm font-medium text-gray-700">Telefone</label>
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
               <label htmlFor="cep" className="block text-sm font-medium text-gray-700">CEP</label>
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
                  <label htmlFor="endereco" className="block text-sm font-medium text-gray-700">Endereço</label>
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
                  <label htmlFor="numero" className="block text-sm font-medium text-gray-700">Número</label>
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
                  <label htmlFor="bairro" className="block text-sm font-medium text-gray-700">Bairro</label>
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
                  <label htmlFor="cidade" className="block text-sm font-medium text-gray-700">Cidade</label>
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
                  <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado</label>
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

            {/* Campo Dados Adicionais (span duas colunas) */}
             <div className="md:col-span-2">
              <label htmlFor="dados_adicionais" className="block text-sm font-medium text-gray-700">Dados Adicionais</label>
              <textarea
                id="additional_data"
                name="additional_data"
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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

          {/* Campos de Endereço */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Campo Endereço */}
            <div className="md:col-span-2">
              <label htmlFor="endereco" className="block text-sm font-medium text-gray-700">Endereço</label>
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
              <label htmlFor="numero" className="block text-sm font-medium text-gray-700">Número</label>
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

          {/* Bairro, Cidade, Estado */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Campo Bairro */}
            <div>
              <label htmlFor="bairro" className="block text-sm font-medium text-gray-700">Bairro</label>
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
              <label htmlFor="cidade" className="block text-sm font-medium text-gray-700">Cidade</label>
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
              <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado</label>
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

          {/* Campo Dados Adicionais */}
          <div className="md:col-span-2">
            <label htmlFor="dados_adicionais" className="block text-sm font-medium text-gray-700">Dados Adicionais</label>
            <textarea
              id="additional_data"
              name="additional_data"
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Dados adicionais"
              value={formData.additional_data || ''}
              onChange={handleChange}
            />
          </div>
        </div>
      </form>
    </div>
    placeholder="Telefone"
    value={formData.phone || ''}
    onChange={handleChange}
  />
</div>

{/* Campo CEP com botão de busca (coluna 2) */}
<div>
  <label htmlFor="cep" className="block text-sm font-medium text-gray-700">CEP</label>
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
    <label htmlFor="endereco" className="block text-sm font-medium text-gray-700">Endereço</label>
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
    <label htmlFor="numero" className="block text-sm font-medium text-gray-700">Número</label>
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
    <label htmlFor="bairro" className="block text-sm font-medium text-gray-700">Bairro</label>
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
    <label htmlFor="cidade" className="block text-sm font-medium text-gray-700">Cidade</label>
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
    <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado</label>
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

{/* Campo Dados Adicionais (span duas colunas) */}
<div className="md:col-span-2">
  <label htmlFor="dados_adicionais" className="block text-sm font-medium text-gray-700">Dados Adicionais</label>
  <textarea
    id="additional_data"
    name="additional_data"
    rows={3}
    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
    placeholder="Dados adicionais"
    value={formData.additional_data || ''}
    onChange={handleChange}
  />
</div>

          </div>

          {/* Botão de Submissão */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={isCreating || loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading || isCreating ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 