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
  backgroundImagePrev: string
  profilepicturePrev: string
  }> = ({ UserProfile, isLoading, backgroundImagePrev, profilepicturePrev}) => {
  const [full_name, setfull_name] = useState<string>()
  const [background_image, setbackground_image] = useState<string>()
  const [backgroundPrev, setbackgroundprev] = useState<string>()
  const [profilepicPrev, setprofilepicprev] = useState<string>()
  const [profile_picture, setprofile_picture] = useState<string>()
  const [username, setusername] = useState<string>()
  const [bio, setbio] = useState<string>()

  useEffect(() => {
    const fetchUserData = async () => {
      if (UserProfile) {
        setfull_name(UserProfile.full_name)
        setbio(UserProfile.bio)
        setusername(UserProfile.username)

        if (!UserProfile.background_image.includes(UserProfile.username)){
          setbackground_image('')
        } else {
          setbackground_image(`${mediaURL}${UserProfile.background_image}`)
        }
        if (!UserProfile.profile_picture.includes(UserProfile.username)){
          setprofile_picture('')
        } else {
          setprofile_picture(`${mediaURL}${UserProfile.profile_picture}`)
        }
      }
    }

    fetchUserData()
  }, [UserProfile])

  useEffect(() => {
    setprofilepicprev(`${profilepicturePrev}`)
  }, [profilepicturePrev])

  useEffect(() => {
    setbackgroundprev(`${backgroundImagePrev}`)
  }, [backgroundImagePrev])

  return (
    <div>
      <div>
        {!isLoading ? (
          <img
            className="h-[40vh] w-full object-fit"
            src={`${backgroundPrev}` || `${background_image}` || '/profile_pic_def/gooseCom_slim.png'}
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
                <img
                  className="ml-4 mr-10 h-36 w-36 rounded-full ring-4 ring-zinc-200"
                  src={`${profilepicPrev}` || `${profile_picture}` || '/profile_pic_def/gooseCom.png'}
                  alt="profile"
                />
            </div>  
                  <div className="w-full border-l-2 border-zinc-600 p-5 font-bold flex flex-col gap-3 ml-8">
                  <div className="h-6 w-48 text-xl  rounded-lg">{full_name}</div>
                  <div className="h-6 w-48 text-md border-2 border-zinc-600 w-full px-2 h-8 rounded-lg">@{username}</div>
                  <div className="h-12 w-48 border-2 border-zinc-600 w-full px-2 py-1 text-sm rounded-lg">{bio}</div>
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