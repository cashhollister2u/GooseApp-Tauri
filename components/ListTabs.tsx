interface ListTabsProps {
    activeTab: string
    onTabSelect: (tabName: string) => void // define the type of onTabSelect
  }
  type Tab = {
    name: string
  }
  
  type Tabs = Tab[]
  
  const tabs: Tabs = [{ name: 'Pinned' }, { name: 'Trending' }]
  
  export default function ListTabs({ activeTab, onTabSelect }: ListTabsProps) {
    return (
      <div className="bg-zinc-900 border-b-2 border-t-2 border-zinc-950  ">
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
                      className={activeTab === tab.name ? 'text-indigo-600' : ''}
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
      </div>
    )
  }