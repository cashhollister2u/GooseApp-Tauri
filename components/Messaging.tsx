import { Fragment, useEffect, useState, useRef } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid'
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import useAxios from '@/utils/useAxios'
import { mediaURL, baseURL } from './backendURL'
import Pusher from 'pusher-js'
import { invoke } from '@tauri-apps/api/tauri';



function classNames(...classes: any) {
  return classes.filter(Boolean).join(' ')
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
}

interface Profile {
  username: string
  profile_picture: string
  full_name: string
  verified: boolean
}

interface Team {
  name: string
  handle: string
  href: string
  imageUrl: string
  status: string
  user_id: number
  profile: Profile
  id: number
  public_key: string
}

interface Recommendation {
  id: number
  profile: Profile
}

type recommendationList = Recommendation[]

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

const Messaging: React.FC<{
  searchedprofile: any
  UserProfile: UserProfile
  updateIsMessaging: () => void
  onMessageSelect: (reciever_profile: UserProfile) => void
  IsSearchMessage: boolean
  importMessages: Message[]
}> = ({
  UserProfile,
  onMessageSelect,
  updateIsMessaging,
  IsSearchMessage,
  searchedprofile,
  importMessages,
}) => {
  const [followList, setFollowList] = useState<string[]>([])
  const [viewmsg, setviewmsg] = useState<Team>()
  const [myUsername, setMyUsername] = useState<string>('')
  const [profile_pic_url, setprofile_pic_url] = useState<string>(`${mediaURL}${viewmsg?.profile?.profile_picture || ''}`)
  const [myProfile, setmyProfile] = useState<UserProfile>()
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false)
  const [isSearchMessageUpd, setisSearchMessageUpd] = useState<boolean>(false)
  const [tabvalue, settabvalue] = useState<boolean>(true)
  const [isRecommendations, setRecommendations] = useState<boolean>(false)
  const [recommendationList, setRecommendaionsList] = useState<recommendationList>([])
  const [filteredRecommendations, setFilteredRecommendations] = useState(recommendationList)
  const [messages, setmessages] = useState<Message[]>([])
  const messageRef = useRef<HTMLDivElement>(null)
  const gooseApp = useAxios()

  let [newMessage, setnewMessage] = useState({ message: '' })
  let seenUsernames = new Set()
  let Private_Key = UserProfile?.private_key
  const tabs = [{ name: 'Inbox', href: '#', current: tabvalue }]

  const team = (messages || [])
    .filter((message) => {
      const username = message.reciever_profile.username
      const senderUsername = message.sender_profile.username

      if (!seenUsernames.has(username) && username !== myUsername) {
        seenUsernames.add(username)
        return true
      } else if (
        !seenUsernames.has(senderUsername) &&
        senderUsername !== myUsername
      ) {
        seenUsernames.add(senderUsername)
        return true
      }

      return false
    })
    .map((message) => {
      if (message.reciever_profile.username === myUsername) {
        return {
          name: message.sender_profile.full_name,
          user_id: message.sender,
          handle: message.sender_profile.username,
          public_key: message.sender_profile.public_key,
          imageUrl: message.sender_profile.profile_picture,
          status: 'online',
        }
      }
      return {
        name: message.reciever_profile.full_name,
        user_id: message.reciever,
        handle: message.reciever_profile.username,
        public_key: message.reciever_profile.public_key,
        imageUrl: message.reciever_profile.profile_picture,
        status: 'online',
      }
    })

  useEffect(() => {
    if (IsSearchMessage) {
      setisSearchMessageUpd(IsSearchMessage)
      const newMsg: any = {
        name: searchedprofile.profile.full_name,
        user_id: searchedprofile.id,
        handle: searchedprofile.profile.username,
        imageUrl: searchedprofile.profile.profile_picture,
        public_key: searchedprofile.public_key,
        status: 'online',
      }
      setviewmsg(newMsg)

      settabvalue(false)
    }
  }, [IsSearchMessage])

  useEffect(() => {
    if (isSearchMessageUpd) {
      setprofile_pic_url(`${viewmsg?.profile?.profile_picture}`)
    }
    if (!isSearchMessageUpd) {
      setprofile_pic_url(`${mediaURL}${viewmsg?.profile?.profile_picture}`)
    }

      if (messageRef.current) {
        messageRef.current.scrollIntoView({
          block: 'end',
          inline: 'nearest',
        })
      }
  
  }, [viewmsg?.user_id, viewmsg?.id])

  useEffect(() => {
    
    setTimeout(() => {
      if (messageRef.current ) {
       
        messageRef.current.scrollIntoView({
          block: 'end',
          inline: 'nearest',
        })
      }
    }, 100)
   
  }, [messages])


  useEffect(() => {
    if (!UserProfile) {
      return
    }
    const fetchUserData = () => {
      if (UserProfile) {
        UserProfile.following.forEach((follow: any) => {
          if (!followList.includes(follow.profile.username)) {
            followList.push(follow.profile.username)
            recommendationList.push(follow)
          }
        })

        setMyUsername(UserProfile.username)
        setmyProfile(UserProfile)
      }
    }

    fetchUserData()
  }, [UserProfile])

  useEffect(() => {
    setmessages(importMessages)
  }, [importMessages])

  useEffect(() => {
    if (!UserProfile) {
      return
    } else if (UserProfile && UserProfile.user_id && !isSubscribed) {
      // Enable pusher logging - don't include this in production
      Pusher.logToConsole = false

      const pusher = new Pusher('e8b979f516a8b07b0f85', {
        cluster: 'us2',
      })

      const channel = pusher.subscribe(`channel-${UserProfile.user_id}`)

      channel.bind('message', function (data: any) {
        if (!messages.includes(data)) {
          const decrypted = sendMessagetoRustDecryption(data.message, Private_Key)
          const recieved_message = { ...data, decrypted_message: decrypted }
          setmessages((prevMessages): any => {
            const updatedMessages = [...prevMessages, recieved_message]
            setTimeout(() => {
              if (messageRef.current) {
                messageRef.current.scrollIntoView({
                  behavior: 'smooth',
                  block: 'end',
                  inline: 'nearest',
                })
              }
            }, 100)

            return updatedMessages
          })
        }
      })

      setIsSubscribed(true)

      return () => {
        channel.unbind_all()
        channel.unsubscribe()
      }
    }
  }, [UserProfile])

  const LoadsearchedUser = (username?: string) => {
    const params = new URLSearchParams(window.location.search)
    const search = params.get('search') as string
    if (search === username) {
      updateIsMessaging()
    }
    window.location.href = `/profile?search=${username}#`
  }

  //for what ever reason handle change works better with type any
  const handleChange = (event: any) => {
    {
      setnewMessage({
        ...newMessage,
        [event.target.name]: event.target.value,
      })
    }
  }

  const handleViewMsg = (reciever_profile: Team) => {
    if (team.length === 0) {
      setviewmsg(reciever_profile)
      team.push(reciever_profile)
    }
    for (const user of team as any) {
      if (user.user_id === reciever_profile.id) {
        setviewmsg(user)
        break
      } else {
        setviewmsg(reciever_profile)
      }
    }
  }

  const handleRecommendationschange = (event: any) => {
    const searchText = event.target.value.toLowerCase()

    // Filter the original recommendations list
    const filteredList = recommendationList.filter((reciever_profile) =>
      reciever_profile.profile.username.toLowerCase().includes(searchText)
    )

    // Update the state with the filtered list
    setFilteredRecommendations(filteredList)
  }

  async function sendMessageToRust(message: string, public_key: string): Promise<string> {
    try {
      const result = await invoke('pull_message_to_encrypt', { message: message, publicKey: public_key }) as string;
      console.log('Command executed successfully', result);
      return result
    } catch (error) {
        console.error('Error sending data to Rust:', error);
        throw new Error('Error sending data to Rust');
    }
}

async function sendMessagetoRustDecryption(message: string, private_key: string) {
  try {
    const result = await invoke('pull_message_to_decrypt', { message: message, privateKey: private_key });
    console.log('Command executed successfully', result);
    return result
  } catch (error) {
      console.error('Error sending data to Rust:', error);
  }
}

  const SendMessage = async () => {
    const senderUserId = myProfile?.user_id?.toString() || ''
    const recieverId = viewmsg?.user_id?.toString() || viewmsg?.id?.toString() || ''
      
    if (newMessage?.message && viewmsg?.public_key) {
        sendMessageToRust(newMessage.message, viewmsg.public_key);
      }
      if (newMessage?.message && viewmsg?.public_key) {
        const encryptedMessage = await sendMessageToRust(newMessage.message, viewmsg.public_key);
        const encryptedSenderMessage = await sendMessageToRust(newMessage.message, UserProfile.public_key);

        if (encryptedMessage) {
        const formdata = new FormData()
        formdata.append('user', senderUserId)
        formdata.append('sender', senderUserId)
        formdata.append('reciever', recieverId)
        formdata.append('message', encryptedMessage)
        formdata.append('sender_message', encryptedSenderMessage)
        
      try {
        gooseApp
          .post(baseURL + 'send-messages/', formdata, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })
          .then((res: any) => {
            if (!messages.includes(res.data)) {
                sendMessagetoRustDecryption(res.data.sender_message, Private_Key).then(decrypted => {
                const sent_message = { ...res.data, decrypted_message: decrypted }
                console.log(sent_message)

                const newMsg: any = {
                  name: res.data.reciever_profile.full_name,
                  user_id: res.data.reciever,
                  handle: res.data.reciever_profile.username,
                  public_key: res.data.reciever_profile.public_key,
                  imageUrl: res.data.reciever_profile.profile_picture,
                  status: 'online',
                }
                setviewmsg(newMsg)
                setmessages((prevMessages) => {
                  const updatedMessages = [...prevMessages, sent_message]
                  return updatedMessages
                })
              }).catch(error => {
                console.error('Error decrypting message:', error);
              });
            }
            setTimeout(() => {
              if (messageRef.current) {
                messageRef.current.scrollIntoView({
                  behavior: 'smooth',
                  block: 'end',
                  inline: 'nearest',
                })
              }
            }, 100)

            setnewMessage({ message: '' })
          })
      } catch (error) {
        console.error(error)
      }
    }
    }
  }

  

  return (
    <div className="h-screen flex flex-col ">
      <div className=" bg-white shadow-xl ">
        <div className="items-start justify-between">
          <div>
            <div className="flex  h-screen w-full flex-col bg-black shadow-xl">
              <div className="bg-gray-900 p-7 ">
                <div>
                  <div className="text-lg font-semibold leading-6 text-gray-300">
                    Messaging
                  </div>
                </div>
              </div>

              <div className="px-4  bg-gray-900 ">
                <div className="flex-1 text-sm  font-semibold leading-6 text-gray-900 ">
                  <div className="relative flex mb-4 flex-1">
                    <MagnifyingGlassIcon
                      className="ml-2 pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400"
                      aria-hidden="true"
                    />
                    <input
                      id="text"
                      className="block h-full w-full border-0 rounded-lg py-2 pl-8 pr-0 text-white bg-black placeholder:text-gray-400 focus:outline-none focus:border-transparent sm:text-sm"
                      placeholder="Send Message"
                      onFocus={() => {
                        setRecommendations(true), settabvalue(true)
                      }}
                      type="text"
                      name="start-message"
                      onChange={handleRecommendationschange}
                    />
                  </div>
                </div>
              </div>
              <div className="border-b bg-gray-900 border-black">
                <div className="px-6 ">
                  <nav className="-mb-px flex space-x-6">
                    {tabs.map((tab) => (
                      <button
                        key={tab.name}
                        onClick={() => {
                          settabvalue(true)
                          setRecommendations(false)
                          setisSearchMessageUpd(false)
                        }}
                        className={classNames(
                          tab.current
                            ? 'border-indigo-500 hover:bg-gray-200/50 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                          'whitespace-nowrap border-b-2 px-1 py-2 rounded pb-4 text-sm font-medium w-14'
                        )}
                      >
                        {tab.name}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        settabvalue(true)
                      }}
                      className={classNames(
                        !tabvalue
                          ? 'border-indigo-500 text-indigo-600'
                          : 'hidden',
                        'whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-medium'
                      )}
                    >
                      {viewmsg?.handle || viewmsg?.profile?.username}
                    </button>
                  </nav>
                </div>
              </div>
              <ul
                role="list"
                className="flex-1 divide-y bg-black divide-black overflow-y-auto"
              >
                {tabvalue ? (
                  isRecommendations ? (
                    filteredRecommendations?.map(
                      (reciever_profile: any, index) => (
                        <li key={index}>
                          <div className="group relative flex items-center px-5 py-6">
                            <button
                              className="-m-1 block flex-1 p-1"
                              onClick={() => {
                                handleViewMsg(reciever_profile),
                                  settabvalue(false),
                                  onMessageSelect(reciever_profile)
                              }}
                            >
                              <div
                                className="absolute inset-0 group-hover:bg-gray-700"
                                aria-hidden="true"
                              />
                              <div className="relative flex min-w-0 flex-1 items-center">
                                <span className="relative inline-block flex-shrink-0">
                                  <img
                                    className="h-10 w-10 rounded-full"
                                    src={`${mediaURL}${
                                      reciever_profile?.profile
                                        ?.profile_picture || ''
                                    }`}
                                    alt=""
                                  />
                                  <span
                                    className={classNames(
                                      'online' === 'online'
                                        ? 'bg-green-400'
                                        : 'bg-gray-300',
                                      'absolute top-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white'
                                    )}
                                    aria-hidden="true"
                                  />
                                </span>
                                <div className="ml-4 truncate">
                                  <p className="truncate text-sm font-medium text-white">
                                    {reciever_profile?.profile?.full_name || ''}
                                  </p>
                                  <p className="truncate text-sm text-gray-400/80">
                                    {'@' + reciever_profile?.profile?.username}
                                  </p>
                                </div>
                              </div>
                            </button>
                            <Menu
                              as="div"
                              className="relative ml-2 inline-block flex-shrink-0 text-left"
                            >
                              <Menu.Button className="group relative inline-flex h-8 w-8 items-center justify-center ">
                                <span className="absolute -inset-1.5" />
                                <span className="sr-only">
                                  Open options menu
                                </span>
                                <span className="flex h-full w-full items-center justify-center ">
                                  <EllipsisVerticalIcon
                                    className="h-5 w-5 text-white group-hover:text-gray-500"
                                    aria-hidden="true"
                                  />
                                </span>
                              </Menu.Button>
                              <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                              >
                                <Menu.Items className="absolute right-9 top-0 z-10 w-48 origin-top-right rounded-md bg-white shadow-lg  focus:outline-none">
                                  <div className="py-1">
                                    <Menu.Item>
                                      {({ active }) => (
                                        <a
                                          href={`/profile?search=${reciever_profile.handle}#`}
                                          className={classNames(
                                            active
                                              ? 'bg-gray-100 text-gray-900'
                                              : 'text-gray-700',
                                            'block px-4 py-2 text-sm'
                                          )}
                                        >
                                          View profile
                                        </a>
                                      )}
                                    </Menu.Item>
                                  </div>
                                </Menu.Items>
                              </Transition>
                            </Menu>
                          </div>
                        </li>
                      )
                    )
                  ) : (
                    team?.map((reciever_profile: any) => (
                      <li key={reciever_profile.handle}>
                        <div className="group relative flex items-center px-5 py-6">
                          <button
                            className="-m-1 block flex-1 p-1"
                            onClick={() => {
                              setviewmsg(reciever_profile), settabvalue(false), onMessageSelect(reciever_profile)
                            }}
                          >
                            <div
                              className="absolute inset-0 group-hover:bg-gray-700"
                              aria-hidden="true"
                            />
                            <div className="relative flex min-w-0 flex-1 items-center">
                              <span className="relative inline-block flex-shrink-0">
                                <img
                                  className="h-10 w-10 rounded-full"
                                  src={
                                    `${
                                      reciever_profile.imageUrl
                                    }?v=${new Date().getTime()}` ||
                                    profile_pic_url
                                  }
                                  alt=""
                                />
                                <span
                                  className={classNames(
                                    reciever_profile.status === 'online'
                                      ? 'bg-green-400'
                                      : 'bg-gray-300',
                                    'absolute top-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white'
                                  )}
                                  aria-hidden="true"
                                />
                              </span>
                              <div className="ml-4 truncate">
                                <p className="truncate text-sm font-medium text-white">
                                  {reciever_profile.name}
                                </p>
                                <p className="truncate text-sm text-gray-400/80">
                                  {'@' + reciever_profile.handle}
                                </p>
                              </div>
                            </div>
                          </button>
                          <Menu
                            as="div"
                            className="relative ml-2 inline-block flex-shrink-0 text-left"
                          >
                            <Menu.Button className="group relative inline-flex h-8 w-8 items-center justify-center ">
                              <span className="absolute -inset-1.5" />
                              <span className="sr-only">Open options menu</span>
                              <span className="flex h-full w-full items-center justify-center ">
                                <EllipsisVerticalIcon
                                  className="h-5 w-5 text-white group-hover:text-gray-500"
                                  aria-hidden="true"
                                />
                              </span>
                            </Menu.Button>
                            <Transition
                              as={Fragment}
                              enter="transition ease-out duration-100"
                              enterFrom="transform opacity-0 scale-95"
                              enterTo="transform opacity-100 scale-100"
                              leave="transition ease-in duration-75"
                              leaveFrom="transform opacity-100 scale-100"
                              leaveTo="transform opacity-0 scale-95"
                            >
                              <Menu.Items className="absolute right-9 top-0 z-10 w-48 origin-top-right rounded-md bg-white shadow-lg  focus:outline-none">
                                <div className="py-1">
                                  <Menu.Item>
                                    {({ active }) => (
                                      <a
                                        href={`/profile?search=${reciever_profile.handle}#`}
                                        className={classNames(
                                          active
                                            ? 'bg-gray-100 text-gray-900'
                                            : 'text-gray-700',
                                          'block px-4 py-2 text-sm'
                                        )}
                                      >
                                        View profile
                                      </a>
                                    )}
                                  </Menu.Item>
                                </div>
                              </Menu.Items>
                            </Transition>
                          </Menu>
                        </div>
                      </li>
                    ))
                  )
                ) : (
                  <div className="pr-8 flex flex-col">
                    <button
                      className="sticky top-1 flex z-20 items-start  ml-4 bg-gray-400/80 py-2 rounded w-full hover:bg-gray-300"
                      onClick={() => {
                        if (viewmsg?.handle) {
                          LoadsearchedUser(viewmsg.handle)
                        } else if (viewmsg?.profile.username) {
                          LoadsearchedUser(viewmsg.profile.username)
                        }
                      }}
                    >
                      <div className="px-2 flex items-center">
                        <div>
                          <img
                            className="inline-block h-9 w-9 rounded-full"
                            src={viewmsg?.imageUrl || `${profile_pic_url}`}
                            alt=""
                          />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-black group-hover:text-gray-900">
                            {viewmsg?.name || viewmsg?.profile?.full_name}
                          </p>
                          <p className="text-xs font-medium text-gray-800 group-hover:text-gray-700">
                            @{viewmsg?.handle || viewmsg?.profile?.username}
                          </p>
                        </div>
                      </div>
                    </button>
                    <div>
                      <div ref={messageRef} className="flex flex-col">
                        <div  className="flex-1  mb-32 overflow-y-auto ">
                          {messages
                            ?.filter(
                              (message) =>
                                viewmsg?.handle ===
                                  message.sender_profile.username ||
                                viewmsg?.handle ===
                                  message.reciever_profile.username
                            )
                            .map((message: any) => (
                              <li key={message.id}>
                                <div
                                  className={`group word-break: break-word  relative flex flex-col ${
                                    viewmsg?.handle !==
                                    message.sender_profile.username
                                      ? 'items-end ml-10'
                                      : 'items-start mr-10'
                                  }`}
                                >
                                  <div className="flex-1 mt-2 text-gray-500 py-2 ml-4 text-sm">
                                    {new Date(
                                      message?.date
                                    ).toLocaleDateString() +
                                      ' ' +
                                      new Date(
                                        message?.date
                                      ).toLocaleTimeString([], {
                                        hour: 'numeric',
                                        minute: 'numeric',
                                      })}
                                    <br />
                                  </div>

                                  <div
                                    className={`ml-4 px-4 py-2 rounded-xl  ${
                                      viewmsg?.handle !==
                                      message.sender_profile.username
                                        ? 'bg-indigo-600'
                                        : 'bg-gray-500/90'
                                    }`}
                                  >
                                    {message.decrypted_message}
                                  </div>
                                </div>
                              </li>
                            ))}
                        </div>
                        <div className="absolute w-full bottom-0 bg-black py-4 px-4 right-5 ">
                          <div className="flex mr-8 items-start space-x-4">
                            <div className="flex-shrink-0">
                              <img
                                className="ml-4 inline-block h-12 w-12 rounded-full"
                                src={`${mediaURL}${myProfile?.profile_picture}`}
                                alt=""
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div>
                                <div className="border-b border-gray-200 focus-within:border-indigo-600">
                                  <label htmlFor="message" className="sr-only">
                                    Add your message
                                  </label>
                                  <input
                                    type="text"
                                    name="message"
                                    id="text-input"
                                    className="px-2 py-1 bg-black block w-full resize-none border-0 border-b border-transparent p-0 pb-2 text-white placeholder:text-gray-400 focus:border-indigo-600 focus:ring-0 sm:text-sm sm:leading-6"
                                    placeholder="Add your message..."
                                    value={newMessage.message}
                                    onChange={handleChange}
                                    onKeyDown={(event) => {
                                      if (event.key === 'Enter') {
                                        event.preventDefault()
                                        SendMessage()
                                      }
                                    }}
                                  />
                                </div>
                                <div className="flex justify-between pt-2">
                                  <div className="flex items-center space-x-5">
                                    <div className="flow-root"></div>
                                  </div>
                                  <div className="flex-shrink-0">
                                    <button
                                      type="submit"
                                      className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                      onClick={SendMessage}
                                    >
                                      Post
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </ul>
            </div>
          </div>
        </div>
        <div />
      </div>
    </div>
  )
}

export default Messaging