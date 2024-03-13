import { createContext, useState, useEffect, ReactNode } from 'react'
import { jwtDecode } from 'jwt-decode'
import { useRouter } from 'next/router';

const swal = require('sweetalert2')

interface AuthToken {
  access: string
  refresh: string
}

interface User {}

export interface AuthContextType {
  user: User | null
  setUser: React.Dispatch<React.SetStateAction<User | null>>
  authTokens: AuthToken | null
  setAuthTokens: React.Dispatch<React.SetStateAction<AuthToken | null>>
}

const AuthContext = createContext<AuthContextType | null>(null)
export default AuthContext

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authTokens, setAuthTokens] = useState<AuthToken | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  useEffect(() => {
    const updateAuthTokens = () => {
      setAuthTokens(
        localStorage.getItem('authTokens')
          ? JSON.parse(localStorage.getItem('authTokens') || '')
          : null
      )
    }

    const updateUser = () => {
      setUser(
        localStorage.getItem('authTokens')
          ? jwtDecode<User>(localStorage.getItem('authTokens') || '')
          : null
      )
    }

    updateAuthTokens()
    updateUser()
  }, [router.asPath])
console.log(router.asPath, 'aspath')
  

  const contextData = {
    user,
    setUser,
    authTokens,
    setAuthTokens,
  }
console.log(user)
  useEffect(() => {
    if (authTokens) {
      setUser(jwtDecode(authTokens.access))
    }
    setLoading(false)
  }, [authTokens, loading, router.asPath])

  return (
    <AuthContext.Provider value={contextData}>
      {loading ? null : children}
    </AuthContext.Provider>
  )
}