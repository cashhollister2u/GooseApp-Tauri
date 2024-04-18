import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router';
import { fetchTokenURL } from '../components/backendURL'
import { saveJWT, retireveJWT } from '../components/filemanagement';

const swal = require('sweetalert2')

interface Token {
  refresh: string,
  access: string,
}

const LoginPage = () => {
  const [email, setemailname] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [jwt_token, setJwt_token] = useState<Token>()
  const [isrouterCalled, setisrouterCalled] = useState<boolean>(false)
  const router = useRouter();


  //windowsize
  useEffect(() => {
    if (typeof window === 'undefined') return
      import("@tauri-apps/api").then((tauri) => {
        tauri.window.appWindow.setSize(new tauri.window.LogicalSize(400, 550));
      })
      
  }, [])
 

 //checks of user is logged in from previous session
  useEffect(() => {
    const callJwt = async () =>{
      const saved_user = await retireveJWT()
      setJwt_token(saved_user)
    }
    callJwt()
    if (jwt_token && !isrouterCalled) {
      setisrouterCalled(true)
      router.push('/profile'); 
    }
  }, [router, jwt_token]);

  const handleLogin = async (e: any) => {
    e.preventDefault();

    const loginUser = async () => {
      try {
        const response = await fetch(fetchTokenURL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.toLowerCase(),
            password,
          }),
        });
        const data = await response.json();
        if (response.status === 200) {
          await saveJWT(JSON.stringify(data))
          setPassword('')
          setemailname('')

          setisrouterCalled(true)
          router.push('/profile')      
             
        } else if (response.status === 401) {
          swal.fire({
            title: 'Login failed',
            text: 'Username or password does not exist',
            icon: 'error',
            color: '#cfe8fc',
            background: '#BC3838',
            toast: true,
            timer: 4000,
            position: 'top-right',
            timerProgressBar: true,
            showConfirmButton: false,
          });
        } if (response.status === 403) {
          swal.fire({
            title: 'Login failed',
            text: 'User not approved my admin',
            icon: 'error',
            color: '#cfe8fc',
            background: '#BC3838',
            toast: true,
            timer: 4000,
            position: 'top-right',
            timerProgressBar: true,
            showConfirmButton: false,
          });
        }
      } catch (error:any) {
        console.log('error', error) 
      }
    };

    if (email && password) {
      await loginUser();
    }
  };


  return (
    <>
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <div className="flex items-center justify-center ">
          <img
              src={'/profile_pic_def/gooseCom_slim.png'}
              alt=""
            />
          </div>
        </div>

        <div className=" sm:mx-auto sm:w-full sm:max-w-sm">
          <form
            className="space-y-1"
            action="#"
            method="POST"
            onSubmit={handleLogin}
          >
            <div>
            <h2 className="mb-4 text-2xl font-bold  tracking-tight text-white">
            Login
          </h2>
              <label
                htmlFor="email"
                className="block text-xs font-medium leading-6 text-white"
              >
                Email address
              </label>
              <div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setemailname(e.target.value)}
                  required
                  className="pl-4 text-xs h-8 block w-full rounded-md border-0 bg-gray-300 text-black shadow-sm ring-1 ring-inset ring-white/20 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:leading-6"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium leading-6 text-white"
                >
                  Password
                </label>
                <div className="text-sm">
        
                </div>
              </div>
              <div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="pl-4 h-8 block w-full rounded-md border-0 bg-gray-300 py-1.5 text-black shadow-sm ring-1 ring-inset ring-white/20 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="flex mt-3 w-full justify-center rounded-md bg-indigo-500 px-3 py-2.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              >
                Login
              </button>
            </div>
          </form>

          <p className="mt-4 text-center text-sm text-gray-400">
            Not a member?{' '}
            <button
              onClick={() => router.push('/sign_up')}
              className="font-semibold mb-4 leading-6 text-indigo-400 hover:text-indigo-300"
            >
              Create an Account
            </button>
          </p> 
        </div>
        <p className='text-sm text-red-500 ml-4 mr-4 mb-6'>
          Disclaimer :
          “While privacy and security are a priority, 
          this is a personal project used for educational 
          purposes. Privacy and security are not guaranteed”
            </p>
      </div>
    </>
  )
}

export default LoginPage