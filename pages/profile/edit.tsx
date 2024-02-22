'use client'
import { useRouter } from 'next/router'
import { Disclosure } from '@headlessui/react'
import { fetchUserURL, searchUserURL } from '../../components/backendURL'
import { jwtDecode } from 'jwt-decode'
import { Fragment, useEffect, useState } from 'react'
import Header from '../../components/Header'
import ListTabs from '../../components/ListTabs'
import TopStocksList from '../../components/TopStocksList'
import S_Header from '../../components/SearchedPages/sHeader'
import S_PinnedStocksList from '../../components/SearchedPages/sPinnedStocksList'
import useAxios from '../../utils/useAxios'
import EditForm from '../../components/EditComponents/EditForm'
import {Card, Skeleton} from "@nextui-org/react";


import { Dialog, Transition } from '@headlessui/react'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import {
  Bars3Icon,
  Cog6ToothIcon,
  HomeIcon,
  UsersIcon,
  XMarkIcon,
  ArrowLeftStartOnRectangleIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import PinnedStocksList from '../../components/PinnedStocksList'

const swal = require('sweetalert2')

function classNames(...classes: any) {
  return classes.filter(Boolean).join(' ')
}

export interface NewComponentProps {
  searchvalue: string
}

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

export default function MyProfilePageEdit() {
  const [UserProfile, setUserProfile] = useState<UserProfile>()
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('Pinned')
  const [followingList, setfollowing] = useState<string[]>(
    UserProfile?.follow_list || []
  )
  const [isSearchActive, setSearchActive] = useState<boolean>(false)
  const [SearchedProfile, setSearchedprofile] = useState<Profile | null>(null)
  const gooseApp = useAxios()
  const router = useRouter()

  const navigation = [
    { name: 'My Profile', href: '/profile', icon: HomeIcon, current: false },
    {
      name: 'Following',
      icon: UsersIcon,
      current: false,
      children: followingList,
    },
    {
      name: 'Edit Profile',
      href: '/profile/edit',
      icon: Cog6ToothIcon,
      current: false,
    },
  ]

  //init page data
  useEffect(() => {
    const controller = new AbortController()

    
    const timer = setTimeout(() => {
      
      const fetchUserfollowing = async () => {
        try {
          const updatedUserData = await gooseApp.get(`${fetchUserURL}`)

          const fetchedUserProfile = jwtDecode<UserProfile>(
            updatedUserData.data.authToken
          )

          fetchedUserProfile.following.forEach((follow: any) => {
            if (!followingList.includes(follow.profile.username)) {
              followingList.push(follow.profile.username)
            }
          })
          setUserProfile(fetchedUserProfile)

          setTimeout(() => {
            setIsLoading(false)
          }, 400)

        } catch (error) {
          
        }
      }

      if(!UserProfile){
        fetchUserfollowing()
      }

    }, 0)
    return () => {
      clearTimeout(timer), controller.abort()
    }
  }, [])

   //loading searched profiles
   useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const search = params.get('search')
    
    if (search) {
      setSearchActive(true)

      const handleSearchChange = async () => {
        try {
          const response = await gooseApp.get(`${searchUserURL}${search}/`)
          const fetchedUserProfile: Profile = response.data
          setSearchedprofile(fetchedUserProfile)
        } catch (error) {
          console.error('Error fetching user profile:')
          window.location.href = '/profile'
        }
      }
      handleSearchChange()
    } else {
      setSearchActive(false)
    }


  }, [window.location.href])

  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName)
  }

  const updateFollowList = (newList: string[]) => {
    setfollowing(newList)
  }

  const handleLogout = () => {
    router.push('/login');
  }

  const sendMessageFromSearch = () => {
    router.push(
      `/profile?SearchMessage=${btoa(JSON.stringify(SearchedProfile))}`
    )
  }

  const handleMessageButton = () => {
    router.push({
      pathname: '/profile',
      query: { activeMessage: 'true' }
    });
  }

  return (
    <>
      <div>
        <Transition.Root show={sidebarOpen} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-50 lg:hidden"
            onClose={setSidebarOpen}
          >
            <Transition.Child
              as={Fragment}
              enter="transition-opacity ease-linear duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-linear duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-zinc-800" />
            </Transition.Child>

            <div className="fixed inset-0 flex">
              <Transition.Child
                as={Fragment}
                enter="transition ease-in-out duration-300 transform"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transition ease-in-out duration-300 transform"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                      <button
                        type="button"
                        className="-m-2.5 p-2.5"
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span className="sr-only">Close sidebar</span>
                        <XMarkIcon
                          className="h-6 w-6 text-white"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </Transition.Child>
                  {/* Sidebar component, halfwindow */}
                  <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-black px-6 pb-4 ring-1 ring-white/10">
                    <div className="flex h-14 shrink-0 items-center">
                      <div className="flex font-bold mb-4 mt-8">
                        <div className=" text-4xl">Goose</div>
                        <div className="mt-4">.com</div>
                      </div>
                    </div>
                    <nav className="flex flex-1 flex-col">
                      <ul role="list" className="flex flex-1 flex-col gap-y-7">
                        <li>
                          <ul role="list" className="-mx-2 space-y-1">
                            {navigation.map((item: any) => (
                              <li key={item.name}>
                                {!item.children ? (
                                  <button  
                                  onClick={() => router.push(item.href)}
                                  className={classNames(
                                    item.current
                                      ? 'bg-zinc-800 text-white'
                                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800',
                                    'group flex gap-x-3 w-full rounded-md p-2 text-sm leading-6 font-semibold'
                                  )}
                                >
                                  <item.icon
                                    className={`h-6 w-6 shrink-0 ${
                                    item.name === 'My Profile'? 
                                      'text-yellow-600':'text-green-600'                  
                                  }`}
                                    aria-hidden="true"
                                  />
                                  {item.name}
                                </button>
                                ) : (
                                  <Disclosure as="div">
                                    {({ open }) => (
                                      <>
                                        <Disclosure.Button
                                          className={classNames(
                                            item.current
                                              ? 'bg-zinc-50'
                                              : 'hover:bg-zinc-800 hover:text-white',
                                            'flex items-center w-full text-left rounded-md p-2 gap-x-3 text-sm leading-6 font-semibold text-zinc-400'
                                          )}
                                        >
                                          <item.icon
                                            className="h-6 w-6 shrink-0 text-blue-600"
                                            aria-hidden="true"
                                          />
                                          {item.name}
                                          <ChevronRightIcon
                                            className={classNames(
                                              open
                                                ? 'rotate-90 text-zinc-400'
                                                : 'text-zinc-400',
                                              'ml-auto h-5 w-5 shrink-0'
                                            )}
                                            aria-hidden="true"
                                          />
                                        </Disclosure.Button>
                                        <Disclosure.Panel
                                          as="ul"
                                          className="mt-1 px-2"
                                        >
                                          {item.children.map(
                                            (
                                              subItem: string,
                                              index: number
                                            ) => (
                                              <li key={index}>
                                                {/* 44px */}
                                                <Disclosure.Button
                                                  as="div"
                                                  onClick={() => {router.push(`/profile?search=${subItem}#`),
                                                console.log(window.location.href)}}
                                                  className={classNames(
                                                    'hover:bg-zinc-800 hover:text-white block rounded-md py-2 pr-2 pl-9 text-sm leading-6 text-gray-400'
                                                  )}
                                                >
                                                  {subItem}
                                              </Disclosure.Button>
                                              </li>
                                            )
                                          )}
                                        </Disclosure.Panel>
                                      </>
                                    )}
                                  </Disclosure>
                                )}
                              </li>
                            ))}
                            <button
                              className="group  w-full flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-zinc-800 hover:text-white"
                              onClick={handleMessageButton}
                            >
                              <ChatBubbleLeftRightIcon
                                className="h-6 w-6 text-red-600 shrink-0"
                                aria-hidden="true"
                              />
                              Messages
                            </button>
                          </ul>
                        </li>
                        <li>
                          <ul role="list" className="-mx-2 mt-2 space-y-1"></ul>
                        </li>
                        <li className="mt-auto">
                          <button
                            className="group -mx-2 w-full flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                            onClick={handleLogout}
                          >
                            <ArrowLeftStartOnRectangleIcon
                              className="h-6 w-6 shrink-0"
                              aria-hidden="true"
                            />
                            Logout
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition.Root>

        {/* Static sidebar for desktop */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 border-r-2 border-zinc-600 lg:flex-col">
          {/* Sidebar component, full window */}
          <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-black px-6 pb-4">
            <nav className="flex flex-1 flex-col">
              <div className="flex font-bold mb-4 mt-4">
                <div className=" text-4xl">Goose</div>
                <div className="mt-4">.com</div>
              </div>
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="-mx-2 space-y-1">
                    {navigation.map((item: any) => (
                      <li key={item.name}>
                        {!item.children ? (
                          <button
                            onClick={() => router.push(item.href)}
                            className={classNames(
                              item.current
                                ? 'bg-zinc-800 text-white'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800',
                              'group flex gap-x-3 rounded-md w-full p-2 text-sm leading-6 font-semibold'
                            )}
                          >
                            <item.icon
                               className={`h-6 w-6 shrink-0 ${
                                item.name === 'My Profile'? 
                                  'text-yellow-600':'text-green-600'                  
                              }`}
                              aria-hidden="true"
                            />
                            {item.name}
                          </button>
                        ) : (
                          <Disclosure as="div">
                            {({ open }) => (
                              <>
                                <Disclosure.Button
                                  className={classNames(
                                    item.current
                                      ? 'bg-zinc-50'
                                      : 'hover:hover:bg-zinc-800 hover:text-white',
                                    'flex items-center w-full text-left rounded-md p-2 gap-x-3 text-sm leading-6 font-semibold text-zinc-400'
                                  )}
                                >
                                  <item.icon
                                    className="h-6 w-6 shrink-0 text-blue-600"
                                    aria-hidden="true"
                                  />
                                  {item.name}
                                  <ChevronRightIcon
                                    className={classNames(
                                      open
                                        ? 'rotate-90 text-zinc-400'
                                        : 'text-zinc-400',
                                      'ml-auto h-5 w-5 shrink-0'
                                    )}
                                    aria-hidden="true"
                                  />
                                </Disclosure.Button>
                                <Disclosure.Panel as="ul" className="mt-1 px-2">
                                  {item.children.map(
                                    (subItem: string, index: number) => (
                                      <li key={index}>
                                        {/* 44px */}
                                        <Disclosure.Button
                                          as="div"
                                          onClick={() => router.push(`/profile/edit?search=${subItem}#`)}
                                          className={classNames(
                                            'hover:bg-zinc-800 hover:text-white block rounded-md py-2 pr-2 pl-9 text-sm leading-6 text-gray-400'
                                          )}
                                        >
                                          {subItem}
                                      </Disclosure.Button>
                                      </li>
                                    )
                                  )}
                                </Disclosure.Panel>
                              </>
                            )}
                          </Disclosure>
                        )}
                      </li>
                    ))}
                    <button
                    className="group  w-full flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    onClick={handleMessageButton}
                    >
                    <ChatBubbleLeftRightIcon
                      className="h-6 w-6 text-red-600 shrink-0"
                      aria-hidden="true"
                    />
                    Messages
                  </button>
                  </ul>
                </li>
                <li>
                  <ul role="list" className="-mx-2 mt-2 space-y-1"></ul>
                </li>
                <li className="mt-auto">
                  <button
                    className="group -mx-2 w-full flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    onClick={handleLogout}
                  >
                    <ArrowLeftStartOnRectangleIcon
                      className="h-6 w-6 shrink-0"
                      aria-hidden="true"
                    />
                    Logout
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-zinc-800 px-4 py-4 shadow-sm sm:px-6 lg:hidden">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-zinc-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          <button onClick={() => router.push('/profile')}>
            <span className="sr-only">Your profile</span>
            <img
              className="h-12 w-12 rounded-full bg-zinc-50"
              src={'/profile_pic_def/gooseCom.png'}
              alt=""
            />
          </button>
        </div>

        <main className="lg:pl-72 xl:w-3/5">
          <div className="xl:pr-0">
            <div className="px-4 py-0 sm:px-6 lg:px-8 lg:py-0 ">
              {/* Main area */}
            </div>
            {/* search bar for large window */}
            <div className="hidden lg:flex sticky top-0 z-40 flex items-center gap-x-6 bg-zinc-900 px-4 py-4 shadow-sm ">
              <div className="flex-1 text-sm font-semibold leading-6 text-zinc-800">
              <form className="relative flex flex-1" action="#" method="GET">
                  <label htmlFor="search-field" className="sr-only"></label>
                  <MagnifyingGlassIcon
                    className="ml-2 pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-zinc-400"
                    aria-hidden="true"
                  />
                  <input
                    id="search-field-main"
                    className="block h-full w-full border-2 border-zinc-950/60 rounded-lg py-2 pl-8 pr-0 text-zinc-100 bg-zinc-800 placeholder:text-zinc-400 focus:outline-none sm:text-sm"
                    placeholder="Search..."
                    type="search"
                    name="search"
                  />
                </form>
              </div>
              <button onClick={() => router.push('/profile')}>
                <span className="sr-only">Your profile</span>
                <img
                  className="h-12 w-12 rounded-full bg-zinc-50"
                  src={'/profile_pic_def/gooseCom.png'}
                  alt=""
                />
              </button>
            </div>
            {/* search not active */}

            <div className="xl:hidden mt-10 ml-10 mb-10 mr-10 ">
              <EditForm UserProfile={UserProfile as UserProfile} />
            </div>
         {/* search not active */}
            {!isSearchActive ? (
              <div className="hidden xl:block bg-zinc-900">
                <Header 
                UserProfile={UserProfile} 
                isLoading={isLoading}
                />
                <div className="mt-2">
                  <ListTabs
                    isLoading={isLoading}
                    activeTab={activeTab}
                    onTabSelect={handleTabChange}
                  />
                </div>
                <div className="flex">
                  <div
                    className={`flex-1 bg-zinc-900 ${
                      activeTab === 'Pinned' ? '' : 'hidden'
                    }`}
                  >
                    {isLoading ? (
                       <div className="w-full flex h-20 items-center">
                          <div> 
                             </div>  
                              <Skeleton className="py-6 ml-5 w-56 bg-zinc-400 rounded-lg"/>
                          </div>
                      ) : (
                       <h1 className="ml-5 text-2xl py-6 font-bold text-white">
                       Pinned Stocks
                     </h1>
                    )}
                    <hr className="border-1 border-zinc-950" />
                    <PinnedStocksList 
                      UserProfile={UserProfile}
                      isLoading={isLoading}
                       />
                  </div>
                  <div
                    className={`flex-1 bg-zinc-900 ${
                      activeTab === 'Trending' ? '' : 'hidden'
                    }`}
                  >
                    <h1 className="ml-5 h-24 text-2xl py-8 font-bold text-white">
                      Trending Stocks
                    </h1>
                    <hr className="border-1 border-zinc-950" />
                    <TopStocksList />
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden flex-1 xl:block bg-zinc-900">
                {/* search active*/}
                <S_Header
                  isLoading={isLoading}
                  onclick={sendMessageFromSearch}
                  updateFollowList={updateFollowList}
                  followListUpd={followingList}
                  searchedprofile={SearchedProfile}
                  UserProfile={UserProfile as UserProfile}
                />{' '}
                <div className="mt-2">
                  <ListTabs
                    isLoading={isLoading}
                    activeTab={activeTab}
                    onTabSelect={handleTabChange}
                  />
                </div>
                <div className="flex">
                  <div
                    className={`flex-1 bg-zinc-900 ${
                      activeTab === 'Pinned' ? '' : 'hidden'
                    }`}
                  >
                    {isLoading ? (
                       <div className="w-full flex h-20 items-center">
                          <div> 
                             </div>  
                              <Skeleton className="py-6 ml-5 w-56 bg-zinc-400 rounded-lg"/>
                          </div>
                      ) : (
                       <h1 className="ml-5 text-2xl py-6 font-bold text-white">
                       Pinned Stocks
                     </h1>
                    )}
                    <hr className="border-1 border-zinc-950" />
                    <S_PinnedStocksList 
                      searchedprofile={SearchedProfile}
                      isLoading={isLoading}
                       />
                  </div>
                  <div
                    className={`flex-1 bg-zinc-900 ${
                      activeTab === 'Trending' ? '' : 'hidden'
                    }`}
                  >
                    <h1 className="ml-5 h-24 text-2xl py-8 font-bold text-white">
                      Trending Stocks
                    </h1>
                    <hr className="border-1 border-zinc-950" />
                    <TopStocksList />
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        <aside className="fixed inset-y-0 right-0 hidden overflow-y-auto border-l-2 border-zinc-600 px-4 py-6 sm:px-6 lg:px-8 xl:block w-2/5">
          {/* Secondary column (hidden on smaller screens) */}
          <EditForm UserProfile={UserProfile as UserProfile} />
        </aside>
      </div>
    </>
  )
}