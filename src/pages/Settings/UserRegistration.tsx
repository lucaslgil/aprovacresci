import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { accessProfileService } from '../../services/accessProfileService';

interface User {
  id: string;
  name: string;
  email: string;
  access_profile_id: string | null;
}

interface AccessProfile {
  id: string;
  name: string;
}

const UserRegistration: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [profiles, setProfiles] = useState<AccessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', access_profile_id: '' });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [usersData, profilesData] = await Promise.all([
        userService.list(),
        accessProfileService.list()
      ]);
      setUsers(usersData || []);
      setProfiles(profilesData || []);
      // Corrige o perfil selecionado caso não exista mais
      if (profilesData && profilesData.length > 0 && !profilesData.find(p => p.id === form.access_profile_id)) {
        setForm(f => ({ ...f, access_profile_id: profilesData[0].id }));
      }
    } catch {
      setError('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }

  const handleNewUser = () => {
    setEditingUser(null);
    setForm({ name: '', email: '', password: '', access_profile_id: profiles[0]?.id || '' });
    setShowModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: '', // senha não é editada aqui
      access_profile_id: user.access_profile_id || profiles[0]?.id || ''
    });
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingUser) {
        // Atualiza apenas o perfil de acesso e nome
        await userService.update(editingUser.id, {
          name: form.name,
          access_profile_id: form.access_profile_id
        });
      } else {
        // Chamada para endpoint backend de criação de usuário no Auth + tabela users
        await fetch('/api/createUser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            access_profile_id: form.access_profile_id
          })
        });
      }
      setShowModal(false);
      fetchAll();
    } catch {
      setError('Erro ao salvar usuário.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-md max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Cadastro de Usuários</h1>
      <p className="mb-6 text-gray-600">Cadastre novos usuários e vincule-os a um perfil de acesso.</p>
      <div className="flex justify-end mb-4">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          onClick={handleNewUser}
        >
          Novo Usuário
        </button>
      </div>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {loading ? (
        <div>Carregando...</div>
      ) : (
        <table className="min-w-full bg-white border rounded">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 text-left">Nome</th>
              <th className="py-2 px-4 text-left">E-mail</th>
              <th className="py-2 px-4 text-left">Perfil de Acesso</th>
              <th className="py-2 px-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="py-2 px-4">{user.name}</td>
                <td className="py-2 px-4">{user.email}</td>
                <td className="py-2 px-4 text-xs text-gray-600">
                  {profiles.find(p => p.id === user.access_profile_id)?.name || '-'}
                </td>
                <td className="py-2 px-4 text-center">
                  <button
                    className="text-blue-600 hover:underline mr-2"
                    onClick={() => handleEditUser(user)}
                  >
                    Editar
                  </button>
                  {/* <button className="text-red-500 hover:underline">Excluir</button> */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Modal de cadastro/edição de usuário */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  name="name"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input
                  type="email"
                  name="email"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <input
                  type="password"
                  name="password"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.password}
                  onChange={handleChange}
                  required={!editingUser}
                  autoComplete="new-password"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Perfil de Acesso</label>
                <select
                  name="access_profile_id"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.access_profile_id}
                  onChange={handleChange}
                  required
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 rounded mr-2"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRegistration;
