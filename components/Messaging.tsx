import { Fragment, useEffect, useState, useRef } from "react";
import { Spinner } from "@nextui-org/react";
import { Menu, Transition } from "@headlessui/react";
import { EllipsisVerticalIcon } from "@heroicons/react/20/solid";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import useAxios from "@/utils/useAxios";
import { mediaURL, baseURL } from "./backendURL";
import { invoke } from "@tauri-apps/api/tauri";
import { useRouter } from "next/router";
import { websocketService } from "@/utils/websocketservice";
import { retirevePrivKey } from "../components/filemanagement";

function classNames(...classes: any) {
  return classes.filter(Boolean).join(" ");
}

interface Message {
  id: number;
  user: number;
  sender_profile: UserProfile;
  reciever_profile: UserProfile;
  reciever: number;
  message: string;
  is_read: boolean;
  date: string;
  sender: number;
  name: string;
  public_key: string;
  sender_message: string;
  decrypted_message?: string;
  handle?: string;
  isWebsocket?: boolean;
}

interface Profile {
  username: string;
  profile_picture: string;
  full_name: string;
  verified: boolean;
  id: number;
}

interface allConversations {
  name: string;
  handle: string;
  href: string;
  imageUrl: string;
  status: string;
  user_id: number;
  profile: Profile;
  id: number;
  public_key: string;
}

interface Recommendation {
  id: number;
  profile: Profile;
}

type recommendationList = Recommendation[];

interface UserProfile {
  full_name: string;
  background_image: string;
  profile_picture: string;
  bio: string;
  username: string;
  values5: string[];
  follow_list: string[];
  user_id: number;
  following: any;
  public_key: string;
  id: number;
}

interface UserSentMessageCount {
  user_id: number;
  total_sent_count: number;
}

interface TotalMessagesPerUser {
  user_id: number;
  total_Msg_count: number;
}

const Messaging: React.FC<{
  searchedprofile: any;
  UserProfile: UserProfile;
  updateIsMessaging: () => void;
  updateConvo: () => void;
  onMessageSelect: (
    reciever_profile: UserProfile,
    isLoadMore: boolean,
    loadedMessageCount: number
  ) => void;
  onSendMessage: (filteredMessages: any) => void;
  IsSearchMessage: boolean;
  importMessages: Message[];
  importConversations: UserProfile[];
  onLoadedMessageCount: (
    loadedMessageCount: number,
    reciever_profile: any,
    isLoadMore: boolean
  ) => void;
  importTotalMessageCount: TotalMessagesPerUser[] | undefined;
  isLoading: boolean;
  ButtonPress: boolean;
  isWebsocketMessage: boolean;
}> = ({
  UserProfile,
  ButtonPress,
  updateConvo,
  onLoadedMessageCount,
  onMessageSelect,
  onSendMessage,
  updateIsMessaging,
  IsSearchMessage,
  searchedprofile,
  importMessages,
  importTotalMessageCount,
  importConversations,
  isLoading,
  isWebsocketMessage,
}) => {
  const [isSlowScroll, setIsSlowScroll] = useState<boolean>(false);
  const [followList, setFollowList] = useState<string[]>([]);
  const [viewmsg, setviewmsg] = useState<allConversations>();
  const [profile_pic_url, setprofile_pic_url] = useState<string>(
    `${mediaURL}${viewmsg?.profile?.profile_picture || ""}`
  );
  const [myProfile, setmyProfile] = useState<UserProfile>();
  const [isSearchMessageUpd, setisSearchMessageUpd] = useState<boolean>(false);
  const [tabvalue, settabvalue] = useState<boolean>(true);
  const [isRecommendations, setRecommendations] = useState<boolean>(false);
  const [isViewMsgChange, setisViewMsgChange] = useState<boolean>(false);
  const [isfirstmessageref, setisfirstmessageref] = useState<boolean>(true);
  const [recommendationList, setRecommendationsList] = useState<
    Recommendation[]
  >([]);
  const [filteredRecommendations, setFilteredRecommendations] =
    useState(recommendationList);
  const [messages, setmessages] = useState<Message[]>([]);
  const [localMessageCount, setLocalMessageCount] = useState<number>(0);
  const [totalSentMessageCount, setTotalSentMessageCount] =
    useState<UserSentMessageCount[]>();
  const [isLoadMore, setIsLoadMore] = useState<boolean>(false);
  const messageRef = useRef<HTMLDivElement>(null);
  const newMessagesRef = useRef<HTMLLIElement>(null);
  const gooseApp = useAxios();
  const router = useRouter();
  const tabs = [{ name: "Inbox", href: "#", current: tabvalue }];
  const allConversations = (importConversations || []).map(
    (conversation: UserProfile) => {
      return {
        name: conversation.full_name,
        user_id: conversation.id,
        handle: conversation.username,
        public_key: conversation.public_key,
        imageUrl: conversation.profile_picture,
        status: "online",
      };
    }
  );
  const filteredMessages = messages?.filter(
    (message) =>
      viewmsg?.handle === message.sender_profile?.username ||
      viewmsg?.handle === message.reciever_profile?.username ||
      ""
  );
  const numberOfFilteredMessages = Math.ceil(
    (filteredMessages?.length - localMessageCount) / 15
  );

  let [newMessage, setnewMessage] = useState({ message: "" });

  let numberOfLoadedMessages: number;
  if (filteredMessages.length % 15 === 0) {
    numberOfLoadedMessages = 15;
  } else {
    numberOfLoadedMessages = filteredMessages.length % 15;
  }

  //handle Websocket Messages
  useEffect(() => {
    setTimeout(() => {
      if (messageRef.current) {
        messageRef.current.scrollIntoView({
          behavior: "smooth",
          block: "end",
          inline: "nearest",
        });
      }
    }, 100);
  }, [isWebsocketMessage]);

  //init clicks and load more...
  useEffect(() => {
    if (!isLoadMore && !isSlowScroll) {
      setTimeout(() => {
        if (messageRef.current) {
          messageRef.current.scrollIntoView({
            block: "end",
            inline: "nearest",
          });
        }
      }, 10);
    } else if (!isSlowScroll && !isfirstmessageref) {
      setTimeout(() => {
        if (newMessagesRef.current) {
          newMessagesRef.current.scrollIntoView({
            block: "end",
            inline: "nearest",
          });
        }
      }, 0);
    }
  }, [viewmsg, messages]);

  useEffect(() => {
    if (IsSearchMessage) {
      setisSearchMessageUpd(IsSearchMessage);
      const newMsg: any = {
        name: searchedprofile.profile.full_name,
        user_id: searchedprofile.id,
        handle: searchedprofile.profile.username,
        imageUrl: searchedprofile.profile.profile_picture,
        public_key: searchedprofile.public_key,
        status: "online",
      };
      handleViewMessage(newMsg);
      onMessageSelect(newMsg, false, numberOfFilteredMessages);
      settabvalue(false);
    }
  }, [IsSearchMessage, searchedprofile, ButtonPress]);

  useEffect(() => {
    if (isSearchMessageUpd) {
      setprofile_pic_url(`${viewmsg?.profile?.profile_picture}`);
    }
    if (!isSearchMessageUpd) {
      setprofile_pic_url(`${mediaURL}${viewmsg?.profile?.profile_picture}`);
    }

    if (messageRef.current && !isSlowScroll) {
      messageRef.current.scrollIntoView({
        block: "end",
        inline: "nearest",
      });
    }
  }, [viewmsg?.user_id, viewmsg?.id]);

  useEffect(() => {
    if (!UserProfile) {
      return;
    }
    const fetchUserData = () => {
      if (UserProfile) {
        UserProfile.following.forEach((follow: any) => {
          if (!followList.includes(follow.profile.username)) {
            followList.push(follow.profile.username);
            recommendationList.push(follow);
          }
        });
        setmyProfile(UserProfile);
      }
    };

    fetchUserData();
  }, [UserProfile]);

  useEffect(() => {
    const newMessages = importMessages.filter(
      (importMessage) =>
        !messages.some((message) => message.id === importMessage.id)
    );
    if (newMessages[0]?.isWebsocket == true) {
      setmessages((previousMessages) => [...previousMessages, ...newMessages]);
    } else if (newMessages.length > 0) {
      setmessages((previousMessages) => [...newMessages, ...previousMessages]);
    }
  }, [importMessages, viewmsg]);

  useEffect(() => {
    const usernameReciever = viewmsg?.handle || viewmsg?.profile.username;
    const user_idReciever = viewmsg?.user_id || viewmsg?.profile.id;

    const userMessageCount = importTotalMessageCount?.find(
      (user) => user.user_id === user_idReciever
    );
    const sentMessageCount = totalSentMessageCount?.find(
      (user) => user.user_id === user_idReciever
    );

    const rawMsgCount = userMessageCount ? userMessageCount.total_Msg_count : 0; // Default to 0 if not found
    const rawMsgPlusSentCount =
      userMessageCount && sentMessageCount
        ? userMessageCount.total_Msg_count + sentMessageCount.total_sent_count
        : 0;

    const decryptedMsgCount = messages.filter((message) => {
      return (
        message.reciever_profile?.username === usernameReciever ||
        message.sender_profile?.username === usernameReciever
      );
    }).length;

    const totalCountVar = rawMsgPlusSentCount || rawMsgCount;

    const loadMoreValue = totalCountVar > decryptedMsgCount;
    setIsLoadMore(loadMoreValue);
  }, [messages]);

  const LoadsearchedUser = (username?: string) => {
    updateIsMessaging();

    router.push(`/profile?search=${username}#`);
  };

  //for what ever reason handle change works better with type any
  const handleChange = (event: any) => {
    {
      setnewMessage({
        ...newMessage,
        [event.target.name]: event.target.value,
      });
    }
  };

  const handleViewMessage = (reciever_profile: allConversations) => {
    setviewmsg(reciever_profile);
    setisfirstmessageref(false);
  };

  const handleViewMsgInitialMessageCase = (
    reciever_profile: allConversations
  ) => {
    if (allConversations.length === 0) {
      setviewmsg(reciever_profile);
      allConversations.push(reciever_profile);
    }
    for (const user of allConversations as any) {
      if (user.user_id === reciever_profile.id) {
        setviewmsg(user);
        break;
      } else {
        setviewmsg(reciever_profile);
      }
    }
  };

  const handleRecommendationschange = (event: any) => {
    const searchText = event.target.value.toLowerCase();

    const filteredList = recommendationList.filter((reciever_profile) =>
      reciever_profile.profile.username.toLowerCase().includes(searchText)
    );

    setFilteredRecommendations(filteredList);
  };

  async function sendMessageToRustEncryption(
    message: string,
    public_key: string
  ): Promise<string> {
    try {
      const result = (await invoke("pull_message_to_encrypt", {
        message: message,
        publicKey: public_key,
      })) as string;

      return result;
    } catch (error) {
      console.error("Error sending data to Rust:", error);
      throw new Error("Error sending data to Rust");
    }
  }

  async function sendMessagetoRustDecryption(message: string) {
    const Priv_key =
      UserProfile && (await retirevePrivKey(UserProfile?.username));
    try {
      const result = await invoke("pull_message_to_decrypt", {
        message: message,
        privateKey: Priv_key,
      });
      return result;
    } catch (error) {
      console.error("Error sending data to Rust:", error);
    }
  }

  const SendMessage = async () => {
    const senderUserId = myProfile?.user_id?.toString() || "";
    const recieverId =
      viewmsg?.user_id?.toString() || viewmsg?.id?.toString() || "";

    setIsSlowScroll(true);

    if (newMessage?.message && viewmsg?.public_key) {
      const encryptedMessage = await sendMessageToRustEncryption(
        newMessage.message,
        viewmsg.public_key
      );
      const encryptedSenderMessage = await sendMessageToRustEncryption(
        newMessage.message,
        UserProfile.public_key
      );

      if (encryptedMessage) {
        const formdata = new FormData();
        formdata.append("user", senderUserId);
        formdata.append("sender", senderUserId);
        formdata.append("reciever", recieverId);
        formdata.append("message", encryptedMessage);
        formdata.append("sender_message", encryptedSenderMessage);

        try {
          gooseApp
            .post(baseURL + "send-messages/", formdata, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            })
            .then((res: any) => {
              if (res.status === 201) {
                websocketService.sendMessage(res.data, recieverId);
              }
              if (!messages.includes(res.data)) {
                sendMessagetoRustDecryption(res.data.sender_message)
                  .then((decrypted) => {
                    const sent_message = {
                      ...res.data,
                      decrypted_message: decrypted,
                    };

                    const newMsg: any = {
                      name: res.data.reciever_profile.full_name,
                      user_id: res.data.reciever,
                      handle: res.data.reciever_profile.username,
                      public_key: res.data.reciever_profile.public_key,
                      imageUrl: res.data.reciever_profile.profile_picture,
                      status: "online",
                    };

                    const conversationExists = allConversations.some(
                      (conversation) => conversation.handle === newMsg.handle
                    );

                    if (!conversationExists) {
                      updateConvo();
                    }

                    const sentMessageCount = totalSentMessageCount?.find(
                      (user) => user.user_id === res.data.reciever
                    );

                    const newMsgCount: UserSentMessageCount = {
                      user_id: res.data.reciever,
                      total_sent_count: sentMessageCount
                        ? sentMessageCount.total_sent_count + 1
                        : 0,
                    };
                    setTotalSentMessageCount(
                      (previousCount: UserSentMessageCount[] | undefined) => {
                        const index = previousCount?.findIndex(
                          (count) => count.user_id === newMsgCount.user_id
                        );

                        if (index !== undefined && index > -1) {
                          return previousCount?.map((count, i) =>
                            i === index ? newMsgCount : count
                          );
                        } else {
                          return [...(previousCount || []), newMsgCount];
                        }
                      }
                    );

                    onSendMessage(sent_message);
                    handleViewMessage(newMsg);

                    setmessages((prevMessages) => {
                      const updatedMessages = [...prevMessages, sent_message];
                      return updatedMessages;
                    });
                    setLocalMessageCount(localMessageCount + 1);
                  })
                  .catch((error) => {
                    console.error("Error decrypting message:", error);
                  });
              }
              setTimeout(() => {
                if (messageRef.current) {
                  messageRef.current.scrollIntoView({
                    behavior: "smooth",
                    block: "end",
                    inline: "nearest",
                  });
                }
              }, 100);

              setTimeout(() => {
                setIsSlowScroll(false);
              }, 500);

              setnewMessage({ message: "" });
            });
        } catch (error) {
          console.error(error);
        }
      }
    }
  };

  const handleLoadMessageCount = () => {
    onLoadedMessageCount(numberOfFilteredMessages, viewmsg, isLoadMore);
  };

  const handleInboxTabClick = () => {
    setisfirstmessageref(true);
    setisViewMsgChange(false);
    setviewmsg(undefined);
    settabvalue(true);
    setRecommendations(false);
    setisSearchMessageUpd(false);
    setLocalMessageCount(0);
    setnewMessage({ message: "" });
  };

  return (
    <div className="h-screen flex flex-col ">
      <div className=" bg-white shadow-xl ">
        <div className="items-start justify-between">
          <div>
            <div className="flex h-screen w-full flex-col bg-zinc-800 shadow-xl">
              <div className="bg-zinc-900 p-7 ">
                <div>
                  <div className="text-lg font-semibold leading-6 text-gray-300">
                    Messaging
                  </div>
                </div>
              </div>

              <div className="px-4  bg-zinc-900 ">
                <div className="flex-1 text-sm  font-semibold leading-6 text-gray-900 ">
                  <div className="relative flex mb-4 flex-1">
                    <MagnifyingGlassIcon
                      className="ml-2 pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-zinc-400"
                      aria-hidden="true"
                    />
                    <input
                      id="text"
                      className="block h-full w-full border-0 rounded-lg py-2 pl-8 pr-0 text-zinc-100 bg-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-transparent sm:text-sm"
                      placeholder="Send Message"
                      onFocus={() => {
                        setRecommendations(true), settabvalue(true);
                      }}
                      type="text"
                      name="start-message"
                      onChange={handleRecommendationschange}
                    />
                  </div>
                </div>
              </div>
              <div className="border-b bg-zinc-900 border-black">
                <div className="px-6 ">
                  <nav className="-mb-px flex space-x-6">
                    {tabs.map((tab) => (
                      <button
                        key={tab.name}
                        onClick={() => {
                          handleInboxTabClick();
                        }}
                        className={classNames(
                          tab.current
                            ? "text-indigo-600"
                            : "border-transparent hover:bg-zinc-200/50 text-gray-500 hover:background-gray-300 hover:text-gray-700",
                          "whitespace-nowrap px-1  rounded mb-1 text-sm font-medium h-12 w-14"
                        )}
                      >
                        {tab.name}
                      </button>
                    ))}
                    <button
                      className={classNames(
                        !tabvalue ? "text-indigo-600" : "hidden",
                        "whitespace-nowrap px-8 mt-1 border-gray-500  mb-1 text-sm font-medium h-10 w-10 border-l"
                      )}
                    >
                      @{viewmsg?.handle || viewmsg?.profile?.username}
                    </button>
                  </nav>
                </div>
              </div>
              <ul
                role="list"
                className="flex-1 divide-y bg-zinc-800 divide-black overflow-y-auto"
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
                                handleViewMsgInitialMessageCase(
                                  reciever_profile
                                ),
                                  settabvalue(false),
                                  onMessageSelect(
                                    reciever_profile,
                                    false,
                                    numberOfFilteredMessages
                                  );
                              }}
                            >
                              <div
                                className="absolute inset-0 group-hover:bg-zinc-700"
                                aria-hidden="true"
                              />
                              <div className="relative flex min-w-0 flex-1 items-center">
                                <span className="relative inline-block flex-shrink-0">
                                  <img
                                    className="h-10 w-10 rounded-full"
                                    src={`${mediaURL}${
                                      reciever_profile?.profile
                                        ?.profile_picture || ""
                                    }`}
                                    onError={(e) =>
                                      (e.currentTarget.src =
                                        "/profile_pic_def/gooseCom.png")
                                    }
                                    alt=""
                                  />
                                  <span
                                    className={classNames(
                                      "online" === "online"
                                        ? "bg-green-400"
                                        : "bg-zinc-300",
                                      "absolute top-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white"
                                    )}
                                    aria-hidden="true"
                                  />
                                </span>
                                <div className="ml-4 truncate">
                                  <p className="truncate text-sm font-medium text-white">
                                    {reciever_profile?.profile?.full_name || ""}
                                  </p>
                                  <p className="truncate text-left text-sm text-gray-400/80">
                                    {"@" + reciever_profile?.profile?.username}
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
                                        <button
                                          onClick={() =>
                                            router.push(
                                              `/profile?search=${reciever_profile.profile.username}#`
                                            )
                                          }
                                          className={classNames(
                                            active
                                              ? "bg-zinc-100 text-gray-900"
                                              : "text-gray-700",
                                            "text-start px-4 py-2 w-full text-sm"
                                          )}
                                        >
                                          View profile
                                        </button>
                                      )}
                                    </Menu.Item>
                                    <Menu.Item>
                                      {({ active }) => (
                                        <a
                                          className={classNames(
                                            active
                                              ? "bg-zinc-100 text-gray-900"
                                              : "text-gray-700",
                                            "block px-4 py-2 text-sm"
                                          )}
                                        >
                                          Delete messages
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
                  ) : !isLoading ? (
                    allConversations?.map((reciever_profile: any) => (
                      <li key={reciever_profile.handle}>
                        <div className="group relative flex items-center px-5 py-6">
                          <button
                            className="-m-1 block flex-1 p-1"
                            onClick={() => {
                              handleViewMessage(reciever_profile),
                                settabvalue(false),
                                onMessageSelect(
                                  reciever_profile,
                                  false,
                                  numberOfFilteredMessages
                                );
                            }}
                          >
                            <div
                              className="absolute inset-0 group-hover:bg-zinc-700"
                              aria-hidden="true"
                            />
                            <div className="relative flex min-w-0 flex-1 items-center">
                              <span className="relative inline-block flex-shrink-0">
                                <img
                                  className="h-10 w-10 rounded-full"
                                  src={
                                    `${reciever_profile.imageUrl}` ||
                                    profile_pic_url
                                  }
                                  onError={(e) =>
                                    (e.currentTarget.src =
                                      "/profile_pic_def/gooseCom.png")
                                  }
                                  alt=""
                                />
                                <span
                                  className={classNames(
                                    reciever_profile.status === "online"
                                      ? "bg-green-400"
                                      : "bg-zinc-300",
                                    "absolute top-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white"
                                  )}
                                  aria-hidden="true"
                                />
                              </span>
                              <div className="ml-4 truncate">
                                <p className="truncate text-sm font-medium text-white">
                                  {reciever_profile.name}
                                </p>
                                <p className="truncate text-left text-sm text-gray-400/80">
                                  {"@" + reciever_profile.handle}
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
                                      <button
                                        onClick={() =>
                                          router.push(
                                            `/profile?search=${reciever_profile.handle}#`
                                          )
                                        }
                                        className={classNames(
                                          active
                                            ? "bg-zinc-100 text-gray-900"
                                            : "text-gray-700",
                                          "text-start px-4 py-2 w-full text-sm"
                                        )}
                                      >
                                        View profile
                                      </button>
                                    )}
                                  </Menu.Item>
                                  <Menu.Item>
                                    {({ active }) => (
                                      <a
                                        className={classNames(
                                          active
                                            ? "bg-zinc-100 text-gray-900"
                                            : "text-gray-700",
                                          "block px-4 py-2 text-sm"
                                        )}
                                      >
                                        Delete messages
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
                  ) : (
                    <div>
                      <Spinner className="flex mt-80" />
                    </div>
                  )
                ) : (
                  <div className="pr-8 flex flex-col">
                    <button
                      className="sticky top-2 flex z-20 items-start  ml-4 bg-zinc-400/50 backdrop-blur-md py-2 rounded w-full hover:bg-zinc-300"
                      onClick={() => {
                        if (viewmsg?.handle) {
                          if (
                            viewmsg?.handle ===
                            searchedprofile?.profile.username
                          ) {
                            updateIsMessaging();
                          } else {
                            LoadsearchedUser(viewmsg.handle);
                          }
                        } else if (viewmsg?.profile.username) {
                          if (
                            viewmsg?.profile.username ===
                            searchedprofile?.profile.username
                          ) {
                            updateIsMessaging();
                          } else {
                            LoadsearchedUser(viewmsg.profile.username);
                          }
                        }
                      }}
                    >
                      <div className="px-2 flex items-center">
                        <div>
                          <img
                            className="inline-block h-9 w-9 rounded-full"
                            src={viewmsg?.imageUrl || `${profile_pic_url}`}
                            onError={(e) =>
                              (e.currentTarget.src =
                                "/profile_pic_def/gooseCom.png")
                            }
                            alt=""
                          />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-black group-hover:text-gray-900">
                            {viewmsg?.name || viewmsg?.profile?.full_name}
                          </p>
                          <p className="text-xs text-left font-medium text-gray-800 group-hover:text-gray-700">
                            @{viewmsg?.handle || viewmsg?.profile?.username}
                          </p>
                        </div>
                      </div>
                    </button>
                    <div>
                      <div
                        className={` ${
                          !isLoadMore
                            ? ""
                            : "flex justify-center items-center py-6"
                        }`}
                      >
                        <button
                          type="button"
                          className={` ${
                            !isLoadMore
                              ? "hidden"
                              : "rounded-full bg-white/10 px-3 py-2 w-36 text-sm font-semibold text-white shadow-sm hover:bg-white/20"
                          }`}
                          onClick={() => {
                            handleLoadMessageCount();
                          }}
                        >
                          Load more...
                        </button>
                      </div>
                      <div ref={messageRef} className="flex flex-col">
                        <div className="flex-1  mb-36 xl:mb-36 overflow-y-auto ">
                          {filteredMessages.map(
                            (message: any, index: number) => (
                              <li
                                key={message.id}
                                ref={
                                  index ===
                                  filteredMessages.length -
                                    (filteredMessages?.length -
                                      (numberOfLoadedMessages + 4))
                                    ? newMessagesRef
                                    : null
                                }
                              >
                                <div
                                  className={`group relative flex flex-col break-words ${
                                    viewmsg?.handle !==
                                    message.sender_profile?.username
                                      ? "items-end xl:ml-24 lg:ml-80 ml-24"
                                      : "items-start xl:mr-24 lg:mr-80 "
                                  }`}
                                >
                                  <div className="flex-1 mt-2 text-gray-500 py-2 ml-4 text-sm">
                                    {new Date(
                                      message?.date
                                    ).toLocaleDateString() +
                                      " " +
                                      new Date(
                                        message?.date
                                      ).toLocaleTimeString([], {
                                        hour: "numeric",
                                        minute: "numeric",
                                      })}
                                    <br />
                                  </div>

                                  <div
                                    className={`ml-4 px-4 text-white py-2 rounded-xl max-w-md ${
                                      viewmsg?.handle !==
                                      message.sender_profile?.username
                                        ? "bg-indigo-600"
                                        : "bg-zinc-500/90"
                                    }`}
                                  >
                                    {message.decrypted_message}
                                  </div>
                                </div>
                              </li>
                            )
                          )}
                        </div>
                        <div className="absolute left-4 right-6 bottom-2 bg-zinc-900/70 border-2 rounded-lg border-zinc-900 backdrop-blur-md py-4">
                          <div className="flex mr-8 items-start space-x-4">
                            <div className="flex-shrink-0">
                              <img
                                className="ml-2 inline-block h-12 w-12 rounded-full"
                                src={`${mediaURL}${myProfile?.profile_picture}`}
                                onError={(e) =>
                                  (e.currentTarget.src =
                                    "/profile_pic_def/gooseCom.png")
                                }
                                alt=""
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div>
                                <div className="border-b border-gray-200">
                                  <label htmlFor="message" className="sr-only">
                                    Add your message
                                  </label>
                                  <input
                                    type="text"
                                    name="message"
                                    id="text-input"
                                    className="px-2 py-1 bg-transparent block w-full focus:outline-none resize-none border-0 border-b border-transparent p-0 pb-2 text-white placeholder:text-gray-400 sm:text-sm sm:leading-6"
                                    placeholder="Add your message..."
                                    value={newMessage.message}
                                    onChange={handleChange}
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter") {
                                        event.preventDefault();
                                        SendMessage();
                                      }
                                    }}
                                  />
                                </div>
                                <div className="flex justify-between pt-2">
                                  <div className="flex items-center space-x-5">
                                    <div className="flow-root"></div>
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
  );
};

export default Messaging;
