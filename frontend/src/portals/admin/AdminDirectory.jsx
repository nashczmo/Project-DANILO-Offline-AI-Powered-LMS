import { useState, useEffect } from 'react';
import { Users, Folder, Book, Building2, Search, Plus, X, Loader2 } from 'lucide-react';
import { Card, PageHeader, Skeleton, EmptyState, Button } from '../../components/ui';
import { apiRequest } from '../../api.js';

export default function AdminDirectory() {
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ users: [], classes: [], sections: [], departments: [] });

  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form States
  const [formData, setFormData] = useState({});

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

  const handleOpenModal = () => {
    setFormData({});
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const endpointMap = {
        users: '/admin/users',
        classes: '/admin/courses',
        sections: '/admin/sections',
        departments: '/admin/departments'
      };
      await apiRequest(endpointMap[activeTab], {
        method: "POST",
        body: formData
      });
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert("Failed to add entry: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        action={<Button variant="primary" onClick={handleOpenModal} className="gap-2"><Plus className="w-4 h-4"/> Add New</Button>}
      />

      <div className="dn-tabs overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`dn-tab ${activeTab === tab.id ? 'active' : ''} flex items-center gap-2`}
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
              className="dn-input pl-9"
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
              action={<Button variant="primary" onClick={handleOpenModal}>Add {activeTab.slice(0, -1)}</Button>}
            />
          )}
        </div>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="dn-heading-md capitalize">Add New {activeTab.slice(0, -1)}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:bg-gray-100 p-1 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              {activeTab === 'users' && (
                <>
                  <div className="space-y-2"><label className="dn-label">Role</label><select className="dn-input" required onChange={e => setFormData({...formData, role: e.target.value})}><option value="">Select Role</option><option value="teacher">Teacher</option><option value="student">Student</option><option value="admin">Admin</option></select></div>
                  <div className="space-y-2"><label className="dn-label">Full Name</label><input type="text" className="dn-input" required onChange={e => setFormData({...formData, full_name: e.target.value})} /></div>
                  <div className="space-y-2"><label className="dn-label">Username</label><input type="text" className="dn-input" required onChange={e => setFormData({...formData, username: e.target.value})} /></div>
                  <div className="space-y-2"><label className="dn-label">Email</label><input type="email" className="dn-input" required onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                  <div className="space-y-2"><label className="dn-label">Password</label><input type="password" className="dn-input" required onChange={e => setFormData({...formData, password: e.target.value})} /></div>
                </>
              )}

              {activeTab === 'classes' && (
                <>
                  <div className="space-y-2"><label className="dn-label">Course Code</label><input type="text" className="dn-input" placeholder="e.g. SCI-10" required onChange={e => setFormData({...formData, code: e.target.value})} /></div>
                  <div className="space-y-2"><label className="dn-label">Title</label><input type="text" className="dn-input" placeholder="e.g. Science 10" required onChange={e => setFormData({...formData, title: e.target.value})} /></div>
                  <div className="space-y-2"><label className="dn-label">Subject</label><input type="text" className="dn-input" required onChange={e => setFormData({...formData, subject: e.target.value})} /></div>
                  <div className="space-y-2"><label className="dn-label">Grade Level</label><input type="text" className="dn-input" placeholder="e.g. Grade 10" required onChange={e => setFormData({...formData, grade_level: e.target.value})} /></div>
                  <div className="space-y-2"><label className="dn-label">Quarter</label><select className="dn-input" required onChange={e => setFormData({...formData, quarter: e.target.value})}><option value="">Select Quarter</option><option value="Q1">Q1</option><option value="Q2">Q2</option><option value="Q3">Q3</option><option value="Q4">Q4</option></select></div>
                  <div className="space-y-2"><label className="dn-label">School Year</label><input type="text" className="dn-input" placeholder="e.g. 2026-2027" required onChange={e => setFormData({...formData, school_year: e.target.value})} /></div>
                  <div className="space-y-2"><label className="dn-label">Description</label><textarea className="dn-textarea" required onChange={e => setFormData({...formData, description: e.target.value})} /></div>
                </>
              )}

              {activeTab === 'sections' && (
                <>
                  <div className="space-y-2"><label className="dn-label">Section Name</label><input type="text" className="dn-input" required onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                  <div className="space-y-2"><label className="dn-label">Grade Level</label><input type="text" className="dn-input" placeholder="e.g. Grade 10" required onChange={e => setFormData({...formData, grade_level: e.target.value})} /></div>
                  <div className="space-y-2"><label className="dn-label">School Year</label><input type="text" className="dn-input" placeholder="e.g. 2026-2027" required onChange={e => setFormData({...formData, school_year: e.target.value})} /></div>
                </>
              )}

              {activeTab === 'departments' && (
                <>
                  <div className="space-y-2"><label className="dn-label">Department Name</label><input type="text" className="dn-input" required onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                  <div className="space-y-2"><label className="dn-label">Code</label><input type="text" className="dn-input" required onChange={e => setFormData({...formData, code: e.target.value})} /></div>
                  <div className="space-y-2"><label className="dn-label">Description</label><textarea className="dn-textarea" onChange={e => setFormData({...formData, description: e.target.value})} /></div>
                </>
              )}

              <div className="pt-4 border-t flex justify-end gap-3">
                <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
