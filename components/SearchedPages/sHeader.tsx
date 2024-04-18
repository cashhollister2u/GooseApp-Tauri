import React, { useState, useEffect } from "react";
import useAxios from "../../utils/useAxios";
import { fetchUserURL } from "../backendURL";
import { EnvelopeIcon } from "@heroicons/react/20/solid";
import { Card, Skeleton } from "@nextui-org/react";

const swal = require("sweetalert2");

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

interface FollowListCountType {
  updateFollowList: (newList: string[]) => void;
  followListUpd: string[];
}

export interface S_HeaderProps extends FollowListCountType {
  searchedprofile: Profile | null;
  UserProfile: UserProfile;
  onclick: () => void;
  isLoading: boolean;
}

const S_Header: React.FC<S_HeaderProps> = ({
  searchedprofile,
  updateFollowList,
  UserProfile,
  onclick,
  isLoading,
}) => {
  const [isFollowing, setFollowing] = useState<boolean>(false);
  const [followList, setFollowList] = useState<string[]>([]);
  const [MYusername, setMYusername] = useState<string>();
  const [full_name, setfull_name] = useState<string>();
  const [background_image, setbackground_image] = useState<string>();
  const [profile_picture, setprofile_picture] = useState<string>();
  const [username, setusername] = useState<string>();
  const [bio, setbio] = useState<string>();
  const gooseApp = useAxios();
  const params = new URLSearchParams(window.location.search);
  const search = params.get("search") as string;

  useEffect(() => {
    const handleSearchChange = () => {
      try {
        const fetchedUserProfile = searchedprofile;
        if (fetchedUserProfile) {
          setfull_name(fetchedUserProfile.profile.full_name);
          setusername(fetchedUserProfile.profile.username);
          setbio(fetchedUserProfile.profile.bio);

          if (fetchedUserProfile.profile.background_image === null) {
            setbackground_image(`/profile_pic_def/gooseCom_slim.png`);
          } else {
            setbackground_image(
              `${fetchedUserProfile.profile.background_image}`
            );
          }
          if (fetchedUserProfile.profile.profile_picture === null) {
            setprofile_picture(`/profile_pic_def/gooseCom.png`);
          } else {
            setprofile_picture(`${fetchedUserProfile.profile.profile_picture}`);
          }
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

  return (
    <div>
      <div>
        {!isLoading ? (
          <img
            className="h-[40vh] w-full object-fill"
            src={`${background_image}`}
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
          <div className="flex rounded-lg w-max-full mt-2 mr-2 ml-2 h-44 bg-zinc-800" >
          <div className="w-full flex items-center">
             <div>
              {profile_picture && (
                <img
                  className="ml-4 mr-32 h-36 w-36 rounded-full ring-4 ring-zinc-200"
                  src={`${profile_picture}`}
                  alt="profile"
                />
              )}
            </div>  
                  <div className="w-full border-l-2 border-zinc-600 p-5 font-bold text-xl flex flex-col gap-3 ml-8">
                  <div className="h-6 w-48 text-xl  rounded-lg">{full_name}</div>
                  <div className="h-6 w-48 text-md border-2 border-zinc-600 w-full px-2 h-8 rounded-lg">@{username}</div>
                  <div className="h-12 w-48 border-2 border-zinc-600 w-full px-2 py-1 text-sm rounded-lg">{bio}</div>
              </div>
              </div>
              <div
              className={`h-8 mt-3 mr-3${
                MYusername !== username ? '' : 'hidden'
              }`}
            >
              <span className="isolate inline-flex rounded-md shadow-xl">
                <button
                  type="button"
                  className={`w-20 relative inline-flex border-r-3 border-zinc-400 justify-center items-center gap-x-1.5 rounded-l-md bg-zinc-300 px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10 ${
                    !isFollowing ? '' : 'hidden'
                  }`}
                  onClick={() => FollowUser(searchedprofile?.id)}
                >
                  Follow
                  </button>
                      <button
                        type="button"
                        className={`w-20 relative inline-flex items-center gap-x-1.5 rounded-l-md bg-zinc-600 px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-zinc-500 hover:ring-zinc-300 hover:bg-zinc-300 hover:border-r-3 hover:border-zinc-400 focus:z-10 ${
                          isFollowing ? '' : 'hidden'}`}
                        onClick={() => unFollowUser(searchedprofile?.id)}
                      >
                        Unfollow
                      </button>
                    <button
                      type="button"
                      className="relative -ml-px inline-flex items-center rounded-r-md bg-zinc-300 px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10"
                      onClick={() => {
                        onclick()
                      }}
                    >
                   <EnvelopeIcon
                    className="h-5 w-5 ml-1 text-black"
                    aria-hidden="true"
                  />
                </button>
              </span>
            </div>
          </div>
          <div
            className={`h-8 mt-3 mr-3${
              MYusername !== username ? "" : "hidden"
            }`}
          ></div>
        </div>
      ) : (
        <Card
          className="flex justify-center w-max-full mt-2 mr-2 ml-2 h-44 bg-zinc-800"
          radius="lg"
        >
          <div className="max-w-[300px] w-full flex items-center gap-3">
            <div>
              <Skeleton className="flex items-center inline-block rounded-full left-3 ring-4 ring-zinc-600 bg-zinc-400 h-36 w-36 sm:h-40 sm:w-40 lg:h-36 lg:w-36"></Skeleton>
            </div>
            <div className="w-full flex flex-col gap-3 ml-8">
              <Skeleton className="h-6 w-48 rounded-lg" />
              <Skeleton className="h-6 w-48 rounded-lg" />
              <Skeleton className="h-12 w-48 rounded-lg" />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default S_Header;
