import {Card, Skeleton} from "@nextui-org/react";

interface ListTabsProps {
    activeTab: string
    onTabSelect: (tabName: string) => void // define the type of onTabSelect
    isLoading: boolean
  }
  type Tab = {
    name: string
  }
  
  type Tabs = Tab[]
  
  const tabs: Tabs = [{ name: 'Pinned' }, { name: 'Trending' }]
  
  export default function ListTabs({ activeTab, onTabSelect,isLoading }: ListTabsProps) {
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
          <div className="bg-zinc-900 border-2 border-t-2 border-zinc-400 rounded-lg ml-2 mr-2 ">
          <div className="mx-auto max-w-7xl">
          <div>
            <div className="flex py-4">
              <ul
                role="list"
                className="flex min-w-full flex-none gap-x-8 px-8 text-sm font-semibold leading-6 text-gray-400"
              >
                {tabs.map((tab) => (
                  <li key={tab.name}>
                    <button
                      className={activeTab === tab.name ? 'text-indigo-600 ' : ' hover:text-zinc-300'}
                      onClick={() => onTabSelect(tab.name)}
                    >
                      {tab.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        </div>)}
        </div>
      
    )
  }