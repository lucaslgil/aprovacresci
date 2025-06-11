import React, { ReactNode, useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import logo from '../../assets/images/logo-aprova-cresci.png.jpg'; // Verifique se o caminho do logo está correto
import {
  HomeIcon,
  CubeIcon,
  ShoppingCartIcon,
  Cog6ToothIcon,
  UsersIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

// --- TIPOS ---
type MainLayoutProps = {
  children: ReactNode;
};

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  submenu?: { name: string; href: string }[];
};

// --- DADOS DE NAVEGAÇÃO ---
const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    {
      name: 'Inventário',
      href: '/inventory',
      icon: CubeIcon,
      submenu: [
        { name: 'Lista de Itens', href: '/inventory' },
        { name: 'Novo Item', href: '/inventory/new' },
        { name: 'Importar Itens', href: '/inventory/import' },
      ],
    },
    {
      name: 'Ordens de Compra',
      href: '/purchase-orders/approve',
      icon: ShoppingCartIcon,
      submenu: [
        { name: 'Nova Ordem', href: '/purchase-orders/new' },
        { name: 'Lista de Ordens', href: '/purchase-orders/approve' }
      ],
    },
    {
      name: 'Cadastros',
      href: '/cadastros',
      icon: UsersIcon,
      submenu: [
        { name: 'Fornecedores', href: '/cadastros/fornecedores' },
        { name: 'Empresas', href: '/cadastros/empresas' },
        { name: 'Funcionários', href: '/employees' },
      ],
    },
    {
      name: 'Configurações',
      href: '/configuracoes',
      icon: Cog6ToothIcon,
      submenu: [{ name: 'Backup', href: '/configuracoes/backup' }],
    },
];

// --- COMPONENTE REUTILIZÁVEL PARA O CONTEÚDO DA SIDEBAR ---
function SidebarContent() {
  const location = useLocation();
  const [openSubmenus, setOpenSubmenus] = useState<Set<string>>(new Set());

  // Abre o submenu ativo quando a página é carregada ou a rota muda
  useEffect(() => {
    const activeParent = navigation.find(item => item.submenu && location.pathname.startsWith(item.href));
    if (activeParent && !openSubmenus.has(activeParent.name)) {
        const newOpenSubmenus = new Set(openSubmenus);
        newOpenSubmenus.add(activeParent.name);
        setOpenSubmenus(newOpenSubmenus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const isActive = (path: string, hasSubmenu = false) => {
    // Se for um item de menu pai, verifica se a rota começa com o href dele
    if (hasSubmenu) {
      return location.pathname.startsWith(path);
    }
    // Para itens filhos ou sem submenu, verifica a rota exata
    return location.pathname === path;
  };

  const toggleSubmenu = (name: string) => {
    const newOpenSubmenus = new Set(openSubmenus);
    if (newOpenSubmenus.has(name)) {
      newOpenSubmenus.delete(name);
    } else {
      newOpenSubmenus.add(name);
    }
    setOpenSubmenus(newOpenSubmenus);
  };

  return (
    <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
      {navigation.map((item) => (
        <div key={item.name}>
          {!item.submenu ? (
            <Link
              to={item.href}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive(item.href)
                  ? 'bg-gray-200 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <item.icon className="mr-3 flex-shrink-0 h-6 w-6" />
              {item.name}
            </Link>
          ) : (
            <>
              <button
                type="button"
                onClick={() => toggleSubmenu(item.name)}
                className={`group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md w-full text-left ${
                  isActive(item.href, true)
                    ? 'bg-gray-200 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="flex items-center">
                    <item.icon className="mr-3 flex-shrink-0 h-6 w-6" />
                    {item.name}
                </span>
                <ChevronRightIcon
                  className={`ml-auto h-5 w-5 transform transition-transform duration-200 ${
                    openSubmenus.has(item.name) ? 'rotate-90' : 'rotate-0'
                  }`}
                />
              </button>
              {openSubmenus.has(item.name) && (
                <div className="ml-9 mt-1 space-y-1">
                  {item.submenu.map((subItem) => (
                    <Link
                      key={subItem.name}
                      to={subItem.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full ${
                        isActive(subItem.href)
                          ? 'text-gray-900 font-semibold'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      {subItem.name}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </nav>
  );
}


// --- COMPONENTE PRINCIPAL DO LAYOUT ---
export function MainLayout({ children }: MainLayoutProps): JSX.Element {
  const { user, signOut } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Overlay para fechar o menu mobile ao clicar fora */}
      {sidebarOpen && (
          <div className="fixed inset-0 z-30 bg-gray-600 bg-opacity-75 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Menu lateral para mobile (off-canvas) */}
      <div
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-white transform transition-transform duration-300 ease-in-out lg:hidden ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
            <img src={logo} alt="AprovaCresci Logo" className="h-10 w-auto"/>
            <button onClick={() => setSidebarOpen(false)}>
                <span className="sr-only">Fechar menu</span>
                <XMarkIcon className="h-6 w-6" />
            </button>
        </div>
        <SidebarContent />
      </div>

      {/* Menu lateral para desktop (fixo) */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
            <div className="flex h-16 items-center justify-center px-4">
                <img src={logo} alt="AprovaCresci Logo" className="h-10 w-auto"/>
            </div>
            <SidebarContent />
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white shadow">
          <button
            type="button"
            className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Abrir menu</span>
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex flex-1 justify-end px-4">
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-4">{user?.email}</span>
              <button
                onClick={() => signOut()}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sair
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}