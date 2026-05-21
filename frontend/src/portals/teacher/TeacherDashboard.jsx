import { useAppStore } from "../../store/useAppStore";
import { PageHeader, Card, Skeleton, EmptyState } from "../../components/ui";
import { Users, FileText, Activity } from "lucide-react";

export default function TeacherDashboard() {
  const dashboard = useAppStore((s) => s.dashboard);
  const loading = !dashboard;

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Overview" description="Welcome back to your dashboard." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-64 w-full mt-6" />
      </div>
    );
  }

  const courses = dashboard.courses || [];
  const assignments = dashboard.assignments || [];

  if (courses.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Overview" description="Welcome back to your dashboard." />
        <EmptyState 
          icon={Activity} 
          title="No Data Available" 
          description="It looks like you haven't been assigned any sections yet." 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Overview" description="Here's what's happening in your classes today." />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-danilo-text-secondary">Active Sections</h3>
          </div>
          <p className="text-3xl font-bold text-danilo-text mt-auto">{courses.length}</p>
        </Card>
        
        <Card className="flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-danilo-text-secondary">Items to Mark</h3>
          </div>
          <p className="text-3xl font-bold text-danilo-text mt-auto">{assignments.length}</p>
        </Card>
        
        <Card className="flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-danilo-text-secondary">Avg. Attendance</h3>
          </div>
          <p className="text-3xl font-bold text-danilo-text mt-auto">{dashboard.avgAttendance || 0}%</p>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-bold text-danilo-text mb-4">Recent Activity</h3>
        {assignments.length > 0 ? (
          <div className="space-y-3">
            {assignments.slice(0, 5).map(assignment => (
              <div key={assignment.id || Math.random()} className="p-3 bg-danilo-bg-secondary rounded-xl border border-danilo-border flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-danilo-text">{assignment.title || 'Untitled Assignment'}</h4>
                  <p className="text-xs text-danilo-text-secondary">{assignment.courseName || 'Course'}</p>
                </div>
                <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded-md">
                  Due {assignment.dueDate || 'N/A'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState 
            icon={Activity} 
            title="No Recent Activity" 
            description="Your latest class activities and student submissions will appear here."
          />
        )}
      </Card>
    </div>
  );
}
