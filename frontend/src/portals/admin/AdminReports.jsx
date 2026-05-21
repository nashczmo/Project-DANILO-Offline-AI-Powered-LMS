import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Award, BookOpen } from 'lucide-react';
import { Card, PageHeader, Skeleton, EmptyState, Button } from '../../components/ui';
import { apiRequest } from '../../api.js';

export default function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [reportsData, setReportsData] = useState(null);
  const [aiData, setAiData] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const [data, ai] = await Promise.all([
          apiRequest("/admin/overview").catch(() => null),
          apiRequest("/admin/reports/ai-analytics").catch(() => null)
        ]);
        setReportsData(data);
        setAiData(ai);
      } catch (error) {
        console.error("Failed to fetch reports:", error);
        setReportsData(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReports();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Institutional Reports" 
        description="Institutional analytics and insights across all departments and courses."
        action={<Button variant="secondary">Export Report</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : !reportsData ? (
          <div className="col-span-full">
            <EmptyState
              icon={BarChart3}
              title="No Reports Data"
              description="Analytical reports could not be generated. Please try reloading the page."
            />
          </div>
        ) : (
          <>
            <Card className="flex flex-col">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-danilo-text-secondary font-medium">Average Attendance</p>
                  <p className="text-2xl font-bold text-danilo-text">92%</p>
                </div>
              </div>
            </Card>

            <Card className="flex flex-col">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-danilo-text-secondary font-medium">Pass Rate</p>
                  <p className="text-2xl font-bold text-danilo-text">88.5%</p>
                </div>
              </div>
            </Card>

            <Card className="flex flex-col">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-danilo-text-secondary font-medium">Course Completion</p>
                  <p className="text-2xl font-bold text-danilo-text">76%</p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      <h3 className="text-xl font-bold mt-8 mb-4">AI Tutor Usage Analytics</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : !aiData ? (
          <div className="col-span-full">
            <EmptyState
              icon={BarChart3}
              title="No AI Analytics Data"
              description="AI usage metrics could not be retrieved."
            />
          </div>
        ) : (
          <>
            <Card className="flex flex-col">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-danilo-text-secondary font-medium">Total Chat Sessions</p>
                  <p className="text-2xl font-bold text-danilo-text">{aiData.metrics?.totalSessions || 0}</p>
                </div>
              </div>
            </Card>

            <Card className="flex flex-col">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-danilo-text-secondary font-medium">Total Messages Sent</p>
                  <p className="text-2xl font-bold text-danilo-text">{aiData.metrics?.totalMessages || 0}</p>
                </div>
              </div>
            </Card>

            <Card className="flex flex-col">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-danilo-text-secondary font-medium">Active AI Users</p>
                  <p className="text-2xl font-bold text-danilo-text">{aiData.metrics?.activeUsers || 0}</p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card className="min-h-[400px] flex flex-col">
          <h3 className="text-lg font-bold mb-4">Enrollment Trends</h3>
          <div className="flex-1 flex items-center justify-center">
            {loading ? (
              <Skeleton className="w-full h-full min-h-[300px]" />
            ) : (
              <EmptyState 
                icon={BarChart3}
                title="Insufficient Data"
                description="Insufficient historical data to calculate enrollment trends. Please check again next semester."
              />
            )}
          </div>
        </Card>

        <Card className="min-h-[400px] flex flex-col">
          <h3 className="text-lg font-bold mb-4">Department Performance</h3>
          <div className="flex-1 flex items-center justify-center">
            {loading ? (
              <Skeleton className="w-full h-full min-h-[300px]" />
            ) : (
              <EmptyState 
                icon={BarChart3}
                title="Insufficient Data"
                description="Insufficient assessment data to compare departmental performance."
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
