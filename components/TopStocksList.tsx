import React, { useState, useEffect } from 'react'
import { leaderBoardURL } from './backendURL'
import useAxios from '../utils/useAxios'


const TopStocksList: React.FC = () => {
  const [ranked_list, setranked_list] = useState<string[]>([])
  const gooseApp = useAxios()

  useEffect(() => {
    const fetchedLeaderBoard = async () => {
      try {
        const response = await gooseApp.get(leaderBoardURL)
        const data = response.data
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
      {ranked_list.map((stock, stockindex) => (
        <li
        key={stockindex}
        className={`flex items-center border-b-2 border-zinc-700/70 justify-between gap-x-6 py-5 ${
          stockindex % 2 === 0 ? 'bg-zinc-800' : 'bg-zinc-900 '
        }`}
      >
          <div className="flex w-full justify-between ml-3">
            <div className="flex items-start gap-x-3">
              <p className="ml-5 mr-10 font-bold text-white">
                {stockindex + 1}.
              </p>
              <p className="font-bold text-white">{stock[0]}</p>
            </div>
            <div className="text-right font-bold mr-4">
          <span>{stock[1]}</span>
          <span 
          className={`inline-block text-xl ${stock[2] === 'positive' ? '-rotate-90 text-green-600 ml-1' : stock[2] === 'neutral' ? 'hidden' : 'rotate-90 text-red-600 ml-1'}`}>
            &#10145;
            </span>
            <span className={`${stock[2] === 'neutral' ? 'font-bold text-sm ml-3 ': 'hidden'}`}>&mdash;</span>
        </div>
        </div>
            <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
              <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current"></svg>
          </div>
        </li>
      ))}
    </ul>
    
  )
}

export default TopStocksList