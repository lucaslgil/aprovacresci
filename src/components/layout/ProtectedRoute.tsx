import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissionsStore } from '../../store/permissions';

interface ProtectedRouteProps {
  requiredPermissions: string[];
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredPermissions, children }) => {
  const permissions = usePermissionsStore((state) => state.permissions);
  // Se o usuário não tem nenhuma das permissões necessárias, bloqueia
  const hasPermission = requiredPermissions.some((perm) => permissions.includes(perm));
  if (!hasPermission) {
    return <div style={{ padding: 32, color: 'red', fontWeight: 'bold' }}>Acesso negado</div>;
    // Ou: return <Navigate to="/dashboard" />;
  }
  return <>{children}</>;
};
