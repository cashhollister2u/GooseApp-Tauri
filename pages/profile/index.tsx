import React from 'react'
import { useRouter } from 'next/router'
import { Disclosure } from '@headlessui/react'
import {
  fetchUserURL,
  searchUserURL,
  fetchMessagesURL,
} from '../../components/backendURL'
import { jwtDecode } from 'jwt-decode'
import { Fragment, useEffect, useState } from 'react'
import Header from '../../components/Header'
import ListTabs from '../../components/ListTabs'
import TopStocksList from '../../components/TopStocksList'
import S_Header from '../../components/SearchedPages/sHeader'
import S_PinnedStocksList from '../../components/SearchedPages/sPinnedStocksList'
import Messaging from '../../components/Messaging'
import useAxios from '../../utils/useAxios'
import { Dialog, Transition } from '@headlessui/react'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import {
  ChatBubbleLeftRightIcon,
  Bars3Icon,
  Cog6ToothIcon,
  HomeIcon,
  UsersIcon,
  XMarkIcon,
  ArrowLeftStartOnRectangleIcon,
} from '@heroicons/react/24/outline'
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import PinnedStocksList from '../../components/PinnedStocksList'
import { invoke } from '@tauri-apps/api/tauri';

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
  user_id: number
  following: any
  public_key: string
  private_key: string
}

interface Message {
  id: number
  user: number
  sender_profile: UserProfile
  reciever_profile: UserProfile
  reciever: number
  message: string
  is_read: boolean
  date: string
  sender: number
  name: string
  public_key: string
  sender_message: string
  decrypted_message?: string;
}

interface Profile {
  profile: UserProfile
  username: string
  id: number
}

export interface RetunrHomeProfile {
  returnHome_Profile: boolean
}
const MyProfilePage: React.FC<{}> = () => {
  const [UserProfile, setUserProfile] = useState<UserProfile>()
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('Pinned')
  const [isMessaging, setIsMessaging] = useState<boolean>(false)
  const [IsSeachMessage, setIsSeachMessage] = useState<boolean>(false)
  const [followingList, setfollowing] = useState<string[]>(UserProfile?.follow_list || [])
  const [isSearchActive, setSearchActive] = useState<boolean>(false)
  const [SearchedProfile, setSearchedprofile] = useState<Profile | null>(null)
  const gooseApp = useAxios()
  const router = useRouter()
  const SearchMsgString = router.query.SearchMessage
  const [messages, setmessages] = useState<Message[]>([])

  const navigation = [
    {
      name: 'My Profile',
      href: '/profile',
      icon: HomeIcon,
      current: false,
    },
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

  useEffect(() => {
    const checkSize = () => {
      if (window.innerWidth >= 1280) {
        setActiveTab('Pinned')
        setIsMessaging(false)
      }
    }

    checkSize()

    window.addEventListener('resize', checkSize)

    return () => window.removeEventListener('resize', checkSize)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const search = params.get('search')
    const controller = new AbortController()
    const signal = controller.signal

    const timer = setTimeout(() => {
      console.log('get ran agian')
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
        } catch (error) {
          if (!signal.aborted) {
            window.location.href = '/sign-in'
          }
        }
      }

      fetchUserfollowing()
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

      if (SearchMsgString && typeof SearchMsgString === 'string') {
        try {
          const SearchMsg = JSON.parse(atob(SearchMsgString))
          setSearchedprofile(SearchMsg)
          setIsMessaging(true)
          setIsSeachMessage(true)
        } catch (error) {
          console.error('Error parsing JSON:', error)
        }
      }
    }, 300)
    return () => {
      clearTimeout(timer), controller.abort()
    }
  }, [])

  async function initialdecrypttoRust(reciever_profile: any) {
    console.log(reciever_profile)
    try {
      const result = await invoke('pull_messages_encrypted', { messages: messages, username: UserProfile?.username, privateKey: UserProfile?.private_key, recieverUsername: reciever_profile.handle || reciever_profile.profile.username });
      console.log('Command executed successfully', result); 
      setmessages(result as Message[]);
    } catch (error) {
        console.error('Error sending data to Rust:', error);
    }
}

  useEffect(() => {
    const istauri = (window as any).__TAURI__ !== undefined;
    
    if (UserProfile && istauri) {
      const fetchMessages = async () => {
        try {
          const response = await gooseApp.get(
            `${fetchMessagesURL}${UserProfile?.user_id}/`
          )
          const fetchedMessages = response.data
       
          setmessages(fetchedMessages)
          setIsLoading(false)
          //initialdecrypttoRust(fetchedMessages, UserProfile.username, UserProfile.private_key)
        } catch (error) {}
      }

      fetchMessages()
    } 
  }, [UserProfile])


  const handleProfileChangeState = (item: any) => {
    if (item.name === 'My Profile') {
      setActiveTab('Pinned')
      setIsMessaging(false)
      setSidebarOpen(false)
    }
  }

  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName)
  }
  const handleMessageScreen = () => {
    setIsMessaging(true)
    setActiveTab('empty')
    setSidebarOpen(false)
  }

  const updateFollowList = (newList: string[]) => {
    setfollowing(newList)
  }

  const updateIsMessaging = () => {
    setIsMessaging(false)
    setActiveTab('Pinned')
  }

  const sendMessageFromSearch = () => {
    setIsMessaging(true)
    setIsSeachMessage(true)
    console.log('sendmsg')
  }

  const handleLogout = () => {
    router.push('/login');
    
  }

  const setLoadingfalse = () => {
    setIsLoading(false)
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
              <div className="fixed inset-0 bg-gray-900/80" />
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
                                   
                                  onClick={() => {
                                    if (item.name === 'My Profile') {
                                      window.location.href = '/profile'
                                    } else {
                                    router.push(item.href)}}}
                                  className={classNames(
                                    item.current
                                      ? 'bg-gray-800 text-white'
                                      : 'text-gray-400 hover:text-white hover:bg-gray-800',
                                    'group flex gap-x-3 w-full rounded-md p-2 text-sm leading-6 font-semibold'
                                  )}
                                >
                                  <item.icon
                                    className="h-6 w-6 shrink-0"
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
                                              ? 'bg-gray-50'
                                              : 'hover:bg-gray-800 hover:text-white',
                                            'flex items-center w-full text-left rounded-md p-2 gap-x-3 text-sm leading-6 font-semibold text-gray-400'
                                          )}
                                        >
                                          <item.icon
                                            className="h-6 w-6 shrink-0 text-gray-400"
                                            aria-hidden="true"
                                          />
                                          {item.name}
                                          <ChevronRightIcon
                                            className={classNames(
                                              open
                                                ? 'rotate-90 text-gray-400'
                                                : 'text-gray-400',
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
                                                  as="a"
                                                  href={`/profile?search=${subItem}#`}
                                                  className={classNames(
                                                    'hover:bg-gray-800 hover:text-white block rounded-md py-2 pr-2 pl-9 text-sm leading-6 text-gray-400'
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
                              className="group  w-full flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-gray-800 hover:text-white"
                              onClick={handleMessageScreen}
                            >
                              <ChatBubbleLeftRightIcon
                                className="h-6 w-6 shrink-0"
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
                            className="group -mx-2 w-full flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-gray-800 hover:text-white"
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
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
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
                                   
                          onClick={() => {
                            if (item.name === 'My Profile') {
                              window.location.href = '/profile'
                            } else {
                            router.push(item.href)}}}
                          className={classNames(
                            item.current
                              ? 'bg-gray-800 text-white'
                              : 'text-gray-400 hover:text-white hover:bg-gray-800',
                            'group flex gap-x-3 w-full rounded-md p-2 text-sm leading-6 font-semibold'
                          )}
                        >
                            <item.icon
                              className="h-6 w-6 shrink-0"
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
                                      ? 'bg-gray-50'
                                      : 'hover:hover:bg-gray-800 hover:text-white',
                                    'flex items-center w-full text-left rounded-md p-2 gap-x-3 text-sm leading-6 font-semibold text-gray-400'
                                  )}
                                >
                                  <item.icon
                                    className="h-6 w-6 shrink-0 text-gray-400"
                                    aria-hidden="true"
                                  />
                                  {item.name}
                                  <ChevronRightIcon
                                    className={classNames(
                                      open
                                        ? 'rotate-90 text-gray-400'
                                        : 'text-gray-400',
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
                                          as="a"
                                          href={`/profile?search=${subItem}#`}
                                          className={classNames(
                                            'hover:bg-gray-800 hover:text-white block rounded-md py-2 pr-2 pl-9 text-sm leading-6 text-gray-400'
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
                      className="group xl:hidden w-full flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-gray-800 hover:text-white"
                      onClick={handleMessageScreen}
                    >
                      <ChatBubbleLeftRightIcon
                        className="h-6 w-6 shrink-0"
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
                    className="group -mx-2 w-full flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-gray-800 hover:text-white"
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

        <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-gray-900 px-4 py-4 shadow-sm sm:px-6 lg:hidden">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          {isMessaging ? (
            <div className="px-2 text-lg font-semibold leading-6 text-gray-300">
              Messaging{' '}
            </div>
          ) : (
            <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">
              <form className="relative flex flex-1" action="#" method="GET">
                <label htmlFor="search-field" className="sr-only"></label>
                <MagnifyingGlassIcon
                  className="ml-2 pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400"
                  aria-hidden="true"
                />
                <input
                  id="search-field-main"
                  className="block h-full w-full border-0 rounded-lg py-2 pl-8 pr-0 text-black placeholder:text-gray-400 focus:outline-none focus:border-transparent sm:text-sm bg-gray-300"
                  placeholder="Search..."
                  type="search"
                  name="search"
                />
              </form>
            </div>
          )}
          <a
            className={` ${isMessaging ? 'flex justify-end flex-grow' : ''}`}
            href="/profile"
          >
            <span className="sr-only">Your profile</span>
            <img
              className="h-12 w-12 rounded-full bg-gray-50"
              src={'/profile_pic_def/gooseCom.png'}
              alt=""
            />
          </a>
        </div>

        <main className="lg:pl-72 xl:w-2/3">
          <div className="xl:pr-0 ">
            <div className="px-4 py-0 sm:px-6 lg:px-8 lg:py-0 ">
              {/* Main area */}
            </div>
            {/* search bar for large window */}
            <div className="hidden lg:flex sticky top-0 z-40 flex items-center gap-x-6 bg-gray-900 px-4 py-4 shadow-sm ">
              <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">
                <form className="relative flex flex-1" action="#" method="GET">
                  <label htmlFor="search-field" className="sr-only"></label>
                  <MagnifyingGlassIcon
                    className="ml-2 pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400"
                    aria-hidden="true"
                  />
                  <input
                    id="search-field-main"
                    className="block h-full w-full border-0 rounded-lg py-2 pl-8 pr-0 text-black placeholder:text-gray-400 focus:outline-none focus:border-transparent sm:text-sm bg-gray-300"
                    placeholder="Search..."
                    type="search"
                    name="search"
                  />
                </form>
              </div>
              <a href="/profile">
                <span className="sr-only">Your profile</span>
                <img
                  className="h-12 w-12 rounded-full bg-gray-50"
                  src={'/profile_pic_def/gooseCom.png'}
                  alt=""
                />
              </a>
            </div>
            {/* search not active */}
            <div className={` ${isLoading ? '' : 'hidden'}`}>
              <div className="image-container flex justify-center items-center relative h-screen overflow-hidden">
                {/* Opaque overlay */}
                <div className="absolute inset-0 bg-black z-20"></div>

                <div className="absolute inset-0 flex justify-center items-center md:pr-16 md:pb-6 xl:pr-16 xl:pb-6">
                  <img
                    src="/svg/WhiteLoadingIcon.svg"
                    className="w-28 z-20 animate-spin-slow"
                  />
                </div>
              </div>
            </div>
            <div className={` ${isMessaging ? 'xl:hidden' : 'hidden'}`}>
              <div className="fixed inset-0 top-3 lg:left-72 bg-black z-20">
                <Messaging
                  importMessages={messages}
                  onMessageSelect={initialdecrypttoRust}
                  searchedprofile={SearchedProfile}
                  IsSearchMessage={IsSeachMessage}
                  updateIsMessaging={updateIsMessaging}
                  UserProfile={UserProfile as UserProfile}
                />
              </div>
            </div>

            {!isSearchActive ? (
              <div className={`bg-gray-900 ${!isLoading ? '' : 'hidden'}`}>
                <Header UserProfile={UserProfile} />
                <div className="-mt-4">
                  <ListTabs
                    activeTab={activeTab}
                    onTabSelect={handleTabChange}
                  />
                </div>
                <div className="flex">
                  <div
                    className={`flex-1 bg-gray-900 ${
                      activeTab === 'Pinned' ? '' : 'hidden'
                    }`}
                  >
                    <h1 className=" ml-5 text-2xl font-bold text-white">
                      Pinned Stocks
                    </h1>
                    <hr className="mt-6 border-2 border-black" />
                    <PinnedStocksList UserProfile={UserProfile} />
                  </div>
                  <div
                    className={`flex-1 bg-gray-900 ${
                      activeTab === 'Trending' ? '' : 'hidden'
                    }`}
                  >
                    <h1 className="ml-5 text-2xl font-bold text-white">
                      Trending Stocks
                    </h1>
                    <hr className="mt-6 border-2 border-black" />
                    <TopStocksList />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 bg-gray-900">
                {/* search active*/}
                <S_Header
                  onclick={sendMessageFromSearch}
                  updateFollowList={updateFollowList}
                  followListUpd={followingList}
                  searchedprofile={SearchedProfile}
                  UserProfile={UserProfile as UserProfile}
                />{' '}
                <div className="flex-1 -mt-4">
                  <ListTabs
                    activeTab={activeTab}
                    onTabSelect={handleTabChange}
                  />
                </div>
                <div className="flex">
                  <div
                    className={`flex-1 bg-gray-900 ${
                      activeTab === 'Pinned' ? '' : 'hidden'
                    }`}
                  >
                    <h1 className=" ml-5 text-2xl font-bold text-white">
                      Pinned Stocks
                    </h1>
                    <hr className="mt-6 border-2 border-black" />
                    <S_PinnedStocksList searchedprofile={SearchedProfile} />
                  </div>
                  <div
                    className={`flex-1 bg-gray-900 ${
                      activeTab === 'Trending' ? '' : 'hidden'
                    }`}
                  >
                    <h1 className="ml-5 text-2xl font-bold text-white">
                      Trending Stocks
                    </h1>
                    <hr className="mt-6 border-2 border-black" />
                    <TopStocksList />
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        <aside className="fixed inset-y-0 right-0 hidden overflow-y-auto border-l-4 border-black bg-gray-800/100 xl:block w-1/3">
          {/* Secondary column (hidden on smaller screens) */}
          <div>
            <Messaging
              importMessages={messages}
              onMessageSelect={initialdecrypttoRust}
              searchedprofile={SearchedProfile}
              IsSearchMessage={IsSeachMessage}
              updateIsMessaging={updateIsMessaging}
              UserProfile={UserProfile as UserProfile}
            />
          </div>
        </aside>
      </div>
    </>
  )
}

export default MyProfilePage