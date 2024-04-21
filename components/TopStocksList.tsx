import React, { useState, useEffect } from "react";

const TopStocksList: React.FC<{ imported_rankedList: string[] }> = ({
  imported_rankedList,
}) => {
  const [ranked_list, setranked_list] = useState<string[]>([]);

  useEffect(() => {
    const fetchedLeaderBoard = () => {
      setranked_list(imported_rankedList);
    };
    fetchedLeaderBoard();
  }, [imported_rankedList]);

  return (
    <ul role="list">
      {ranked_list.map((stock, stockindex) => (
        <li
          key={stockindex}
          className={`flex items-center border-b-2 border-zinc-700/70 justify-between gap-x-6 py-5 ${
            stockindex % 2 === 0 ? "bg-zinc-800" : "bg-zinc-900 "
          }`}
        >
          <div className="flex w-full justify-between ml-3">
            <div className="flex items-start gap-x-3">
              <p className="ml-5 mr-10 font-bold text-white">
                {stockindex + 1}.
              </p>
              <p className="font-bold w-80 text-white">{stock[0]}</p>
            </div>
            <div className="text-right text-white font-bold mr-4">
              <span>{stock[1]}</span>
              <span
                className={`inline-block font-bold text-xl ml-3 ${
                  stock[2] === "positive"
                    ? "rotate-180 text-green-600 ml-1"
                    : stock[2] === "neutral"
                    ? "hidden"
                    : " text-red-600 ml-1"
                }`}
              >
                ▼
              </span>
              <span
                className={`${
                  stock[2] === "neutral" ? "font-bold text-sm ml-3 " : "hidden"
                }`}
              >
                &mdash;
              </span>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
            <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current"></svg>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default TopStocksList;
