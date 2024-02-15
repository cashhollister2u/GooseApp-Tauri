import React, { useState, useEffect } from 'react'


const swal = require('sweetalert2')

interface UserProfile {
  values5: string[]
}

const PinnedStocksList: React.FC<{ UserProfile?: UserProfile }> = ({
  UserProfile,
}) => {
  const [values5, setvalues5] = useState<string[]>([])
  

  useEffect(() => {
    const fetchUserData = () => {
      if (UserProfile) {
        setvalues5(UserProfile.values5)
        
      }
    }

    fetchUserData()
  }, [UserProfile])

  return (
    <ul role="list" className="divide-y-2 divide-zinc-900 bg-zinc-800">
      {values5.map(
        (project, projectindex) =>
          project !== '' && (
            <li
              key={projectindex}
              className="flex items-center ml-4 mr-4 justify-between gap-x-6 py-5"
            >
              <div className="min-w-0 ml-3">
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
      )}
    </ul>
  )
}

export default PinnedStocksList