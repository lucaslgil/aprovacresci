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
    status: true,
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
  }, [nextCode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCepSearch = async () => {
    const cep = formData.zip_code?.replace(/\D/g, '');
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
      }
    } catch (error: any) {
      setError(`Erro ao buscar CEP: ${error.message}`);
    } finally {
      setCepLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      if (!formData.business_name || (formData.person_type === 'Fisica' ? !formData.cpf : !formData.cnpj)) {
        setError('Por favor, preencha todos os campos obrigatórios');
        return;
      }

      // Validação de CPF/CNPJ
      if (formData.person_type === 'Fisica' && formData.cpf) {
        const cpfRegex = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
        const cpfNumeros = formData.cpf.replace(/\D/g, '');
        
        if (!cpfRegex.test(cpfNumeros)) {
          setError('Por favor, insira um CPF válido.');
          return;
        }
      } else if (formData.cnpj) {
        const cnpjRegex = /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/;
        const cnpjNumeros = formData.cnpj.replace(/\D/g, '');
        
        if (!cnpjRegex.test(cnpjNumeros)) {
          setError('Por favor, insira um CNPJ válido.');
          return;
        }
      }

      const companyData = {
        ...formData,
        cpf: formData.person_type === 'Fisica' ? formData.cpf : null,
        cnpj: formData.person_type === 'Juridica' ? formData.cnpj : null,
      };
      
      setLoading(true);
      await createCompany(companyData);
      
      setSuccess('Cadastro realizado com sucesso!');
      
      setTimeout(() => {
        navigate('/cadastros/empresas');
      }, 2000);
    } catch (error: any) {
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
            {/* Código */}
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">Código</label>
              <input
                type="text"
                id="code"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                disabled
              />
            </div>

            {/* Razão Social */}
            <div>
              <label htmlFor="business_name" className="block text-sm font-medium text-gray-700">Razão Social *</label>
              <input
                type="text"
                id="business_name"
                name="business_name"
                value={formData.business_name}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>

            {/* Nome Fantasia */}
            <div className="md:col-span-2">
              <label htmlFor="fantasy_name" className="block text-sm font-medium text-gray-700">Nome Fantasia</label>
              <input
                type="text"
                id="fantasy_name"
                name="fantasy_name"
                value={formData.fantasy_name || ''}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {/* Tipo de Pessoa */}
            <div>
              <label htmlFor="person_type" className="block text-sm font-medium text-gray-700">Tipo de Pessoa *</label>
              <select
                id="person_type"
                name="person_type"
                value={formData.person_type}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="Fisica">Física</option>
                <option value="Juridica">Jurídica</option>
              </select>
            </div>

            {/* CPF/CNPJ */}
            <div>
              <label htmlFor={formData.person_type === 'Fisica' ? 'cpf' : 'cnpj'} className="block text-sm font-medium text-gray-700">
                {formData.person_type === 'Fisica' ? 'CPF *' : 'CNPJ *'}
              </label>
              <input
                type="text"
                id={formData.person_type === 'Fisica' ? 'cpf' : 'cnpj'}
                name={formData.person_type === 'Fisica' ? 'cpf' : 'cnpj'}
                value={formData.person_type === 'Fisica' ? (formData.cpf || '') : (formData.cnpj || '')}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>

            {/* Inscrição Estadual */}
            <div>
              <label htmlFor="state_registration" className="block text-sm font-medium text-gray-700">Inscrição Estadual</label>
              <input
                type="text"
                id="state_registration"
                name="state_registration"
                value={formData.state_registration || ''}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {/* Telefone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefone</label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {/* CEP */}
            <div className="md:col-span-2">
              <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700">CEP</label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  id="zip_code"
                  name="zip_code"
                  value={formData.zip_code || ''}
                  onChange={handleChange}
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="00000-000"
                />
                <button
                  type="button"
                  onClick={handleCepSearch}
                  disabled={cepLoading || !formData.zip_code}
                  className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cepLoading ? 'Buscando...' : 'Buscar CEP'}
                </button>
              </div>
            </div>

            {/* Endereço */}
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">Endereço</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {/* Número */}
            <div>
              <label htmlFor="number" className="block text-sm font-medium text-gray-700">Número</label>
              <input
                type="text"
                id="number"
                name="number"
                value={formData.number || ''}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {/* Bairro */}
            <div>
              <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700">Bairro</label>
              <input
                type="text"
                id="neighborhood"
                name="neighborhood"
                value={formData.neighborhood || ''}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {/* Cidade */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">Cidade</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city || ''}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {/* Estado */}
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700">Estado</label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state || ''}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {/* Dados Adicionais */}
            <div className="md:col-span-2">
              <label htmlFor="additional_data" className="block text-sm font-medium text-gray-700">Dados Adicionais</label>
              <textarea
                id="additional_data"
                name="additional_data"
                rows={3}
                value={formData.additional_data || ''}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
