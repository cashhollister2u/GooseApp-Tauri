import React, { useState, useEffect } from 'react'
import { mediaURL } from './backendURL'

const swal = require('sweetalert2')

export interface UserProfile {
  full_name: string
  background_image: string
  profile_picture: string
  bio: string
  username: string
}

const Header: React.FC<{ UserProfile?: UserProfile }> = ({ UserProfile }) => {
  const [full_name, setfull_name] = useState<string>()
  const [background_image, setbackground_image] = useState<string>()
  const [profile_picture, setprofile_picture] = useState<string>()
  const [username, setusername] = useState<string>()
  const [bio, setbio] = useState<string>()

  useEffect(() => {
    const fetchUserData = async () => {
      if (UserProfile) {
        setfull_name(UserProfile.full_name)
        setbackground_image(UserProfile.background_image)
        setbio(UserProfile.bio)
        setusername(UserProfile.username)
        setprofile_picture(UserProfile.profile_picture)
      }
    }

    fetchUserData()
  }, [UserProfile])

  
  return (
    <div>
      <div>
        {background_image && (
          <img
            className="max-h-128 w-full object-fill"
            src={`${mediaURL}${background_image}`}
            alt="background"
          />
        )}
      </div>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="sm:-mt-16 sm:flex sm:items-end sm:space-x-5">
          <div className="flex">
            {profile_picture && (
              <img
                className="h-36 w-36 rounded-full ring-4 ring-white sm:h-40 sm:w-40 lg:h-36 lg:w-36 mt-20"
                src={`${mediaURL}${profile_picture}`}
                alt="profile"
              />
            )}
          </div>

          <div className="mt-6 px-2 sm:flex sm:min-w-0 sm:flex-1 sm:items-center sm:justify-end sm:space-x-6 sm:pb-1">
            <div className="mt-6 min-w-0 h-40 lg:h-36 flex-1 md:block border-l-2 border-gray-700">
              <div className="truncate text-white-900 ml-3">
                <div className="font-bold mt-4 text-2xl">{full_name}</div>
                <h1 className="mt-2 font-bold text-xl">@{username}</h1>
                <h1 className="mt-2 text-xl">{bio}</h1>
                <br />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header