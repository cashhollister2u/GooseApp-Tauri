import {Card, Skeleton} from "@nextui-org/react";
import React, { useState, useEffect } from "react";
import useAxios from "../utils/useAxios";
import { fetchUserURL } from "./backendURL";
import { EnvelopeIcon } from "@heroicons/react/20/solid";

const swal = require("sweetalert2");

interface FollowListCountType {
  updateFollowList: (newList: string[]) => void;
  followListUpd: string[];
}

interface UserProfile {
  full_name: string;
  background_image: string;
  profile_picture: string;
  bio: string;
  username: string;
  values5: string[];
  follow_list: string[];
  following: any;
}

interface Profile {
  profile: UserProfile;
  username: string;
  id: number;
}

interface ListTabsProps extends FollowListCountType {
    activeTab: string
    onTabSelect: (tabName: string) => void // define the type of onTabSelect
    isLoading: boolean
    searchedprofile: Profile | null;
    UserProfile: UserProfile;
    onclick: () => void;
    isSearchActive:boolean
  }
  type Tab = {
    name: string
  }
  
  type Tabs = Tab[]
  
  const tabs: Tabs = [{ name: 'Pinned' }, { name: 'Trending' }]
  
  export default function ListTabs({ 
    isSearchActive,
    activeTab, 
    onTabSelect,
    isLoading,
    searchedprofile,
    updateFollowList,
    UserProfile,
    onclick,
   }: ListTabsProps) {
    const [isFollowing, setFollowing] = useState<boolean>(false);
    const [followList, setFollowList] = useState<string[]>([]);
    const [MYusername, setMYusername] = useState<string>();
    const [username, setusername] = useState<string>();
    const gooseApp = useAxios();
    const params = new URLSearchParams(window.location.search);
    const search = params.get("search") as string;

    useEffect(() => {
      const handleSearchChange = () => {
        try {
          const fetchedUserProfile = searchedprofile;

          if (fetchedUserProfile) {
            setusername(fetchedUserProfile.profile.username);
          }

        } catch (error) {
          swal.fire({
            title: "Error fetching searched profile",
            icon: "error",
            toast: true,
            timer: 6000,
            position: "top-right",
            timerProgressBar: true,
            showConfirmButton: false,
          });
        }
      };
      const fetchUserData = () => {
        if (UserProfile) {
          setMYusername(UserProfile.username);
          UserProfile.following.forEach((follow: any) => {
            if (!followList.includes(follow.profile.username)) {
              followList.push(follow.profile.username);
            }
          });
        }
      };
      const followingStatus = () => {
        if (UserProfile) {
          const istheUserFollowing: boolean = UserProfile.following.some(
            (follow: any) => {
              return follow.profile.username === search;
            }
          );
          setFollowing(istheUserFollowing);
        }
      };
  
      followingStatus();
  
      fetchUserData();
      handleSearchChange();
    }, [searchedprofile, UserProfile]);

    const FollowUser = async (targetUserId: any) => {
      const showErrorAlert = (message: any) => {
        swal.fire({
          title: message,
          icon: "error",
          toast: true,
          timer: 6000,
          position: "top-right",
          timerProgressBar: true,
          showConfirmButton: false,
        });
      };
  
      try {
        if (username === MYusername) {
          showErrorAlert("You can't follow yourself");
          return;
        }
  
        if (username && !followList.includes(username)) {
          const updatedList = followList.concat(username);
          setFollowList(updatedList);
          updateFollowList(updatedList);
        }
  
        const formData = new FormData();
        formData.append("action", "follow");
        formData.append("target_user_id", targetUserId);
  
        const response = await gooseApp.post(fetchUserURL, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
  
        if (response.status === 200) {
          setFollowing(true);
        } else {
          showErrorAlert("Error following user");
        }
      } catch (error) {
        showErrorAlert("Error following user");
      }
    };
  
    const unFollowUser = async (targetUserId: any) => {
    const showAlert = (title: string, icon: string) => {
      swal.fire({
        title: title,
        icon: icon,
        toast: true,
        timer: 6000,
        position: "top-right",
        timerProgressBar: true,
        showConfirmButton: false,
      });
    };

    try {
      const updatedList = followList.filter((user: any) => user != username);
      updateFollowList(updatedList);
      setFollowList(updatedList);
      const formData = new FormData();
      formData.append("action", "unfollow");
      formData.append("target_user_id", targetUserId);

      const response = await gooseApp.post(fetchUserURL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setFollowing(false);
      // Handle successful unfollow here, e.g., update UI or notify the user
    } catch (error) {
      showAlert("Error unfollowing user", "error");
    }
  };
  console.log(username, MYusername)
    return (
      <div>
        {isLoading ? (
          <Card className="flex  mr-2 ml-2 bg-zinc-800" radius="lg">
          <div className=" w-full flex items-center">
             <div> 
                </div>  
                  <Skeleton className="py-6 w-full bg-zinc-400 rounded-lg"/>
              </div>
          </Card>
        ) : ( 
          <div className="bg-zinc-900 h-14 border-2 border-t-2 border-zinc-400 rounded-lg ml-2 mr-2 ">
          <div className="mx-auto max-w-7xl">
          <div>
            <div className="flex py-2">
              <ul
                role="list"
                className="flex min-w-full flex-none gap-x-8 px-8 text-sm font-semibold leading-6 text-gray-400"
              >
                {tabs.map((tab) => (
                  <li key={tab.name} className="mt-1">
                    <button
                      className={activeTab === tab.name ? 'text-indigo-600 ' : ' hover:text-zinc-300'}
                      onClick={() => onTabSelect(tab.name)}
                    >
                      {tab.name}
                    </button>
                  </li>
                ))}
                
                <span className={`flex justify-end w-full inline-flex rounded-md shadow-xl ${
                    isSearchActive ? "" : "hidden"
                    }`}>
                      <button
                        type="button"
                        className={`w-20 relative inline-flex border-r-3 border-zinc-400 justify-center items-center gap-x-1.5 rounded-l-md bg-zinc-300 px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10 ${
                          !isFollowing ? "" : "hidden"
                        }`}
                        onClick={() => FollowUser(searchedprofile?.id)}
                      >
                        Follow
                      </button>
                      <button
                        type="button"
                        className={`w-20 relative inline-flex items-center gap-x-1.5 rounded-l-md bg-zinc-600 px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-zinc-500 hover:ring-zinc-300 hover:bg-zinc-300 hover:border-r-3 hover:border-zinc-400 focus:z-10 ${
                          isFollowing ? "" : "hidden"
                        }`}
                        onClick={() => unFollowUser(searchedprofile?.id)}
                      >
                        Unfollow
                      </button>
                      <button
                        type="button"
                        className="relative  w-10 inline-flex items-center rounded-r-md bg-zinc-300 px-2 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10"
                        onClick={() => {
                          onclick();
                        }}
                      >
                        <EnvelopeIcon
                          className="h-5 w-5 ml-1 text-black"
                          aria-hidden="true"
                        />
                      </button>
                </span>
              </ul>
            </div>
          </div>
        </div>
        </div>)}
        </div>
      
    )
  }