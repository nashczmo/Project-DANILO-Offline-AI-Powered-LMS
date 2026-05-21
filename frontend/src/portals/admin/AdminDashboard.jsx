import { useState, useEffect } from 'react';
import { Activity, Users, BookOpen, Clock } from 'lucide-react';
import { Card, PageHeader, Skeleton, EmptyState } from '../../components/ui';
import { apiRequest } from '../../api.js';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchOverview = async () => {
      setLoading(true);
      try {
        const data = await apiRequest("/admin/overview");
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch overview:", error);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Overview" 
        description="System operations and high-level metrics." 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : !stats ? (
          <div className="col-span-full">
            <EmptyState 
              icon={Activity}
              title="No Overview Data"
              description="Could not load system overview data."
            />
          </div>
        ) : (
          <>
            <Card className="flex flex-col">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-danilo-text-secondary font-medium">Total Users</p>
                  <p className="text-2xl font-bold text-danilo-text">{stats.totalUsers}</p>
                </div>
              </div>
            </Card>

            <Card className="flex flex-col">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-danilo-text-secondary font-medium">Active Courses</p>
                  <p className="text-2xl font-bold text-danilo-text">{stats.activeCourses}</p>
                </div>
              </div>
            </Card>

            <Card className="flex flex-col">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-danilo-text-secondary font-medium">System Health</p>
                  <p className="text-2xl font-bold text-danilo-text">{stats.systemHealth}</p>
                </div>
              </div>
            </Card>

            <Card className="flex flex-col">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-danilo-text-secondary font-medium">Uptime</p>
                  <p className="text-2xl font-bold text-danilo-text">{stats.uptime}</p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : (
             <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between p-3 border border-danilo-border rounded-xl">
                  <div>
                    <p className="text-sm font-medium">System backup completed</p>
                    <p className="text-xs text-danilo-text-secondary">2 hours ago</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        
        <Card>
          <h3 className="text-lg font-bold mb-4">Storage Usage</h3>
          {loading ? (
            <Skeleton className="h-48" />
          ) : (
            <div className="flex items-center justify-center h-48 border border-dashed border-danilo-border rounded-xl bg-danilo-bg-secondary">
              <p className="text-danilo-text-secondary">Storage graph placeholder</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
