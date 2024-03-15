import axios from 'axios'
import { jwtDecode } from 'jwt-decode'
import dayjs from 'dayjs'
import { useContext } from 'react'
import AuthContext from '../context/AuthContext'
import { AuthContextType } from '../context/AuthContext'
import { baseURL } from '@/components/backendURL'
import { invoke } from '@tauri-apps/api/tauri';

interface AuthTokens {
  access: string
  refresh: string
}

interface DecodedToken {
  exp: number
  // ... add other properties expected from your token
}

const useAxios = () => {
  const context = useContext(AuthContext) as AuthContextType
  const { authTokens, setUser, setAuthTokens } = context ?? {}
  

  async function saveJWTToRust(token: string) {
    invoke('save_jwt_to_file', { token })
      .then(() => console.log('jwt saved successfully'))
      .catch((err) => console.error('Error saving jwt:', err));
  }

  const axiosInstance = axios.create({
    baseURL,
    headers: { Authorization: `Bearer ${authTokens?.access}` },
  })

  axiosInstance.interceptors.request.use(async (req) => {
    if (!authTokens) return req

    const user: DecodedToken = jwtDecode(authTokens.access)
    const isExpired = dayjs.unix(user.exp).diff(dayjs(), 'minute') < 2

    if (!isExpired) return req

    const response = await axios.post(`${baseURL}token/refresh/`, {
      refresh: authTokens.refresh,
    })

    const newToken: AuthTokens = response.data

    await saveJWTToRust(JSON.stringify(newToken))

    setAuthTokens(newToken)
    setUser(jwtDecode(newToken.access))
    
    req.headers.Authorization = `Bearer ${response.data.access}`
    return req
  })

  return axiosInstance
}

export default useAxios