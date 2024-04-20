import React, { useState, useEffect } from "react";
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
  isLoading: boolean;
}

const S_Header: React.FC<S_HeaderProps> = ({
  searchedprofile,
  UserProfile,
  isLoading,
}) => {
  const [full_name, setfull_name] = useState<string>();
  const [background_image, setbackground_image] = useState<string>();
  const [profile_picture, setprofile_picture] = useState<string>();
  const [username, setusername] = useState<string>();
  const [bio, setbio] = useState<string>();

  useEffect(() => {
    const handleSearchChange = () => {
      try {
        const fetchedUserProfile = searchedprofile;
        if (fetchedUserProfile) {
          if (fetchedUserProfile.profile.full_name.length >=30) {
            const abv_fullname = fetchedUserProfile.profile.full_name.slice(0,29) + "..."
            setfull_name(abv_fullname)
          } else {
            setfull_name(fetchedUserProfile.profile.full_name);
          }
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
    
    handleSearchChange();
  }, [searchedprofile, UserProfile]);

  

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
        <div className="flex rounded-lg w-max-full mt-2 mr-2 ml-2 h-44 bg-zinc-800">
          
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
            <div className="w-full border-l-2 py-2 border-zinc-600 p-5 font-bold text-xl flex flex-col gap-3 ml-8">
              <div className="h-6 w-72 text-xl text-white rounded-lg">
                {full_name}
              </div>
              <div className="h-10 w-48 text-md py-1 border-2 text-white border-zinc-600 w-full px-2 rounded-lg">
                @{username}
              </div>
              <div className="h-16 w-48 border-2 border-zinc-600 text-white w-full px-2 py-1 text-xs rounded-lg">
                {bio}
              </div>
            </div>
          </div>
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
