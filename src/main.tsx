import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App } from './App'
import './index.css'

// Cria uma instância do QueryClient com configurações padrão
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Número de tentativas em caso de erro
      refetchOnWindowFocus: false, // Não recarregar dados quando a janela receber foco
      staleTime: 5 * 60 * 1000, // Tempo em que os dados são considerados frescos (5 minutos)
    },
  },
})

// Adiciona um manipulador de erros global
queryClient.getQueryCache().config.onError = (error) => {
  console.error('Erro na requisição:', error)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
)