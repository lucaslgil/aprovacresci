import React, { ReactNode, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import { 
  HomeIcon, 
  CubeIcon, 
  ShoppingCartIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  UsersIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline'

type MainLayoutProps = {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation()
  const { user, signOut } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [inventorySubmenuOpen, setInventorySubmenuOpen] = useState(false)
  const [purchaseOrdersSubmenuOpen, setPurchaseOrdersSubmenuOpen] = useState(false)
  const [settingsSubmenuOpen, setSettingsSubmenuOpen] = useState(false)
  const [cadastrosSubmenuOpen, setCadastrosSubmenuOpen] = useState(false)

  const isActive = (path: string) => location.pathname === path

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    {
      name: 'Cadastros',
      href: '/cadastros',
      icon: UsersIcon,
      submenu: [
        { name: 'Usuários', href: '/cadastros/usuarios' },
        { name: 'Fornecedores', href: '/cadastros/fornecedores' },
      ]
    },
    {
      name: 'Inventário',
      href: '/inventory',
      icon: CubeIcon,
      submenu: [
        { name: 'Lista de Itens', href: '/inventory' },
        { name: 'Cadastro de Item', href: '/inventory/new' },
      ]
    },
    {
      name: 'Ordens de Compra',
      href: '/purchase-orders',
      icon: ShoppingCartIcon,
      submenu: [
        { name: 'Nova Ordem', href: '/purchase-orders/new' },
        { name: 'Aprovar Ordens', href: '/purchase-orders/approve' },
      ]
    },
  ]

  const bottomNavigation = [
    {
      name: 'Configurações',
      href: '/settings',
      icon: Cog6ToothIcon,
      submenu: [
        { name: 'Backup', href: '/settings/backup' },
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar para mobile */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <span className="text-xl font-bold">AprovaCresci</span>
            <button onClick={() => setSidebarOpen(false)}>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
            {navigation.map((item) => (
              <div key={item.name}>
                {item.submenu ? (
                  <button
                    type="button"
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left ${
                      location.pathname.startsWith(item.href) ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => {
                      if (item.name === 'Inventário') setInventorySubmenuOpen(!inventorySubmenuOpen)
                      if (item.name === 'Ordens de Compra') setPurchaseOrdersSubmenuOpen(!purchaseOrdersSubmenuOpen)
                      if (item.name === 'Cadastros') setCadastrosSubmenuOpen(!cadastrosSubmenuOpen)
                    }}
                  >
                    <item.icon className="mr-3 h-6 w-6" />
                    {item.name}
                    <ChevronRightIcon
                      className={`ml-auto h-5 w-5 transform ${
                        (item.name === 'Inventário' && inventorySubmenuOpen) || (item.name === 'Ordens de Compra' && purchaseOrdersSubmenuOpen) || (item.name === 'Cadastros' && cadastrosSubmenuOpen) ? 'rotate-90' : 'rotate-0'
                      } transition-transform`}
                    />
                  </button>
                ) : (
                  <Link
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive(item.href) ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="mr-3 h-6 w-6" />
                    {item.name}
                  </Link>
                )}

                {item.submenu && 
                 ((item.name === 'Inventário' && inventorySubmenuOpen) || (item.name === 'Ordens de Compra' && purchaseOrdersSubmenuOpen) || (item.name === 'Cadastros' && cadastrosSubmenuOpen)) && (
                  <div className="ml-10 mt-1 space-y-1">
                    {item.submenu.map((subItem) => (
                      <Link
                        key={subItem.name}
                        to={subItem.href}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                          isActive(subItem.href) ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="border-t border-gray-200 px-2 py-4">
             {bottomNavigation.map((item) => (
              <div key={item.name}>
                {item.submenu ? (
                   <button
                    type="button"
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left ${
                      location.pathname.startsWith(item.href) ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => setSettingsSubmenuOpen(!settingsSubmenuOpen)}
                  >
                    <item.icon className="mr-3 h-6 w-6" />
                    {item.name}
                     <ChevronRightIcon
                      className={`ml-auto h-5 w-5 transform ${
                        settingsSubmenuOpen ? 'rotate-90' : 'rotate-0'
                      } transition-transform`}
                    />
                  </button>
                ) : (
                   <Link
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive(item.href) ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="mr-3 h-6 w-6" />
                    {item.name}
                  </Link>
                )}
                 {item.submenu && settingsSubmenuOpen && (
                  <div className="ml-10 mt-1 space-y-1">
                    {item.submenu.map((subItem) => (
                      <Link
                        key={subItem.name}
                        to={subItem.href}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                          isActive(subItem.href) ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
             ))}
             <div className="mt-4 flex items-center px-2">
                <span className="text-sm text-gray-500 mr-auto">{user?.email}</span>
                <button
                  onClick={() => signOut()}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Sair
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Sidebar para desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
          <div className="flex h-16 items-center px-4">
            <span className="text-xl font-bold">AprovaCresci</span>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <div key={item.name}>
                {item.submenu ? (
                  <button
                    type="button"
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left ${
                      location.pathname.startsWith(item.href) ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => {
                      if (item.name === 'Inventário') setInventorySubmenuOpen(!inventorySubmenuOpen)
                      if (item.name === 'Ordens de Compra') setPurchaseOrdersSubmenuOpen(!purchaseOrdersSubmenuOpen)
                      if (item.name === 'Cadastros') setCadastrosSubmenuOpen(!cadastrosSubmenuOpen)
                    }}
                  >
                    <item.icon className="mr-3 h-6 w-6" />
                    {item.name}
                    <ChevronRightIcon
                      className={`ml-auto h-5 w-5 transform ${
                        (item.name === 'Inventário' && inventorySubmenuOpen) || (item.name === 'Ordens de Compra' && purchaseOrdersSubmenuOpen) || (item.name === 'Cadastros' && cadastrosSubmenuOpen) ? 'rotate-90' : 'rotate-0'
                      } transition-transform`}
                    />
                  </button>
                ) : (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive(item.href) ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="mr-3 h-6 w-6" />
                    {item.name}
                  </Link>
                )}

                {item.submenu && 
                 ((item.name === 'Inventário' && inventorySubmenuOpen) || (item.name === 'Ordens de Compra' && purchaseOrdersSubmenuOpen) || (item.name === 'Cadastros' && cadastrosSubmenuOpen)) && (
                    <div className="ml-10 mt-1 space-y-1">
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.name}
                          to={subItem.href}
                          className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                            isActive(subItem.href) ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
            <div className="border-t border-gray-200 px-2 py-4">
               {bottomNavigation.map((item) => (
                <div key={item.name}>
                  {item.submenu ? (
                     <button
                      type="button"
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left ${
                        location.pathname.startsWith(item.href) ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      onClick={() => setSettingsSubmenuOpen(!settingsSubmenuOpen)}
                    >
                      <item.icon className="mr-3 h-6 w-6" />
                      {item.name}
                       <ChevronRightIcon
                        className={`ml-auto h-5 w-5 transform ${
                          settingsSubmenuOpen ? 'rotate-90' : 'rotate-0'
                        } transition-transform`}
                      />
                    </button>
                  ) : (
                     <Link
                      to={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        isActive(item.href) ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className="mr-3 h-6 w-6" />
                      {item.name}
                    </Link>
                  )}
                   {item.submenu && settingsSubmenuOpen && (
                    <div className="ml-10 mt-1 space-y-1">
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.name}
                          to={subItem.href}
                          className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                            isActive(subItem.href) ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
               ))}
               <div className="mt-4 flex items-center px-2">
                  <span className="text-sm text-gray-500 mr-auto">{user?.email}</span>
                  <button
                    onClick={() => signOut()}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Sair
                  </button>
               </div>
            </div>
          </div>
        </div>

      {/* Conteúdo principal */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white shadow">
          <button
            type="button"
            className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex flex-1 justify-end px-4">
            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-4">{user?.email}</span>
              <button
                onClick={() => signOut()}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sair
              </button>
            </div>
          </div>
        </div>

        <main className="py-6">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
} 