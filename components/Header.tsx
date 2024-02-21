import React, { useState, useEffect } from 'react'
import { mediaURL } from './backendURL'
import {Card, Skeleton} from "@nextui-org/react";


const swal = require('sweetalert2')

export interface UserProfile {
  full_name: string
  background_image: string
  profile_picture: string
  bio: string
  username: string
}

const Header: React.FC<{ 
  UserProfile?: UserProfile
  isLoading:boolean 
  }> = ({ UserProfile, isLoading }) => {
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
        {!isLoading ? (
          <img
            className="max-h-128 w-full object-fill"
            src={`${mediaURL}${background_image}`}
            alt="background"
          />
        ) : (
          <Card className="w-full bg-zinc-800 h-96 rounded-md p-3">
      <Skeleton className="rounded-lg bg-zinc-400">
        <div className="h-96 "></div>
      </Skeleton>
     
    </Card>
        )}
      </div>
      {!isLoading ? (
          <div className="flex rounded-lg items-center justify-center w-max-full mt-2 mr-2 ml-2 h-44 bg-zinc-800" >
          <div className="w-full flex items-center">
             <div>
              {profile_picture && (
                <img
                  className="ml-4 mr-10 h-36 w-36 rounded-full ring-4 ring-white"
                  src={`${mediaURL}${profile_picture}`}
                  alt="profile"
                />
              )}
            </div>  
                  <div className="w-full border-l-2 border-zinc-400 p-5 font-bold text-xl flex flex-col gap-3 ml-8">
                  <div className="h-6 w-48 rounded-lg">{full_name}</div>
                  <div className="h-6 w-48 rounded-lg">{username}</div>
                  <div className="h-12 w-48 rounded-lg">{bio}</div>
              </div>
            </div>
        </div>
        ) : (
        <Card className="flex justify-center w-max-full mt-2 mr-2 ml-2 h-44 bg-zinc-800" radius="lg">
        <div className="max-w-[300px] w-full flex items-center gap-3">
           <div>
              <Skeleton className="flex items-center inline-block rounded-full left-3 ring-4 ring-zinc-600 bg-zinc-400 h-36 w-36">
               </Skeleton>
              </div>  
                  <div className="w-full flex flex-col gap-3 ml-8">
                  <Skeleton className="h-6 w-48 rounded-lg"/>
                  <Skeleton className="h-6 w-48 rounded-lg"/>
                  <Skeleton className="h-12 w-48 rounded-lg"/>
              </div>
            </div>
        </Card>
        )}
    </div>
  )
}

export default Header