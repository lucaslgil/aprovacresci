import React, { useState, useEffect } from 'react';
import { accessProfileService } from '../../services/accessProfileService';
import { accessPermissionService } from '../../services/accessPermissionService';
import { FaEdit, FaTrash, FaUserShield } from 'react-icons/fa';
import { UserGroupIcon } from '@heroicons/react/24/outline';

interface AccessProfile {
  id: string;
  name: string;
}

const PERMISSIONS = [
  'Dashboard',
  'Funcionários',
  'Inventário',
  'Ordens de Compra',
  'Fornecedores',
  'Empresas',
  'Configurações',
];

const AccessProfiles: React.FC = () => {
  const [profiles, setProfiles] = useState<AccessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<AccessProfile | null>(null);
  const [profileName, setProfileName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<AccessProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    setLoading(true);
    try {
      const data = await accessProfileService.list();
      setProfiles(data || []);
    } catch (err) {
      setError('Erro ao carregar perfis.');
    } finally {
      setLoading(false);
    }
  }

  const handleNewProfile = () => {
    setEditingProfile(null);
    setProfileName('');
    setSelectedPermissions([]);
    setShowModal(true);
  };

  const handleEditProfile = async (profile: AccessProfile) => {
    setEditingProfile(profile);
    setProfileName(profile.name);
    setSelectedPermissions([]);
    setShowModal(true);
    try {
      const perms = await accessPermissionService.listByProfile(profile.id);
      setSelectedPermissions(perms);
    } catch {
      setSelectedPermissions([]);
    }
  };

  const handlePermissionChange = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null); // Limpa erro anterior
    try {
      let profileId = editingProfile?.id;
      if (editingProfile) {
        await accessProfileService.update(editingProfile.id, { name: profileName });
      } else {
        const created = await accessProfileService.create({ name: profileName });
        profileId = created.id;
      }
      if (profileId) {
        await accessPermissionService.setPermissions(profileId, selectedPermissions);
      }
      setShowModal(false);
      fetchProfiles();
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar perfil.');
    } finally {
      setSaving(false);
    }
  };

  // Função para remover perfil
  const handleDeleteProfile = async () => {
    if (!profileToDelete) return;
    setDeleting(true);
    setError(null);
    try {
      await accessProfileService.remove(profileToDelete.id);
      setProfiles((prev) => prev.filter((p) => p.id !== profileToDelete.id)); // Remove localmente
      setProfileToDelete(null);
    } catch (err: any) {
      setError(err?.message || 'Erro ao excluir perfil.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto px-4 sm:px-6 lg:px-12 max-w-4xl">
        {/* Cabeçalho */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FaUserShield className="h-8 w-8 text-indigo-600 mr-3" />
              Perfis de Acesso
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Gerencie os perfis e permissões do sistema.
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={handleNewProfile}
            >
              <UserGroupIcon className="h-5 w-5 mr-2" /> Novo Perfil
            </button>
          </div>
        </div>
        {/* Mensagens de Erro */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 shadow-sm">
            <div className="flex items-center">
              <FaUserShield className="h-5 w-5 text-red-500 mr-3" />
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        )}
        {/* Card principal */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 mb-8">
          {loading ? (
            <div>Carregando...</div>
          ) : (
            <div className="overflow-x-auto rounded-lg">
              <table className="min-w-full bg-white border rounded-xl text-sm">
                <thead>
                  <tr className="bg-blue-50 text-[#002943]">
                    <th className="py-2 px-4 text-left font-semibold">Nome do Perfil</th>
                    <th className="py-2 px-4 text-left font-semibold">Permissões</th>
                    <th className="py-2 px-4 text-center font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((profile, idx) => (
                    <ProfileRow key={profile.id} profile={profile} onEdit={handleEditProfile} onDelete={setProfileToDelete} zebra={idx % 2 === 1} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {/* Modal de cadastro/edição de perfil */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-blue-100 p-8 w-full max-w-2xl animate-fade-in">
              <h2 className="text-2xl font-bold mb-4 text-[#002943] flex items-center gap-2">
                <FaUserShield className="h-6 w-6 text-[#002943]" />
                {editingProfile ? 'Editar Perfil' : 'Novo Perfil'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-[#002943] mb-1">Nome do Perfil</label>
                    <input
                      type="text"
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#002943]"
                      value={profileName}
                      onChange={e => setProfileName(e.target.value)}
                      placeholder="Ex: Administrador, RH, Financeiro..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#002943] mb-2">Permissões</label>
                    <div className="grid grid-cols-1 gap-2">
                      {PERMISSIONS.map((perm) => (
                        <label key={perm} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="accent-[#002943] h-4 w-4 rounded"
                            checked={selectedPermissions.includes(perm)}
                            onChange={() => handlePermissionChange(perm)}
                            disabled={saving}
                          />
                          <span className="text-[#002943]">{perm}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 rounded-lg"
                    onClick={() => setShowModal(false)}
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700" disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Modal de confirmação de exclusão */}
        {profileToDelete && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-red-200 p-8 w-full max-w-md animate-fade-in">
              <h2 className="text-2xl font-bold mb-4 text-red-700 flex items-center gap-2">
                <FaUserShield className="h-6 w-6 text-red-700" />
                Excluir Perfil
              </h2>
              <p className="mb-4 text-[#002943]">Tem certeza que deseja excluir o perfil <b>{profileToDelete.name}</b>? Esta ação não pode ser desfeita.</p>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 bg-gray-200 rounded-lg"
                  onClick={() => setProfileToDelete(null)}
                  disabled={deleting}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700"
                  onClick={handleDeleteProfile}
                  disabled={deleting}
                >
                  {deleting ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente para exibir cada linha de perfil com permissões
function ProfileRow({ profile, onEdit, onDelete, zebra }: { profile: AccessProfile, onEdit: (p: AccessProfile) => void, onDelete: (p: AccessProfile) => void, zebra?: boolean }) {
  const [perms, setPerms] = React.useState<string[]>([]);
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await accessPermissionService.listByProfile(profile.id);
        if (mounted) setPerms(data);
      } catch {
        if (mounted) setPerms([]);
      }
    })();
    return () => { mounted = false; };
  }, [profile.id]);
  return (
    <tr className={zebra ? 'bg-blue-50/40 hover:bg-blue-100/60' : 'hover:bg-blue-50/60'}>
      <td className="py-1.5 px-4 font-medium text-[#002943] align-middle">{profile.name}</td>
      <td className="py-1.5 px-4 text-xs text-gray-600 align-middle">{perms.join(', ')}</td>
      <td className="py-1.5 px-4 text-center align-middle">
        <div className="flex items-center justify-center gap-2">
          <button
            className="inline-flex items-center gap-1 text-indigo-700 hover:text-indigo-900 font-semibold px-2 py-1 rounded transition-colors"
            onClick={() => onEdit(profile)}
          >
            <FaEdit className="h-4 w-4" /> Editar
          </button>
          <button
            className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-semibold px-2 py-1 rounded transition-colors"
            onClick={() => onDelete(profile)}
          >
            <FaTrash className="h-4 w-4" /> Excluir
          </button>
        </div>
      </td>
    </tr>
  );
}

export default AccessProfiles;
