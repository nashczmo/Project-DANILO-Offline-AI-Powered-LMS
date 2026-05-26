import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";
import { useApi } from "../../hooks/useApi";
import { Card, PageHeader, Skeleton, EmptyState, Badge } from "../../components/ui";
import { ClipboardList, FileText, TrendingUp, Sparkles, AlertCircle, ArrowRight } from "lucide-react";

export default function StudentDashboard() {
  const dashboard = useAppStore((s) => s.dashboard);
  const user = useAppStore((s) => s.user);
  const { data: assignmentsData, loading: assignmentsLoading } = useApi("/student/assignments", { immediate: true });
  const navigate = useNavigate();

  const loading = !dashboard || assignmentsLoading;
  const stream = dashboard?.stream || [];
  const grades = dashboard?.grades || [];
  const aiProfile = dashboard?.aiProfile || {};
  const courses = dashboard?.courses || [];
  const assignments = assignmentsData || [];

  const pendingAssignments = assignments.filter((a) => a.status === "not_started").slice(0, 5);
  const recentGrades = grades.slice(0, 5);
  const announcements = stream.filter((s) => s.postType === "announcement").slice(0, 3);
  const suggestions = aiProfile?.recommendations?.length
    ? aiProfile.recommendations.slice(0, 3)
    : ["Ask DANILO to explain today lesson in simpler words.", "Review one weak topic for 10 minutes.", "Use Quiz Me mode before your next class."];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Overview"
        description={`Welcome back, ${user?.fullName || "Student"}. Here is everything you need for today.`}
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="flex flex-col justify-between" hover>
            <div>
              <div className="w-10 h-10 bg-danilo-success-subtle text-danilo-success rounded-lg flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="dn-heading-md">{courses.length}</h3>
              <p className="dn-subtitle mt-1">Active Classes</p>
            </div>
            <div className="mt-3 pt-3 border-t border-danilo-border">
              <span className="dn-caption font-medium text-danilo-success">On track this week</span>
            </div>
          </Card>

          <Card className="flex flex-col justify-between" hover>
            <div>
              <div className="w-10 h-10 bg-danilo-warning-subtle text-danilo-warning rounded-lg flex items-center justify-center mb-3">
                <ClipboardList className="w-5 h-5" />
              </div>
              <h3 className="dn-heading-md">{pendingAssignments.length}</h3>
              <p className="dn-subtitle mt-1">Pending Tasks</p>
            </div>
            <div className="mt-3 pt-3 border-t border-danilo-border">
              <span className="dn-caption font-medium text-danilo-warning">
                {pendingAssignments.length > 0 ? "Due soon" : "All caught up"}
              </span>
            </div>
          </Card>

          <Card className="relative overflow-hidden border-blue-100" hover>
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-400/5 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-10 h-10 bg-danilo-primary/10 text-danilo-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="dn-heading-md text-danilo-text mb-1">AI Learning Insights</h3>
                <p className="text-sm text-danilo-text-secondary leading-relaxed">
                  {aiProfile?.recommendations?.length
                    ? aiProfile.recommendations[0]
                    : "Interact with the AI Tutor to receive personalized learning recommendations."}
                </p>
                <button
                  onClick={() => navigate("/student/tutor")}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-danilo-primary hover:text-danilo-primary-hover transition-colors"
                >
                  Ask AI Tutor <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="w-5 h-5 text-danilo-primary" />
            <h2 className="dn-title">Pending Assignments</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : pendingAssignments.length > 0 ? (
            <div className="space-y-3">
              {pendingAssignments.map((task) => (
                <div
                  key={task.id}
                  onClick={() => navigate("/student/assignments")}
                  className="p-4 bg-danilo-bg-secondary hover:bg-white rounded-xl border border-danilo-border transition-colors flex justify-between items-center group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-danilo-warning-subtle text-danilo-warning flex items-center justify-center">
                      <ClipboardList className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-danilo-text text-sm">{task.title}</h4>
                      <p className="dn-caption">{task.courseTitle}</p>
                    </div>
                  </div>
                  <Badge color="warning">Pending</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ClipboardList}
              title="No pending assignments"
              description="All assignments have been completed. Great work!"
            />
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-danilo-primary" />
            <h2 className="dn-title">Recent Grades</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : recentGrades.length > 0 ? (
            <div className="space-y-3">
              {recentGrades.map((work) => (
                <div
                  key={work.id || Math.random()}
                  className="p-4 bg-danilo-bg-secondary rounded-xl border border-danilo-border flex justify-between items-center"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-danilo-bg-tertiary flex items-center justify-center text-danilo-text-secondary">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-danilo-text text-sm">{work.component || "Assessment"}</h4>
                      <p className="dn-caption">{work.courseCode}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-bold text-danilo-primary">
                      {work.score} <span className="text-sm text-danilo-text-muted font-normal">/ {work.maxScore}</span>
                    </span>
                    <Badge color="success">Graded</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No grades yet"
              description="Grades will appear here once your teachers record them."
            />
          )}
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-danilo-primary" />
          <h2 className="dn-title">AI Study Suggestions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {suggestions.map((item, idx) => (
            <div key={idx} className="p-4 bg-danilo-bg-secondary rounded-xl border border-danilo-border">
              <p className="text-sm text-danilo-text-secondary leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-danilo-primary" />
          <h2 className="dn-title">Announcements</h2>
        </div>
        {announcements.length > 0 ? (
          <div className="space-y-3">
            {announcements.map((item) => (
              <div key={item.id} className="p-4 bg-danilo-bg-secondary rounded-xl border border-danilo-border">
                <div className="flex items-center gap-2">
                  <Badge color="primary">Pinned</Badge>
                  <h4 className="font-semibold text-danilo-text text-sm">{item.title}</h4>
                </div>
                <p className="text-sm text-danilo-text-secondary mt-1">{item.body}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="dn-caption">{item.courseTitle || "School"}</span>
                  <span className="dn-caption">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={AlertCircle} title="No announcements" description="Latest class and school announcements will appear here." />
        )}
      </Card>
    </div>
  );
}
