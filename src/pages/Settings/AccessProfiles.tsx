import React, { useState, useEffect } from 'react';
import { accessProfileService } from '../../services/accessProfileService';
import { accessPermissionService } from '../../services/accessPermissionService';

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
    if (!profileName.trim()) return;
    setSaving(true);
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
    } catch (err) {
      setError('Erro ao salvar perfil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-md max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Perfis de Acesso</h1>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          onClick={handleNewProfile}
        >
          Novo Perfil
        </button>
      </div>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {loading ? (
        <div>Carregando...</div>
      ) : (
        <table className="min-w-full bg-white border rounded">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 text-left">Nome do Perfil</th>
              <th className="py-2 px-4 text-left">Permissões</th>
              <th className="py-2 px-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => (
              <ProfileRow key={profile.id} profile={profile} onEdit={handleEditProfile} />
            ))}
          </tbody>
        </table>
      )}
      {/* Modal de cadastro/edição de perfil */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingProfile ? 'Editar Perfil' : 'Novo Perfil'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Perfil</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  placeholder="Ex: Administrador, RH, Financeiro..."
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissões</label>
                <div className="grid grid-cols-1 gap-2">
                  {PERMISSIONS.map((perm) => (
                    <label key={perm} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="accent-blue-600"
                        checked={selectedPermissions.includes(perm)}
                        onChange={() => handlePermissionChange(perm)}
                        disabled={saving}
                      />
                      {perm}
                    </label>
                  ))}
                </div>
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

// Componente para exibir cada linha de perfil com permissões
function ProfileRow({ profile, onEdit }: { profile: AccessProfile, onEdit: (p: AccessProfile) => void }) {
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
    <tr className="border-t">
      <td className="py-2 px-4">{profile.name}</td>
      <td className="py-2 px-4 text-xs text-gray-600">{perms.join(', ')}</td>
      <td className="py-2 px-4 text-center">
        <button
          className="text-blue-600 hover:underline mr-2"
          onClick={() => onEdit(profile)}
        >
          Editar
        </button>
        {/* <button className="text-red-500 hover:underline">Excluir</button> */}
      </td>
    </tr>
  );
}

export default AccessProfiles;
