import React, { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router';
import { registerURL } from '../components/backendURL'
const swal = require('sweetalert2')

const SignUpPage = () => {
  const [email, setemailname] = useState<string>('')
  const [username, setusername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      // Create an object with the user data
      const userData = {
        email: email,
        username: username,
        password: password,
        password2: confirmPassword,
      }

      // Make the POST request with json
      const response = await axios.post(`${registerURL}`, userData, {
        headers: {
          'Content-Type': 'application/json', // Set the content type for FormData
        },
      })

      // Clear form fields
      setusername('')
      setemailname('')
      setPassword('')
      setConfirmPassword('')
      swal.fire({
        title: 'User Registration Successsful',
        icon: 'success',
        toast: true,
        timer: 6000,
        position: 'top-right',
        timerProgressBar: true,
        showConfirmButton: false,
      })

      router.push('/login')
    } catch (error) {
      if (username.toLowerCase() === 'default') {
        swal.fire({
          title: 'Default is not an acceptable Username',
          icon: 'error',
          toast: true,
          timer: 6000,
          position: 'top-right',
          timerProgressBar: true,
          showConfirmButton: false,
        })
      } else {
        swal.fire({
          title: 'Username not available',
          icon: 'error',
          toast: true,
          timer: 6000,
          position: 'top-right',
          timerProgressBar: true,
          showConfirmButton: false,
        })
      }
    }
  }

  return (
    <>
      <div className="flex min-h-full flex-1 flex-col justify-center px-6  lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <div className="flex items-center justify-center  mt-20">
        test
          </div>
          <h2 className=" mt-5 text-center text-2xl font-bold leading-9 tracking-tight text-white">
            Create Account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form
            className="space-y-6"
            action="#"
            method="POST"
            onSubmit={handleSignUp}
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
                  type="email"
                  value={email}
                  onChange={(e) => setemailname(e.target.value)}
                  required
                  className="pl-4 block w-full rounded-md border-0 bg-gray-300 py-1.5 text-black shadow-sm ring-1 ring-inset ring-white/20 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                />
              </div>
            </div>
            <label
              htmlFor="username"
              className="block text-sm font-medium leading-6 text-white"
            >
              Username
            </label>
            <div className="mt-2">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setusername(e.target.value)}
                required
                className="-mt-4 pl-4 block w-full rounded-md border-0 bg-gray-300 py-1.5 text-black shadow-sm ring-1 ring-inset ring-white/20 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium leading-6 text-white"
                >
                  Password
                </label>
                <div className="text-sm"></div>
              </div>
              <div className="mt-2">
                <input
                  id="password"
                  type="password"
                  required
                  className="pl-4 block w-full rounded-md border-0 bg-gray-300 py-1.5 text-black shadow-sm ring-1 ring-inset ring-white/20 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="confirmpassword"
                  className="block text-sm font-medium leading-6 text-white"
                >
                  Confirm Password
                </label>
                <div className="text-sm"></div>
              </div>
              <div className="mt-2">
                <input
                  id="confirmpassword"
                  type="password"
                  required
                  className="pl-4 block w-full rounded-md border-0 bg-gray-gray-300 py-1.5 text-black shadow-sm ring-1 ring-inset ring-white/20 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              >
                Sign Up
              </button>
            </div>
          </form>
          <p className="mt-10 text-center text-sm text-gray-400">
            Already a member?{' '}
            <button
              onClick={() => router.push('/login')}
              className="font-semibold leading-6 text-indigo-400 hover:text-indigo-300"
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </>
  )
}

export default SignUpPage