import React from 'react'
import { websocketService } from '@/utils/websocketservice';
import { useRouter } from 'next/router'
import { Disclosure } from '@headlessui/react'
import {
  fetchUserURL,
  searchUserURL,
  baseURL,
  leaderBoardURL,
} from '../../components/backendURL'
import { jwtDecode } from 'jwt-decode'
import { Fragment, useEffect, useState } from 'react'
import Header from '../../components/Header'
import ListTabs from '../../components/ListTabs'
import TopStocksList from '../../components/TopStocksList'
import S_Header from '../../components/SearchedPages/sHeader'
import S_PinnedStocksList from '../../components/SearchedPages/sPinnedStocksList'
import EditForm from '../../components/EditComponents/EditForm'
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
import {Skeleton} from "@nextui-org/react";


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
  const [SearchedProfile, setSearchedprofile] = useState<any>()
  const gooseApp = useAxios()
  const router = useRouter()
  const SearchMsgString = router.query.SearchMessage
  const [decryptedMessages, setDecryptedMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<any>([])
  const { activeMessage } = router.query; 
  const [viewedMsgList, setviewedMsgList] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('');
  const [totalMessagesCount, setTotalMessagesCount] = useState<TotalMessagesPerUser[]> ()
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [ButtonPress, setButtonPress] = useState<boolean>(false)
  const [RefreshProfilePage, setRefreshProfilePage] = useState<boolean>(false)
  const [isSocketConnected, setisSocketConnected] = useState<boolean>(false)
  const [isWebsocketMessage, setisWebsocketMessage] = useState<boolean>(false)
  const [backgroundPrev, setbackgroundPrev] = useState<string>()
  const [profilepicPrev,setprofilepicPrev] = useState<string>()
  const [isLoggedin, setisLoggedin] = useState<boolean>(false)
  const [authTokens, setAuthTokens] = useState<any>()
  const [ranked_list, setranked_list] = useState<string[]>([])
  const wsBaseUrl = 'wss://www.gooseadmin.com';
  
  //needed to use the router.push funct from login and not break window resize
  useEffect(() => {
    async function retireveJWTfromRust() {
      try {
        const result = await invoke('retrieve_jwt_from_file') as string
        const jsonData = JSON.parse(result); 
        setAuthTokens(jsonData); 
        return jsonData
      } catch (err) {
        console.error('attempt to retrieve jwt');
      }
    }
    retireveJWTfromRust()
  }, [RefreshProfilePage])


  //window size init
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    import("@tauri-apps/api").then((tauri) => {
        tauri.window.appWindow.setPosition(new tauri.window.LogicalPosition(200, 100));
        tauri.window.appWindow.setSize(new tauri.window.LogicalSize(1300, 800));
        
      })
    
}, [])


  //websocket
  if (UserProfile && !isSocketConnected) {
    setisSocketConnected(true)
    const socket = `${wsBaseUrl}/ws/chat/${UserProfile.user_id}/`
    websocketService.connect(socket as any)
    
  }
  // handle incoming Websocket messages
  function handleMessage(data: any) {
    recievedWebsocketMessages(data)
    setisWebsocketMessage(current => !current)
    
  }
  websocketService.setMessageHandler(handleMessage);

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
      //GET profile data
      const fetchUserProfile = async () => {
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
          if (!isLoggedin) {
            setisLoggedin(true)
            swal.fire({
              title: `Login Successful`,
              color: '#cfe8fc',
              background: '#58A564',
              icon: 'success',
              toast: true,
              timer: 3000,
              position: 'top-right',
              timerProgressBar: true,
              showConfirmButton: false,
              
            });
          }
        } catch (error) {
          swal.fire({
            title: 'Failed To Fetch User',
            text: 'Please Login Again',
            color: '#cfe8fc',
            background: '#BC3838',
            icon: 'error',
            toast: true,
            timer: 2000,
            position: 'top-right',
            timerProgressBar: true,
            showConfirmButton: false,
          });
          
          setTimeout(() => {
            
           handleLogout()
            
          }, 2000)

        }
      }
      //GET Trending Data
      const fetchedLeaderBoard = async () => {
        try {
          const response = await gooseApp.get(leaderBoardURL)
          const data = response.data
          if (data.ranked_list) {
            setranked_list(data.ranked_list)
           
          } else {
            console.log('The response does not contain a ranked_list.')
          }
        } catch (error) {
          console.error('Failed to fetch the leaderboard:', error)
        }
      }
  
      fetchedLeaderBoard()

      fetchUserProfile();
      
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
    }, 100)
    return () => {
      clearTimeout(timer), controller.abort()
    }
  }, [RefreshProfilePage, authTokens, followingList])

  //loading searched profiles
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const search = params.get('search')
    
    if (search) {
      if (search === UserProfile?.username) {
        setSearchActive(false)
      } else {
        setSearchActive(true)
      }
      const handleSearchChange = async () => {
        try {
          const response = await gooseApp.get(`${searchUserURL}${search}/`)
          const fetchedUserProfile: Profile = response.data
          setSearchedprofile(fetchedUserProfile)

        } catch (error) {
          console.error('Error fetching user profile:')
          router.push('/profile')
        }
      }
      handleSearchChange()
    } else {
      setSearchActive(false)
    }


  }, [window.location.href])


  const handleMsgUpdateBetweenMSGComponents = (filteredMessage: Message) => {

    // Check if the message already exists in decryptedMessages
    const messageExists = decryptedMessages.some(message => message.id === filteredMessage.id);
    
    // If the message does not exist, add it to decryptedMessages
    if (!messageExists) {
        setDecryptedMessages(currentMessages => [...currentMessages, filteredMessage]);
    }
};


  async function initialdecrypttoRust(updMessages: Message[]) {
    console.log(updMessages)
      try {
        const result = await invoke('pull_messages_encrypted', 
        { messages: updMessages, 
          username: UserProfile?.username, 
        }); 
        const newMessages = (result as Message[]).filter((newDecryptedMesssage: Message) => 
          !decryptedMessages.some(message => message.id === newDecryptedMesssage.id)
          )
        
          if (newMessages.length > 0) {
            setDecryptedMessages((currentMessages: Message[]) => [...(newMessages as Message[]).slice().reverse(), ...currentMessages])
          } 
      } catch (error) {
          console.error('Error sending data to Rust:', error);
      }
    
  }
  //websocket individual messages
  async function sendMessagetoRustDecryption(message: any) {
    
    try {
      const result = await invoke('pull_message_to_decrypt', { message: message.message, username: UserProfile?.username }) as string;
      const decryptWebsocket = { ...message, decrypted_message: result, isWebsocket: true }
      
      setDecryptedMessages((currentMessages: Message[]) => [...currentMessages, decryptWebsocket])
      
      swal.fire({
        title: `Message: @${message.reciever_profile.username}`,
        color: '#cfe8fc',
        background: '#3864BC',
        text: result.length > 59 ? `${result.substring(0,60)}...` : result,
        icon: 'warning',
        iconColor: '#cfe8fc',
        toast: true,
        timer: 6000,
        position: 'top-right',
        timerProgressBar: true,
        showConfirmButton: false,
        
      });
      return result
    } catch (error) {
        console.error('Error sending Websocket data to Rust:', error);
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

            setTotalMessagesCount((previousCount: TotalMessagesPerUser[] | undefined) => {
              
              const index = previousCount?.findIndex(count => count.user_id === newCount.user_id);
            
              if (index !== undefined && index > -1) {
                return previousCount?.map((count, i) => i === index ? newCount : count);
              } else {
                return [...(previousCount || []), newCount];
              }
            });
            
            if (!alreadyFetched) {
              setviewedMsgList([...viewedMsgList, lookUpUsername])
            }

            await  initialdecrypttoRust( fetchedMessages.messages) as any
              
          } catch (error) {
            console.log(`failed to fetch messages for ${reciever_profile.handle || reciever_profile.profile.username}`)
          }
      }
  }

  const recievedWebsocketMessages = async (SocketMessage: any) => {    
    await  sendMessagetoRustDecryption(SocketMessage.message) as any
  }

  const fetchUnloadedMessages = async (loadedMessageCount: number, reciever_profile: any, isLoadMore: boolean) => {
    fetchMessages(reciever_profile, isLoadMore, loadedMessageCount)
  }
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

  useEffect(() => {
    const istauri = (window as any).__TAURI__ !== undefined;
    
    if (UserProfile && istauri) {
      fetchConversations()
    } 
  }, [UserProfile])

  const handleSearch = (event: any) => {
    event.preventDefault(); 
    router.push(`/profile?search=${searchTerm}#`)
    setSearchTerm('')
  };

  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName)
  }
  const handleMessageScreen = () => {
    setIsEditing(false)
    setIsMessaging(true)
    setActiveTab('empty')
    setSidebarOpen(false)
  }

  const updateFollowList = (newList: string[]) => {
    setfollowing(newList)
  }

  const handleEditButton = () => {
    setIsEditing(true)
    setIsMessaging(false)
  }

  const updateIsMessaging = () => {
    setIsMessaging(false)
    setIsEditing(false)
    setActiveTab('Pinned')
    setbackgroundPrev('')
    setprofilepicPrev('')
  }

  const sendMessageFromSearch = () => {
    setButtonPress(current => !current)
    setIsSeachMessage(true)
    setIsMessaging(true)

  }

  const updateProfilePage = () => {
    setRefreshProfilePage(current => !current)
  }

  async function deleteJWTRust(token: string) {
    invoke('save_jwt_to_file', { token })
      .then(() => console.log('jwt saved successfully'))
      .catch((err) => console.error('Error saving jwt:', err));
  }

  const handlebackgroundPrev = (backgroundPrev: string) => {
    setbackgroundPrev(backgroundPrev)
  }

  const handleprofilepicPrev = (profilePicPrev: string) => {
    setprofilepicPrev(profilePicPrev)
  }

  const handleLogout = () => {
    localStorage.removeItem('ally-supports-cache')
    deleteJWTRust('')
    websocketService.disconnect();
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
                                        <Disclosure.Panel as="ul" className="mt-1 px-2">
                                        {item.children.map(
                                          (subItem: string, index: number) => (
                                            <li key={index}>
                                              {/* 44px */}
                                              <Disclosure.Button
                                                as="div"
                                                onClick={() => {router.push(`/profile?search=${subItem}#`), setIsMessaging(false), updateIsMessaging(), setSidebarOpen(false)}}
                                                className={classNames(
                                                  'hover:bg-zinc-800 hover:text-white block rounded-md py-2 pr-2 pl-9 text-sm leading-6 text-gray-400'
                                                )}
                                              >
                                                @{subItem}
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
                            <button
                              className="group  w-full flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-zinc-800 hover:text-white"
                              onClick={() => handleEditButton()}
                            >
                              <ChatBubbleLeftRightIcon
                                className="h-6 w-6 text-zinc-600 shrink-0"
                                aria-hidden="true"
                              />
                              Edit Profile 
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
                                          onClick={() => {router.push(`/profile?search=${subItem}#`), setIsMessaging(false), updateIsMessaging()}}
                                          className={classNames(
                                            'hover:bg-zinc-800 hover:text-white block rounded-md py-2 pr-2 pl-9 text-sm leading-6 text-gray-400'
                                          )}
                                        >
                                          @{subItem}
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
                    <button
                      className="group  w-full flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-zinc-800 hover:text-white"
                      onClick={() => handleEditButton()}
                    >
                      <Cog6ToothIcon
                        className="h-6 w-6 text-zinc-600 shrink-0"
                        aria-hidden="true"
                      />
                      Edit Profile
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

        <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-zinc-900 px-4 py-2 shadow-sm sm:px-6 lg:hidden">
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
              <form className="relative flex flex-1" onSubmit={handleSearch}>
                  <label htmlFor="search-field" className="sr-only"></label>
                  <MagnifyingGlassIcon
                    className="ml-2 pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-zinc-400"
                    aria-hidden="true"
                  />
                  <input
                    id="search-field-main"
                    className="block h-full w-full border-2 border-zinc-950/60 rounded-lg py-2 pl-8 pr-0 text-zinc-400 bg-zinc-800 placeholder:text-zinc-400 focus:outline-none sm:text-sm"
                    placeholder="Search..."
                    type="search"
                    name="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </form>
            </div>
          )}
          <button
            className={` ${isMessaging ? 'flex justify-end flex-grow' : ''}`}
            onClick={() => router.push('/profile')}
          >
            <span className="sr-only">Your profile</span>
            <img
              className="h-12 w-12 rounded-full bg-gray-50"
              src={'/profile_pic_def/gooseCom.png'}
              alt=""
            />
          </button>
        </div>

        <main className="lg:pl-72 xl:w-2/3">
          <div className="xl:pr-0">
            <div className="px-4 py-0 sm:px-6 lg:px-8 lg:py-0 ">
              {/* Main area */}
            </div>
            {/* search bar for large window */}
           
            <div className="hidden lg:flex sticky top-0 z-40 flex items-center gap-x-6 bg-zinc-900 px-4 py-2 shadow-sm ">
              <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">
              {isMessaging ? (
            <div className="px-2 py-4 text-lg font-semibold leading-6 text-gray-300">
              Messaging{' '}
            </div>
          ) : (
                <form className="relative flex flex-1" onSubmit={handleSearch}>
                  <label htmlFor="search-field" className="sr-only"></label>
                  <MagnifyingGlassIcon
                    className="ml-2 pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-zinc-400"
                    aria-hidden="true"
                  />
                  <input
                    id="search-field-main"
                    className="block h-full w-full border-2 border-zinc-950/60 rounded-lg py-2 pl-8 pr-0 text-zinc-400 bg-zinc-800 placeholder:text-zinc-400 focus:outline-none sm:text-sm"
                    placeholder="Search..."
                    type="search"
                    name="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </form>
          )}
              </div>
          
              <button onClick={() => router.push('/profile')}>
                <span className="sr-only">Your profile</span>
                <img
                  className="h-12 w-12 rounded-full bg-gray-50"
                  src={'/profile_pic_def/gooseCom.png'}
                  alt=""
                />
              </button>
            </div>
            {/* search not active */}
            
            <div className={` ${isMessaging ? 'xl:hidden' : 'hidden'}`}>
              <div className="fixed inset-0 lg:left-72 bg-zinc-900 z-20">
                <Messaging
                  updateConvo={fetchConversations}
                  isWebsocketMessage={isWebsocketMessage}
                  ButtonPress={ButtonPress}
                  onSendMessage={handleMsgUpdateBetweenMSGComponents}
                  isLoading={isLoading}
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
            {isEditing && (
              <div className="fixed lg:left-72 xl:hidden inset-0 z-20 overflow-y-auto bg-zinc-900 bg-zinc-800 flex items-start justify-center pt-4 pb-4">
                <div className="mt-14 w-full mr-2 max-w-4xl mx-auto lg:left-72">
                  <EditForm 
                    UserProfile={UserProfile as UserProfile}
                    onCancelEdit={() => updateIsMessaging()}
                    updateProfilePage={updateProfilePage}
                    onbackgroundPrev={handlebackgroundPrev}
                    onprofilepicPrev={handleprofilepicPrev}
                  />
                </div>
              </div>
            )}
            {!isSearchActive ? (
              <div className='bg-zinc-900'>
                <Header 
                UserProfile={UserProfile} 
                isLoading={isLoading}
                backgroundImagePrev={backgroundPrev ? backgroundPrev: ''}
                profilepicturePrev={profilepicPrev ? profilepicPrev: ''}
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
                    <h1 className="ml-5 text-2xl py-6 font-bold text-white">
                      Trending Stocks
                    </h1>
                    <hr className="border-1 border-zinc-950" />
                    <TopStocksList
                      imported_rankedList={ranked_list}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className={`${isEditing ? '' : "flex-1 bg-zinc-900"}`}>
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
                    <TopStocksList
                      imported_rankedList={ranked_list}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        <aside className="fixed inset-y-0 right-0 hidden overflow-y-auto border-l-2 border-zinc-600 bg-zinc-900 xl:block w-1/3">
          {/* Secondary column (hidden on smaller screens) */}
          {isEditing ? (
            <div className="inset-0 mr-2 mt-4 z-50 bg-zinc-900 ">
            <EditForm 
              UserProfile={UserProfile as UserProfile}
              onCancelEdit={() => updateIsMessaging()}
              updateProfilePage={updateProfilePage}
              onbackgroundPrev={handlebackgroundPrev}
              onprofilepicPrev={handleprofilepicPrev}
              />
            </div>
          ) : ( 
            <div>
            <Messaging
              updateConvo={fetchConversations}
              isWebsocketMessage={isWebsocketMessage}
              ButtonPress={ButtonPress}
              onSendMessage={handleMsgUpdateBetweenMSGComponents}
              isLoading={isLoading}
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
          </div>)}
        </aside>
      </div>
    </>
  )
}

export default MyProfilePage