import { createContext, useState, useEffect, ReactNode } from 'react'
import { jwtDecode } from 'jwt-decode'
import { useRouter } from 'next/router';
import { invoke } from '@tauri-apps/api/tauri';

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
    async function retireveJWTfromRust() {
      try {
        const result = await invoke('retrieve_jwt_from_file') as string
        const jsonData = JSON.parse(result); 
        setAuthTokens(jsonData);
        setUser(jwtDecode<User>(jsonData || '')
        )
      } catch (err) {
        //console.error('Error retrieving jwt:', err);
      }
    }
    
    retireveJWTfromRust()

  }, [router.asPath])

  

  const contextData = {
    user,
    setUser,
    authTokens,
    setAuthTokens,
  }
  useEffect(() => {
    if (authTokens) {
      setUser(jwtDecode(authTokens.access))
    }
    setLoading(false)
  }, [authTokens, loading])

  return (
    <AuthContext.Provider value={contextData}>
      {loading ? null : children}
    </AuthContext.Provider>
  )
}