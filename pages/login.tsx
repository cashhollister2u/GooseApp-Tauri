import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router';
import { jwtDecode } from 'jwt-decode'
import { fetchTokenURL } from '../components/backendURL'
const swal = require('sweetalert2')

interface UserProfile {
  values5: string[]
}

const LoginPage = () => {
  const [email, setemailname] = useState<string>('')
  const [refresh, setrefresh] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const router = useRouter();

  const [authTokens, setAuthTokens] = useState(() => {
    if (typeof window != 'undefined') {
      const tokenData = localStorage.getItem('authTokens')
      if (tokenData) {
        try {
          // Attempt to parse the stored JSON
          return JSON.parse(tokenData)
        } catch (error) {
          // If parsing fails, log the error and return null
          console.error('Failed to parse auth tokens:', error)
          return null
        }
      }
    }
    // If no data is found in localStorage, return null
    return null
  })
  const [user, setUser] = useState(() => {
    if (typeof window != 'undefined') {
      const token = localStorage.getItem('authTokens')
      return token ? jwtDecode<UserProfile>(token) : null
    }
  })

  useEffect(() => {
    localStorage.removeItem('authTokens')
    setUser(null)
  }, [refresh])

  



  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const loginUser = async (
      email: string,
      password: string
    ): Promise<void> => {
      const response = await fetch(fetchTokenURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password,
        }),
      })
      const data = await response.json()

      if (response.status === 200) {
        setAuthTokens(data)
        setUser(jwtDecode(data.access))
        localStorage.setItem('authTokens', JSON.stringify(data))

        router.push('/profile');

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
    email.length > 0 && loginUser(email, password)
  }

  return (
    <>
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <div className="flex items-center justify-center mt-20">
            test
          </div>
          <h2 className="mt-16 text-center text-2xl font-bold leading-9 tracking-tight text-white">
            Login to your account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form
            className="space-y-6"
            action="#"
            method="POST"
            onSubmit={handleLogin}
          >
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium leading-6 text-white"
              >
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setemailname(e.target.value)}
                  onFocus={() => setrefresh('refreshed')}
                  required
                  className="pl-4 block w-full rounded-md border-0 bg-gray-300 py-1.5 text-black shadow-sm ring-1 ring-inset ring-white/20 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium leading-6 text-white"
                >
                  Password
                </label>
                <div className="text-sm">
                  <a
                    href="#"
                    className="font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    Forgot password?
                  </a>
                </div>
              </div>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="pl-4 block w-full rounded-md border-0 bg-gray-300 py-1.5 text-black shadow-sm ring-1 ring-inset ring-white/20 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setrefresh('refreshed')}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              >
                Login
              </button>
            </div>
          </form>

          <p className="mt-10 text-center text-sm text-gray-400">
            Not a member?{' '}
            <button
              onClick={() => router.push('/sign-up')}
              className="font-semibold leading-6 text-indigo-400 hover:text-indigo-300"
            >
              Create an Account
            </button>
          </p>
        </div>
      </div>
    </>
  )
}

export default LoginPage