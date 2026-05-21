import { useState, useEffect } from 'react';
import { Users, Folder, Book, Building2, Search } from 'lucide-react';
import { Card, PageHeader, Skeleton, EmptyState, Button } from '../../components/ui';
import { apiRequest } from '../../api.js';

export default function AdminDirectory() {
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ users: [], classes: [], sections: [], departments: [] });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const endpointMap = {
          users: '/admin/users',
          classes: '/admin/courses',
          sections: '/admin/sections',
          departments: '/admin/departments'
        };
        const endpoint = endpointMap[activeTab];
        if (endpoint) {
          const res = await apiRequest(endpoint);
          setData(prev => ({ ...prev, [activeTab]: Array.isArray(res) ? res : [] }));
        }
      } catch (error) {
        console.error(`Failed to fetch ${activeTab}:`, error);
        setData(prev => ({ ...prev, [activeTab]: [] }));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  const tabs = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'classes', label: 'Classes', icon: Book },
    { id: 'sections', label: 'Sections', icon: Folder },
    { id: 'departments', label: 'Departments', icon: Building2 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Directory" 
        description="Administrate users, academic classes, sections, and departmental records."
        action={<Button variant="primary">Add New</Button>}
      />

      <div className="flex space-x-2 border-b border-danilo-border pb-2 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id 
                ? 'bg-danilo-primary text-white' 
                : 'text-danilo-text-secondary hover:bg-danilo-bg-secondary hover:text-danilo-text'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-danilo-border flex items-center justify-between bg-danilo-bg-secondary">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-danilo-text-placeholder" />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`} 
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-danilo-border text-sm focus:outline-none focus:border-danilo-primary"
            />
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : data[activeTab].length > 0 ? (
            <div className="text-center text-sm text-danilo-text-secondary">
              {/* Table would go here */}
              Data loaded.
            </div>
          ) : (
            <EmptyState 
              icon={tabs.find(t => t.id === activeTab).icon}
              title={`No ${activeTab} found`}
              description={`There are currently no ${activeTab} registered in the system. Please add initial data to proceed.`}
              action={<Button variant="primary">Add {activeTab.slice(0, -1)}</Button>}
            />
          )}
        </div>
      </Card>
    </div>
  );
}
