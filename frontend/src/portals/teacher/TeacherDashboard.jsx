import { useAppStore } from "../../store/useAppStore";
import { Card, PageHeader, Skeleton, EmptyState, Badge } from "../../components/ui";
import { FileText, Activity, BookOpen, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TeacherDashboard() {
  const dashboard = useAppStore((s) => s.dashboard);
  const navigate = useNavigate();
  const loading = !dashboard;
  const courses = dashboard?.courses || [];
  const stream = dashboard?.stream || [];
  const assignments = stream.filter((s) => s.postType === "assignment");

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Overview" description="Welcome to the faculty portal." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Overview" description="Welcome to the faculty portal." />
        <EmptyState
          icon={Activity}
          title="No Classes Assigned"
          description="You have not been assigned to any instructional sections yet."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Overview" description="A summary of your classes and academic activities." />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex flex-col justify-between" hover onClick={() => navigate("/teacher/classes")}>
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="dn-heading-md">Active Classes</h3>
            </div>
            <p className="text-3xl font-bold text-danilo-text">{courses.length}</p>
          </div>
          <div className="mt-3 pt-3 border-t border-danilo-border flex items-center gap-1 text-sm text-danilo-primary font-medium">
            View classes <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Card>

        <Card className="flex flex-col justify-between" hover onClick={() => navigate("/teacher/grades")}>
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-danilo-warning-subtle text-danilo-warning rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="dn-heading-md">Items to Grade</h3>
            </div>
            <p className="text-3xl font-bold text-danilo-text">{assignments.length}</p>
          </div>
          <div className="mt-3 pt-3 border-t border-danilo-border flex items-center gap-1 text-sm text-danilo-primary font-medium">
            View grades <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Card>

        <Card className="flex flex-col justify-between" hover onClick={() => navigate("/teacher/insights")}>
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-danilo-success-subtle text-danilo-success rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="dn-heading-md">AI Insights</h3>
            </div>
            <p className="text-sm text-danilo-text-secondary leading-relaxed">
              Get AI-powered analysis of student performance and recommendations.
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-danilo-border flex items-center gap-1 text-sm text-danilo-primary font-medium">
            Open insights <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="dn-title mb-4">Recent Activity</h3>
        {assignments.length > 0 ? (
          <div className="space-y-3">
            {assignments.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="p-4 bg-danilo-bg-secondary rounded-xl border border-danilo-border flex justify-between items-center cursor-pointer hover:bg-white transition-colors"
                onClick={() => navigate("/teacher/classes")}
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-danilo-warning-subtle text-danilo-warning flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-danilo-text text-sm">{item.title || "Untitled"}</h4>
                    <p className="dn-caption">{item.courseTitle || "Course"}</p>
                  </div>
                </div>
                <Badge color="warning">Pending Review</Badge>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Activity}
            title="No Recent Activity"
            description="Recent academic activities and student submissions will appear here."
          />
        )}
      </Card>
    </div>
  );
}
