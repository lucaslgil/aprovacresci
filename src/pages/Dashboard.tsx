import React from 'react'
import { 
  CurrencyDollarIcon, 
  CubeIcon, 
  ShoppingCartIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const stats = [
  { name: 'Valor Total em Estoque', value: 'R$ 150.000,00', icon: CurrencyDollarIcon },
  { name: 'Produtos em Estoque', value: '1.234', icon: CubeIcon },
  { name: 'Ordens Pendentes', value: '15', icon: ShoppingCartIcon },
  { name: 'Produtos com Estoque Baixo', value: '8', icon: ExclamationTriangleIcon },
]

export function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 pt-5 pb-12 shadow sm:px-6 sm:pt-6"
          >
            <dt>
              <div className="absolute rounded-md bg-indigo-500 p-3">
                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
            </dd>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Produtos com Estoque Baixo</h3>
            <div className="mt-4">
              <div className="flow-root">
                <ul role="list" className="-my-5 divide-y divide-gray-200">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <li key={item} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">Produto {item}</p>
                          <p className="truncate text-sm text-gray-500">Quantidade: {item * 2}</p>
                        </div>
                        <div>
                          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                            Estoque Baixo
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Últimas Ordens de Compra</h3>
            <div className="mt-4">
              <div className="flow-root">
                <ul role="list" className="-my-5 divide-y divide-gray-200">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <li key={item} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">Ordem #{item}</p>
                          <p className="truncate text-sm text-gray-500">Status: Pendente</p>
                        </div>
                        <div>
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                            Em Processamento
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 