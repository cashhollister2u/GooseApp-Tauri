import React from 'react'
import { useRouter } from 'next/router'
import { Disclosure } from '@headlessui/react'
import {
  fetchUserURL,
  searchUserURL,
  baseURL,
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
import { isMacOS } from '@tauri-apps/api/helpers/os-check'


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
  id: number
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

interface TotalMessagesPerUser {
  user_id: number
  total_Msg_count: number
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
  const [decryptedMessages, setDecryptedMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<any>([])
  const [loadedMessageCount, setLoadedMessageCount] = useState<number> (0)
  const { activeMessage } = router.query; 
  const [viewedMsgList, setviewedMsgList] = useState<string[]>([])
  const [totalMessagesCount, setTotalMessagesCount] = useState<TotalMessagesPerUser[]> ()

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
  }, [isMessaging, IsSeachMessage])

  //init page data
  useEffect(() => {
    const controller = new AbortController()

    
    const timer = setTimeout(() => {
      
      if (activeMessage === 'true') {
        setIsMessaging(true)
      }
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
          
        }
      }

      if(!UserProfile){
        fetchUserfollowing()
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

  async function initialdecrypttoRust(reciever_profile: any, updMessages: Message[], messageFetched: boolean) {
    const usernameReciever = reciever_profile.handle || reciever_profile.profile.username
      try {
        const result = await invoke('pull_messages_encrypted', 
        { messages: updMessages, 
          username: UserProfile?.username, 
          privateKey: UserProfile?.private_key, 
          recieverUsername: usernameReciever,
        }); 
        const newMessages = (result as Message[]).filter((newDecryptedMesssage: Message) => 
          !decryptedMessages.some(message => message.id === newDecryptedMesssage.id)
          )
        
          if (newMessages.length > 0) {
            setDecryptedMessages((currentMessages: Message[]) => [...(newMessages as Message[]).slice().reverse(), ...currentMessages])
          }
        
        console.log('Command executed successfully', result); 

      } catch (error) {
          console.error('Error sending data to Rust:', error);
      }
    
  }
  
  const fetchMessages = async (reciever_profile: any, isLoadMore:boolean, loadedMessageCountVar:number) => {
    const lookUpUsername = reciever_profile.handle || reciever_profile.profile.username
    const alreadyFetched = viewedMsgList.some(name => 
      name === lookUpUsername
    );    

    if (alreadyFetched && !isLoadMore){
      console.log('messages have already been fetched')
      } else {
        
          try{
            const response = await gooseApp.get(
              `${baseURL}messages/${UserProfile?.user_id}/${reciever_profile.user_id || reciever_profile.profile.id || reciever_profile.id}/${loadedMessageCountVar}/`
            )
            const fetchedMessages = response.data

            const newCount: TotalMessagesPerUser = {
              user_id: reciever_profile.user_id || reciever_profile.profile.id,
              total_Msg_count: fetchedMessages.total_messages
            }

            setTotalMessagesCount((previousCount: TotalMessagesPerUser[] | undefined) => [...previousCount || [], newCount])
            console.log(totalMessagesCount, 'fix me please')
            
            if (!alreadyFetched) {
              setviewedMsgList([...viewedMsgList, lookUpUsername])
            }

            await  initialdecrypttoRust(reciever_profile, fetchedMessages.messages, alreadyFetched) as any
              
          } catch (error) {
            console.log(`failed to fetch messages for ${reciever_profile.handle || reciever_profile.profile.username}`)
          }
      }
  }

  const fetchUnloadedMessages = async (loadedMessageCount: number, reciever_profile: any, isLoadMore: boolean) => {
    setLoadedMessageCount(loadedMessageCount)
    fetchMessages(reciever_profile, isLoadMore, loadedMessageCount)
  }

  useEffect(() => {
    const istauri = (window as any).__TAURI__ !== undefined;
    
    if (UserProfile && istauri) {
      const fetchConversations = async () => {
        try {
          const response = await gooseApp.get(
            `${baseURL}conversations/${UserProfile?.user_id}/`
          )
          const fetchedConversations = response.data
       
          setConversations(fetchedConversations)
          setIsLoading(false)
        
        } catch (error) {}
      }

      fetchConversations()
    } 
  }, [UserProfile])


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
    setIsSeachMessage(true)
    const checkSize = () => {
      if (window.innerWidth >= 1280) {
        setIsMessaging(true)
      }
    }
    checkSize()
    window.addEventListener('resize', checkSize)

    return () => window.removeEventListener('resize', checkSize)
  }


  const handleLogout = () => {
    localStorage.removeItem('ally-supports-cache')
    localStorage.removeItem('pusherTransportTLS')
    localStorage.removeItem('authTokens')
    setUserProfile(undefined);
    router.push('/login');

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
              <div className="fixed inset-0 bg-black/80" />
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
                                      updateIsMessaging(),
                                      setSidebarOpen(false)
                                    }
                                    router.push(item.href)}}
                                  className={classNames(
                                    item.current
                                      ? 'bg-zinc-800 text-white'
                                      : 'text-gray-400 hover:text-white hover:bg-zinc-800',
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
                                              ? 'bg-gray-50'
                                              : 'hover:bg-zinc-800 hover:text-white',
                                            'flex items-center w-full text-left rounded-md p-2 gap-x-3 text-sm leading-6 font-semibold text-gray-400'
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
                                                  as="div"
                                                  onClick={() => {
                                                    router.push(`/profile?search=${subItem}#`),
                                                    setSidebarOpen(false)
                                                  }}
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
                              onClick={handleMessageScreen}
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
                            className="group -mx-2 w-full flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-zinc-800 hover:text-white"
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
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col border-r-2 border-zinc-600">
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
                              updateIsMessaging()
                            }
                            router.push(item.href)}}
                          className={classNames(
                            item.current
                              ? 'bg-zinc-800 text-white'
                              : 'text-gray-400 hover:text-white hover:bg-zinc-800',
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
                                      ? 'bg-gray-50'
                                      : 'hover:hover:bg-zinc-800 hover:text-white',
                                    'flex items-center w-full text-left rounded-md p-2 gap-x-3 text-sm leading-6 font-semibold text-gray-400'
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
                                          as="div"
                                          onClick={() => router.push(`/profile?search=${subItem}#`)}
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
                      className="group xl:hidden w-full flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-zinc-800 hover:text-white"
                      onClick={handleMessageScreen}
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
                    className="group -mx-2 w-full flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-zinc-800 hover:text-white"
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

        <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-zinc-900 px-4 py-4 shadow-sm sm:px-6 lg:hidden">
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
                  className="ml-2 pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-zinc-400"
                  aria-hidden="true"
                />
                <input
                  id="search-field-main"
                  className="block h-full w-full border-0 rounded-lg py-2 pl-8 pr-0 text-black placeholder:text-zinc-400 focus:outline-none focus:border-transparent sm:text-sm bg-zinc-800"
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
          <div className="xl:pr-0">
            <div className="px-4 py-0 sm:px-6 lg:px-8 lg:py-0 ">
              {/* Main area */}
            </div>
            {/* search bar for large window */}
           
            <div className="hidden lg:flex sticky top-0 z-40 flex items-center gap-x-6 bg-zinc-900 px-4 py-4 shadow-sm ">
              <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">
              {isMessaging ? (
            <div className="px-2 py-4 text-lg font-semibold leading-6 text-gray-300">
              Messaging{' '}
            </div>
          ) : (
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
          )}
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
            
            <div className={` ${isMessaging ? 'xl:hidden' : 'hidden'}`}>
              <div className="fixed inset-0 top-3 lg:top-8 lg:left-72 bg-zinc-900 z-20">
                <Messaging
                  isLoading={isLoading}
                  onResetMessageCount={setLoadedMessageCount}
                  onLoadedMessageCount={fetchUnloadedMessages}
                  importConversations={conversations}
                  importTotalMessageCount={totalMessagesCount}
                  importMessages={decryptedMessages}
                  onMessageSelect={fetchMessages}
                  searchedprofile={SearchedProfile}
                  IsSearchMessage={IsSeachMessage}
                  updateIsMessaging={updateIsMessaging}
                  UserProfile={UserProfile as UserProfile}
                />
              </div>
            </div>

            {!isSearchActive ? (
              <div className='bg-zinc-900'>
                <Header 
                UserProfile={UserProfile} 
                isLoading={isLoading}
                />
                <div className="mt-2">
                  <ListTabs
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
                    <h1 className="ml-5 h-24 text-2xl py-8 font-bold text-white">
                      Pinned Stocks
                    </h1>
                    <hr className="border-1 border-zinc-950" />
                    <PinnedStocksList UserProfile={UserProfile} />
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
              <div className="flex-1 bg-zinc-900">
                {/* search active*/}
                <S_Header
                  isLoading={isLoading}
                  onclick={sendMessageFromSearch}
                  updateFollowList={updateFollowList}
                  followListUpd={followingList}
                  searchedprofile={SearchedProfile}
                  UserProfile={UserProfile as UserProfile}
                />{' '}
                <div className="mt-4">
                  <ListTabs
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
                    <h1 className="ml-5 h-24 text-2xl py-8 font-bold text-white">
                      Pinned Stocks
                    </h1>
                    <hr className="border-1 border-zinc-950" />
                    <S_PinnedStocksList searchedprofile={SearchedProfile} />
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

        <aside className="fixed inset-y-0 right-0 hidden overflow-y-auto border-l-2 border-zinc-600 bg-zinc-900 xl:block w-1/3">
          {/* Secondary column (hidden on smaller screens) */}
          <div>
            <Messaging
              isLoading={isLoading}
              onResetMessageCount={setLoadedMessageCount}
              onLoadedMessageCount={fetchUnloadedMessages}
              importConversations={conversations as UserProfile[]}
              importTotalMessageCount={totalMessagesCount}
              importMessages={decryptedMessages}
              onMessageSelect={fetchMessages}
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