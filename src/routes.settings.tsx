// Rotas de Configurações
import React from 'react';
import { RouteObject } from 'react-router-dom';
import AccessProfiles from './pages/Settings/AccessProfiles';
import UserRegistration from './pages/Settings/UserRegistration';

export const settingsRoutes: RouteObject[] = [
  {
    path: '/settings/access-profiles',
    element: <AccessProfiles />,
  },
  {
    path: '/settings/user-registration',
    element: <UserRegistration />,
  },
];
