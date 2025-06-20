import React, { ReactNode, useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { usePermissionsStore } from '../../store/permissions';
import logoAprovaCresci from '../../assets/images/logo-aprova-cresci.png';
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
import '../../assets/giraffe-topbar.css';

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
const navigation: NavItem[] = (() => {
  // Itens originais
  const items: NavItem[] = [
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
  ];

  // Ordena submenus de cada item
  items.forEach(item => {
    if (item.submenu) {
      item.submenu.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    }
  });

  // Ordena os itens principais (exceto Dashboard)
  items.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  // Dashboard sempre primeiro
  return [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    ...items
  ];
})();

// --- COMPONENTE REUTILIZÁVEL PARA O CONTEÚDO DA SIDEBAR ---
function SidebarContent() {
  const location = useLocation();
  const permissions = usePermissionsStore((state) => state.permissions);
  const [openSubmenus, setOpenSubmenus] = useState<Set<string>>(new Set());
  const [showConfigPopover, setShowConfigPopover] = useState(false);
  const configBtnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Fecha o popover ao clicar fora (mas não no clique do link)
  useEffect(() => {
    if (!showConfigPopover) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        configBtnRef.current &&
        !configBtnRef.current.contains(event.target as Node)
      ) {
        setTimeout(() => setShowConfigPopover(false), 100); // Pequeno delay para garantir o clique
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showConfigPopover]);

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

  // Filtra menus conforme permissões
  const filteredNavigation = navigation.filter(item => {
    // RH só pode acessar Cadastros e seus submenus
    if (permissions.length > 0 && permissions.every(p => p === 'Funcionários')) {
      return item.name === 'Cadastros';
    }
    // Esconde Configurações se não tiver permissão
    if (item.name === 'Configurações' && !permissions.includes('Configurações')) {
      return false;
    }
    return true;
  }).map(item => {
    if (item.name === 'Cadastros' && permissions.length > 0 && permissions.every(p => p === 'Funcionários')) {
      // RH só pode acessar submenus de Funcionários
      return {
        ...item,
        submenu: item.submenu?.filter(sub => sub.name === 'Funcionários') || []
      };
    }
    return item;
  });

  return (
    <nav className="flex-1 flex flex-col justify-between space-y-1 px-2 py-4 overflow-y-auto bg-[#002943] text-white">
      <div>
        {filteredNavigation.map((item) => (
          <div key={item.name}>
            {!item.submenu ? (
              <Link
                to={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive(item.href)
                    ? 'bg-white bg-opacity-10 text-white font-bold'
                    : 'text-white hover:bg-white hover:bg-opacity-10 hover:text-white'
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
                  className={`group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md w-full ${
                    isActive(item.href, true)
                      ? 'bg-white bg-opacity-10 text-white font-bold'
                      : 'text-white hover:bg-white hover:bg-opacity-10 hover:text-white'
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
                            ? 'text-white font-semibold'
                            : 'text-white hover:bg-white hover:bg-opacity-10 hover:text-white'
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
      </div>
      {/* Botão Configurações fixo no rodapé, agora com popover flutuante fora da sidebar */}
      {permissions.includes('Configurações') && (
        <div className="mb-2 relative flex justify-center">
          <button
            ref={configBtnRef}
            type="button"
            className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left mt-4
              ${location.pathname.startsWith('/settings') ? 'bg-white bg-opacity-10 text-white font-bold' : 'text-white hover:bg-white hover:bg-opacity-10 hover:text-white'}`}
            onClick={() => setShowConfigPopover((prev) => !prev)}
          >
            <Cog6ToothIcon className="mr-3 flex-shrink-0 h-6 w-6" />
            Configurações
            <ChevronRightIcon className="ml-auto h-5 w-5" />
          </button>
          {showConfigPopover && (
            <>
              {/* Desktop: popover flutuante */}
              <div
                ref={popoverRef}
                className="hidden lg:block fixed z-50 left-64 bottom-8 w-56 bg-white text-gray-900 rounded-lg shadow-lg border border-gray-200 animate-fade-in"
                style={{ minWidth: 220 }}
              >
                <Link
                  to="/settings/user-registration"
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-lg hover:bg-gray-100 transition-colors
                    ${location.pathname.startsWith('/settings/user-registration') ? 'bg-blue-50 text-blue-700' : ''}`}
                  onClick={() => setTimeout(() => setShowConfigPopover(false), 50)}
                >
                  Cadastro de Usuários
                </Link>
                <Link
                  to="/settings/access-profiles"
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-b-lg hover:bg-gray-100 transition-colors
                    ${location.pathname.startsWith('/settings/access-profiles') ? 'bg-blue-50 text-blue-700' : ''}`}
                  onClick={() => setTimeout(() => setShowConfigPopover(false), 50)}
                >
                  Perfil de Acesso
                </Link>
              </div>
              {/* Mobile: dropdown abaixo do botão */}
              <div
                ref={popoverRef}
                className="block lg:hidden absolute left-0 right-0 bottom-12 mx-2 bg-white text-gray-900 rounded-lg shadow-lg border border-gray-200 animate-fade-in"
                style={{ minWidth: 0 }}
              >
                <Link
                  to="/settings/user-registration"
                  className={`flex items-center px-4 py-3 text-base font-medium rounded-t-lg hover:bg-gray-100 transition-colors
                    ${location.pathname.startsWith('/settings/user-registration') ? 'bg-blue-50 text-blue-700' : ''}`}
                  onClick={() => setTimeout(() => setShowConfigPopover(false), 50)}
                >
                  Cadastro de Usuários
                </Link>
                <Link
                  to="/settings/access-profiles"
                  className={`flex items-center px-4 py-3 text-base font-medium rounded-b-lg hover:bg-gray-100 transition-colors
                    ${location.pathname.startsWith('/settings/access-profiles') ? 'bg-blue-50 text-blue-700' : ''}`}
                  onClick={() => setTimeout(() => setShowConfigPopover(false), 50)}
                >
                  Perfil de Acesso
                </Link>
              </div>
            </>
          )}
        </div>
      )}
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
            <img src={logoAprovaCresci} alt="Logo AprovaCresci" className="h-10 w-auto"/>
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
            <div className="h-20 w-full bg-white p-0 m-0">
                <img src={logoAprovaCresci} alt="Logo AprovaCresci" className="w-full h-full object-cover bg-white m-0 p-0"/>
            </div>
            <SidebarContent />
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 giraffe-topbar shadow">
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
              <span className="text-sm text-white mr-4">{user?.email}</span>
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