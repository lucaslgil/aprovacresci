import React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { MainLayout } from './components/layout/MainLayout'
import { useAuthStore } from './store/auth'
import { Dashboard } from './pages/Dashboard'
import { NewItem } from './pages/Inventory/NewItem'
import { ListItems } from './pages/Inventory/ListItems'
// Import components for Purchase Orders
import { NewPurchaseOrder } from './pages/PurchaseOrders/NewPurchaseOrder';
import { ApprovePurchaseOrders } from './pages/PurchaseOrders/ApprovePurchaseOrders';
// Import components for Settings
// import { SettingsBackup } from './pages/Settings/SettingsBackup'; // We'll create this soon
import { NewSupplier } from './pages/Suppliers/NewSupplier';
import { ListSuppliers } from './pages/Suppliers/ListSuppliers';
import { EditSupplier } from './pages/Suppliers/EditSupplier';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuthStore()

  if (loading) {
    return <div>Carregando...</div>
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  return <MainLayout>{children}</MainLayout>
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <Navigate to="/dashboard" />,
  },
  {
    path: '/dashboard',
    element: (
      <PrivateRoute>
        <Dashboard />
      </PrivateRoute>
    ),
  },
  {
    path: '/inventory',
    element: (
      <PrivateRoute>
        <ListItems />
      </PrivateRoute>
    ),
  },
  {
    path: '/inventory/new',
    element: (
      <PrivateRoute>
        <NewItem />
      </PrivateRoute>
    ),
  },
  {
    path: '/inventory/edit/:id',
    element: (
      <PrivateRoute>
        <NewItem />
      </PrivateRoute>
    ),
  },
  {
    path: '/purchase-orders',
    element: (
      <PrivateRoute>
        {/* Podemos redirecionar para a tela de nova ordem por padrão */}
        <Navigate to="/purchase-orders/new" />
      </PrivateRoute>
    ),
  },
  {
    path: '/purchase-orders/new',
    element: (
      <PrivateRoute>
        <NewPurchaseOrder />
      </PrivateRoute>
    ),
  },
  {
    path: '/purchase-orders/approve',
    element: (
      <PrivateRoute>
        <ApprovePurchaseOrders />
      </PrivateRoute>
    ),
  },
  {
    path: '/settings',
    element: (
      <PrivateRoute>
         {/* Podemos redirecionar para a tela de backup por padrão */}
        <Navigate to="/settings/backup" />
      </PrivateRoute>
    ),
  },
   {
    path: '/settings/backup',
    element: (
      <PrivateRoute>
         <div>Tela de Backup (a ser criada)</div>
        {/* <SettingsBackup /> */}
      </PrivateRoute>
    ),
  },
  {
    path: '/cadastros/fornecedores',
    element: (
      <PrivateRoute>
        <ListSuppliers />
      </PrivateRoute>
    ),
  },
  {
    path: '/cadastros/fornecedores/new',
    element: (
      <PrivateRoute>
        <NewSupplier />
      </PrivateRoute>
    ),
  },
  {
    path: '/cadastros/fornecedores/edit/:id',
    element: (
      <PrivateRoute>
        <EditSupplier />
      </PrivateRoute>
    ),
  },
]) 