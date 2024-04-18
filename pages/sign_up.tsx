import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router';
import { registerURL } from '../components/backendURL'
import { savePrivateKey } from '../components/filemanagement';
import swal from 'sweetalert2';
import forge from 'node-forge';




const SignUpPage = () => {
  const [email, setemailname] = useState<string>('')
  const [username, setusername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const router = useRouter();

  //windowsize
  useEffect(() => {
    if (typeof window === 'undefined') return
      import("@tauri-apps/api").then((tauri) => {
        tauri.window.appWindow.setSize(new tauri.window.LogicalSize(400, 600));
      })
  }, [])

  const generateRSAkeys = (): Promise<{public_key: string, private_key: string}> => {

    return new Promise((resolve, reject) => {
      forge.pki.rsa.generateKeyPair({bits: 2048, workers: -1}, function(err:any, keypair:any) {
        if(err) {
          console.error(err);
          reject(err)
          return 200;
        }

        const pemPrivate = forge.pki.privateKeyToPem(keypair.privateKey);
   
        const pemPublic = forge.pki.publicKeyToPem(keypair.publicKey);
        
        resolve({
          public_key: pemPublic,
          private_key: pemPrivate
        });
      })
    })
  }

  const handleSignUp = async (pemPublic:any, pemPrivate:any)=> {
    try {

      const userData = {
        email: email,
        username: username,
        password: password,
        password2: confirmPassword,
        public_key: pemPublic,
      }
      
      const response = await axios.post(`${registerURL}`, userData, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
        swal.fire({
        title: 'User Registration Successsful',
        icon: 'success',
        color: '#cfe8fc',
        background: '#58A564',
        toast: true,
        timer: 6000,
        position: 'top-right',
        timerProgressBar: true,
        showConfirmButton: false,
      })
      await savePrivateKey(pemPrivate, username);
      router.push('/login')
    } catch (error) {
      if (username.toLowerCase() === 'default') {
        swal.fire({
          title: 'Default is not an acceptable Username',
          icon: 'error',
          color: '#cfe8fc',
          background: '#BC3838',
          toast: true,
          timer: 6000,
          position: 'top-right',
          timerProgressBar: true,
          showConfirmButton: false,
        })
      } else {
        swal.fire({
          title: 'Username or email not available',
          icon: 'error',
          toast: true,
          color: '#cfe8fc',
          background: '#BC3838',
          timer: 6000,
          position: 'top-right',
          timerProgressBar: true,
          showConfirmButton: false,
        })
      }
    }
  }

  const handleOnClick = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      const keys = await generateRSAkeys()
      const newPublicPem = keys.public_key
      const newPrivatePem = keys.private_key
      await handleSignUp(newPublicPem, newPrivatePem);
      
    } catch (error) {
      console.error("An error occurred during the sign-up process:", error);
     
    }
  }

  return (
    <>
      <div className="flex min-h-full flex-1 flex-col justify-center px-6  lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="flex items-center justify-center ">
          <img
              src={'/profile_pic_def/gooseCom_slim.png'}
              alt=""
            />
          </div>
          
        </div>

        <div className=" sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mb-4 text-2xl font-bold leading-9 tracking-tight text-white">
            Create Account
          </h2>
          <form
            className="space-y-1"
            action="#"
            method="POST"
            onSubmit={handleOnClick}
          >
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium leading-6 text-white"
              >
                Email address
              </label>
              <div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setemailname(e.target.value)}
                  required
                  className="pl-4 h-8 block w-full rounded-md border-0 bg-gray-300 py-1.5 text-black shadow-sm ring-1 ring-inset ring-white/20 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                />
              </div>
            </div>
            <label
              htmlFor="username"
              className="block text-xs font-medium leading-6 text-white"
            >
              Username
            </label>
            <div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setusername(e.target.value)}
                required
                className=" pl-4 h-8 block w-full rounded-md border-0 bg-gray-300 py-1.5 text-black shadow-sm ring-1 ring-inset ring-white/20 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium leading-6 text-white"
                >
                  Password
                </label>
                <div className="text-sm"></div>
              </div>
              <div>
                <input
                  id="password"
                  type="password"
                  required
                  className="pl-4 h-8 block w-full rounded-md border-0 bg-gray-300 py-1.5 text-black shadow-sm ring-1 ring-inset ring-white/20 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="confirmpassword"
                  className="block text-xs font-medium leading-6 text-white"
                >
                  Confirm Password
                </label>
                <div className="text-sm"></div>
              </div>
              <div>
                <input
                  id="confirmpassword"
                  type="password"
                  required
                  className="pl-4 h-8 block w-full rounded-md border-0 bg-gray-300 py-1.5 text-black shadow-sm ring-1 ring-inset ring-white/20 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                className="flex mt-3 w-full justify-center rounded-md bg-indigo-500 px-3 py-2.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              >
                Sign Up
              </button>
            </div>
          </form>
          <p className="mt-4 mb-4 text-center text-sm text-gray-400">
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