import React, { useState, useEffect } from 'react'
import { leaderBoardURL } from './backendURL'


const TopStocksList: React.FC = () => {
  const [ranked_list, setranked_list] = useState<string[]>([])

  const apiUrl = leaderBoardURL
  useEffect(() => {
    const fetchedLeaderBoard = async () => {
      try {
        const response = await fetch(apiUrl)
        const data = await response.json()
        if (data.ranked_list) {
          // If the condition is met, update the state.
          setranked_list(data.ranked_list)
        } else {
          // If the condition is not met, handle it here (e.g., log a message or set an error state).
          console.log('The response does not contain a ranked_list.')
        }
      } catch (error) {
        // Handle any errors from the fetch request here (e.g., network issues, response parsing errors).
        console.error('Failed to fetch the leaderboard:', error)
      }
    }

    fetchedLeaderBoard()
  }, []) // Dependency array for useEffect

  return (
    <ul role="list">
      {ranked_list.map((project, projectindex) => (
        <li
        key={projectindex}
        className={`flex items-center border-b-2 border-zinc-700/70 justify-between gap-x-6 py-5 ${
          projectindex % 2 === 0 ? 'bg-zinc-800' : 'bg-zinc-900 '
        }`}
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
              <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current"></svg>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

export default TopStocksList