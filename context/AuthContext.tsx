import { createContext, useState, useEffect, ReactNode } from 'react'
import { jwtDecode } from 'jwt-decode'
import { fetchTokenURL, registerURL } from '../components/backendURL'

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
  registerUser: (
    email: string,
    username: string,
    password: string,
    password2: string
  ) => Promise<void>
  loginUser: (email: string, password: string) => Promise<void>
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
  }, [])

  const loginUser = async (email: string, password: string) => {
    const response = await fetch(fetchTokenURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    })
    const data = await response.json()

    if (response.status === 200) {
      console.log('Logged In')
      setAuthTokens(data)
      setUser(jwtDecode(data.access))
      localStorage.setItem('authTokens', JSON.stringify(data))

      swal.fire({
        title: 'Login Successful',
        icon: 'success',
        toast: true,
        timer: 6000,
        position: 'top-right',
        timerProgressBar: true,
        showConfirmButton: false,
      })
    } else {
      console.log(response.status)
      console.log('there was a server issue')
      swal.fire({
        title: 'Username or passowrd does not exists',
        icon: 'error',
        toast: true,
        timer: 6000,
        position: 'top-right',
        timerProgressBar: true,
        showConfirmButton: false,
      })
    }
  }

  const registerUser = async (
    email: string,
    username: string,
    password: string,
    password2: string
  ) => {
    const response = await fetch(registerURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        username,
        password,
        password2,
      }),
    })
    if (response.status === 201) {
      swal.fire({
        title: 'Registration Successful, Login Now',
        icon: 'success',
        toast: true,
        timer: 6000,
        position: 'top-right',
        timerProgressBar: true,
        showConfirmButton: false,
      })
    } else {
      console.log(response.status)
      console.log('there was a server issue')
      swal.fire({
        title: 'An Error Occured ' + response.status,
        icon: 'error',
        toast: true,
        timer: 6000,
        position: 'top-right',
        timerProgressBar: true,
        showConfirmButton: false,
      })
    }
  }

  const contextData = {
    user,
    setUser,
    authTokens,
    setAuthTokens,
    registerUser,
    loginUser,
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