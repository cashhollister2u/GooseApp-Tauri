import React, { useState, useEffect } from 'react'
import useAxios from '../../utils/useAxios'
import { fetchUserURL } from '../backendURL'
import { EnvelopeIcon } from '@heroicons/react/20/solid'
const swal = require('sweetalert2')

interface UserProfile {
  full_name: string
  background_image: string
  profile_picture: string
  bio: string
  username: string
  values5: string[]
  follow_list: string[]
  following: any
}

interface Profile {
  profile: UserProfile
  username: string
  id: number
}

interface FollowListCountType {
  updateFollowList: (newList: string[]) => void
  followListUpd: string[]
}

export interface S_HeaderProps extends FollowListCountType {
  searchedprofile: Profile | null
  UserProfile: UserProfile
  onclick: () => void
}

const S_Header: React.FC<S_HeaderProps> = ({
  searchedprofile,
  updateFollowList,
  UserProfile,
  onclick,
}) => {
  const [isFollowing, setFollowing] = useState<boolean>(false)
  const [followList, setFollowList] = useState<string[]>([])
  const [MYusername, setMYusername] = useState<string>()
  const [full_name, setfull_name] = useState<string>()
  const [background_image, setbackground_image] = useState<string>()
  const [profile_picture, setprofile_picture] = useState<string>()
  const [username, setusername] = useState<string>()
  const [bio, setbio] = useState<string>()
  const gooseApp = useAxios()
  const params = new URLSearchParams(window.location.search)
  const search = params.get('search') as string

  useEffect(() => {
    const handleSearchChange = () => {
      try {
        const fetchedUserProfile = searchedprofile
        if (fetchedUserProfile) {
          setfull_name(fetchedUserProfile.profile.full_name)
          setbackground_image(fetchedUserProfile.profile.background_image)
          setprofile_picture(fetchedUserProfile.profile.profile_picture)
          setusername(fetchedUserProfile.profile.username)

          setbio(fetchedUserProfile.profile.bio)
        }
      } catch (error) {
        swal.fire({
          title: 'Error fetching searched profile',
          icon: 'error',
          toast: true,
          timer: 6000,
          position: 'top-right',
          timerProgressBar: true,
          showConfirmButton: false,
        })
      }
    }
    const fetchUserData = () => {
      if (UserProfile) {
        setMYusername(UserProfile.username)
        UserProfile.following.forEach((follow: any) => {
          if (!followList.includes(follow.profile.username)) {
            followList.push(follow.profile.username)
          }
        })
      }
    }
    const followingStatus = () => {
      if (UserProfile) {
        const istheUserFollowing: boolean = UserProfile.following.some(
          (follow: any) => {
            return follow.profile.username === search
          }
        )
        setFollowing(istheUserFollowing)
      }
    }

    followingStatus()

    fetchUserData()
    handleSearchChange()
  }, [searchedprofile, UserProfile])

  const FollowUser = async (targetUserId: any) => {
    const showErrorAlert = (message: any) => {
      swal.fire({
        title: message,
        icon: 'error',
        toast: true,
        timer: 6000,
        position: 'top-right',
        timerProgressBar: true,
        showConfirmButton: false,
      })
    }

    try {
      if (username === MYusername) {
        showErrorAlert("You can't follow yourself")
        return
      }

      if (username && !followList.includes(username)) {
        const updatedList = followList.concat(username)
        setFollowList(updatedList)
        updateFollowList(updatedList)
      }

      const formData = new FormData()
      formData.append('action', 'follow')
      formData.append('target_user_id', targetUserId)

      const response = await gooseApp.post(fetchUserURL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.status === 200) {
        setFollowing(true)
      } else {
        showErrorAlert('Error following user')
      }
    } catch (error) {
      showErrorAlert('Error following user')
    }
  }

  const unFollowUser = async (targetUserId: any) => {
    const showAlert = (title: string, icon: string) => {
      swal.fire({
        title: title,
        icon: icon,
        toast: true,
        timer: 6000,
        position: 'top-right',
        timerProgressBar: true,
        showConfirmButton: false,
      })
    }

    try {
      const updatedList = followList.filter((user: any) => user != username)
      updateFollowList(updatedList)
      setFollowList(updatedList)
      const formData = new FormData()
      formData.append('action', 'unfollow')
      formData.append('target_user_id', targetUserId)

      const response = await gooseApp.post(fetchUserURL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      setFollowing(false)
      // Handle successful unfollow here, e.g., update UI or notify the user
    } catch (error) {
      showAlert('Error unfollowing user', 'error')
    }
  }

  return (
    <div>
      <div>
        {background_image && (
          <img
            className="max-h-128 w-full object-fill "
            src={`${background_image}`}
            alt="backgroundimage"
          />
        )}
      </div>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="sm:-mt-16 sm:flex sm:items-end sm:space-x-5">
          <div className="flex">
            {profile_picture && (
              <img
                className="h-36 w-36 rounded-full ring-4 ring-white sm:h-40 sm:w-40 lg:h-36 lg:w-36 mt-20"
                src={`${profile_picture}`}
                alt=""
              />
            )}
          </div>

          <div className="mt-6 sm:flex sm:min-w-0 sm:flex-1 sm:items-center sm:justify-end sm:space-x-6 sm:pb-1">
            <div className="mt-6 min-w-0 h-40 lg:h-36 flex-1 md:block border-l-2 border-zinc-700">
              <h1 className="truncate text-white-900 ml-3">
                <div className="font-bold text-2xl">{full_name}</div>
                <div className="mt-2 font-bold text-xl">@{username}</div>
                <div className="mt-2 text-xl">{bio}</div>
                <br />
              </h1>
            </div>

            <div
              className={`flex mr-4 justify-end xl:-mt-20 lg:-mt-24 sm:-mt-24 ${
                MYusername !== username ? '' : 'hidden'
              }`}
            >
              <button
                type="button"
                className={`rounded-md w-32 bg-gray-300 px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-white ${
                  !isFollowing ? '' : 'hidden'
                }`}
                onClick={() => FollowUser(searchedprofile?.id)}
              >
                Follow
              </button>
              <button
                type="button"
                className={`${
                  !isFollowing
                    ? 'hidden'
                    : 'rounded-md w-32 bg-gray-300 px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-white'
                }`}
                onClick={() => unFollowUser(searchedprofile?.id)}
              >
                Unfollow
              </button>

              <button
                type="button"
                className={
                  'flex rounded-md w-10 ml-1 items-center justfiy-center bg-gray-300 px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-white'
                }
                onClick={() => {
                  onclick(), console.log('onclick')
                }}
              >
                <span className=" mx-auto">
                  <EnvelopeIcon
                    className="h-5 w-5 text-black"
                    aria-hidden="true"
                  />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default S_Header