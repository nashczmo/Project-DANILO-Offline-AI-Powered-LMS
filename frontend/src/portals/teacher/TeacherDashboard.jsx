import { useAppStore } from "../../store/useAppStore";
import { PageHeader, Card, Skeleton, EmptyState } from "../../components/ui";
import { Users, FileText, Activity } from "lucide-react";

export default function TeacherDashboard() {
  const dashboard = useAppStore((s) => s.dashboard);
  const loading = !dashboard;

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Overview" description="Welcome to the faculty portal. Your academic overview is presented below." />
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
  const stream = dashboard.stream || [];
  const assignments = stream.filter(s => s.postType === "assignment");
  const avgAttendance = dashboard.avgAttendance || "N/A";

  if (courses.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Overview" description="Welcome to the faculty portal. Your academic overview is presented below." />
        <EmptyState 
          icon={Activity} 
          title="No Data Available" 
          description="You have not been assigned to any instructional sections." 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Overview" description="A summary of current academic activities is presented below." />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex flex-col justify-between" hover>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="dn-heading-md">Active Sections</h3>
          </div>
          <p className="text-4xl font-bold text-danilo-text mt-auto">{courses.length}</p>
        </Card>
        
        <Card className="flex flex-col justify-between" hover>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-danilo-warning-subtle text-danilo-warning rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="dn-heading-md">Items to Mark</h3>
          </div>
          <p className="text-4xl font-bold text-danilo-text mt-auto">{assignments.length}</p>
        </Card>
        
        <Card className="flex flex-col justify-between" hover>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-danilo-success-subtle text-danilo-success rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="dn-heading-md">Avg. Attendance</h3>
          </div>
          <p className="text-4xl font-bold text-danilo-text mt-auto">{avgAttendance}</p>
        </Card>
      </div>

      <Card>
        <h3 className="dn-title mb-4">Recent Activity</h3>
        {assignments.length > 0 ? (
          <div className="space-y-3">
            {assignments.slice(0, 5).map(assignment => (
              <div key={assignment.id || Math.random()} className="p-4 bg-white hover:bg-danilo-bg-secondary rounded-xl border border-danilo-border transition-colors flex justify-between items-center group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-danilo-warning-subtle text-danilo-warning flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-danilo-text">{assignment.title || 'Untitled Assignment'}</h4>
                    <p className="dn-caption">{assignment.courseTitle || 'Course'}</p>
                  </div>
                </div>
                <span className="dn-chip bg-danilo-warning-subtle text-danilo-warning border-transparent">
                  Pending Review
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState 
            icon={Activity} 
            title="No Recent Activity" 
            description="Recent academic activities and student submissions will be displayed here."
          />
        )}
      </Card>
    </div>
  );
}
