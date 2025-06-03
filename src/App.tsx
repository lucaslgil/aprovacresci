import React, { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { useAuthStore } from './store/auth'

export function App() {
  const { checkUser } = useAuthStore()

  useEffect(() => {
    checkUser()
  }, [checkUser])

  return <RouterProvider router={router} />
} 