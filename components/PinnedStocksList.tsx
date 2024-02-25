import React, { useState, useEffect } from 'react'
import {Card, Skeleton} from "@nextui-org/react";

const swal = require('sweetalert2')

interface UserProfile {
  values5: string[]
}


const PinnedStocksList: React.FC<{ UserProfile?: UserProfile, isLoading:boolean }> = ({
  UserProfile,
  isLoading
}) => {
  const [values5, setvalues5] = useState<string[]>([])
  const loadingValues = [1,2,3,4,5]

  useEffect(() => {
    const fetchUserData = () => {
      if (UserProfile) {
        setvalues5(UserProfile.values5)
        
      }
    }

    fetchUserData()
  }, [UserProfile])

  return (
    <ul role="list">
      {isLoading ? (
        loadingValues.map( (value, valueIndex) => (
         
        <Card key={valueIndex} className="flex mt-2 mr-2 ml-2 bg-zinc-800" radius="lg">
          <div className=" w-full flex items-center">
            <div> 
                </div>  
                  <Skeleton className="py-8 w-full bg-zinc-500 rounded-lg"/>
              </div>
          </Card>
            
        ))
      ) : (
        values5.map(
          (project, projectindex) =>
            project !== '' && (
              <li
                key={projectindex}
                className={`flex items-center border-b-2 border-zinc-700/70 justify-between gap-x-6 py-5 ${
                  projectindex % 2 === 0 ? 'bg-zinc-800' : 'bg-zinc-900 '
                }`}
              >
                <div className="min-w-0 ml-3 ">
                  <div className="flex items-start gap-x-3">
                    <p className="ml-5 mr-10 font-bold text-white">
                      {projectindex + 1}
                      {'.'}
                    </p>
                    <p className=" font-bold text-white">{project}</p>
                  </div>
                  <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                    <svg
                      viewBox="0 0 2 2"
                      className="h-0.5 w-0.5 fill-current"
                    ></svg>
                  </div>
                </div>
              </li>
            )
        )
      )}
      
    </ul>
  )
}

export default PinnedStocksList