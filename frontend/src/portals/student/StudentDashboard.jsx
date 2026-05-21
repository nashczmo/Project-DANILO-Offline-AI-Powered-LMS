import { useAppStore } from "../../store/useAppStore";
import { Card, PageHeader, Skeleton, EmptyState } from "../../components/ui";
import { FileText, ClipboardList, TrendingUp, Sparkles } from "lucide-react";

export default function StudentDashboard() {
  const dashboard = useAppStore((s) => s.dashboard);
  const loading = !dashboard;
  const data = dashboard || {};

  const stream = data.stream || [];
  const grades = data.grades || [];
  const aiProfile = data.aiProfile || {};
  
  const performanceTasks = stream.filter(s => s.postType === "assignment").slice(0, 5);
  const recentGrades = grades.slice(0, 5);
  const insights = aiProfile.personality_preference 
    ? `Your AI tutor is configured for a ${aiProfile.personality_preference} learning style.` 
    : "Keep up the good work! We'll provide more insights as you interact with the platform.";

  return (
    <div className="space-y-6">
      <PageHeader 
        title="My Overview" 
        description="A summary of your upcoming academic requirements and performance."
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-3">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-3xl font-bold text-danilo-text">Active</h3>
            <p className="text-sm text-danilo-text-secondary mt-1">Study Status</p>
          </Card>
          
          <Card className="md:col-span-2 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-blue-900 mb-1">AI Insights</h3>
                <p className="text-sm text-blue-800 leading-relaxed">{insights}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="w-5 h-5 text-danilo-primary" />
            <h2 className="text-lg font-bold text-danilo-text">Upcoming Performance Tasks</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : performanceTasks.length > 0 ? (
            <div className="space-y-3">
              {performanceTasks.map(task => (
                <div key={task.id} className="p-3 bg-danilo-bg-secondary rounded-xl border border-danilo-border flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-danilo-text">{task.title}</h4>
                    <p className="text-xs text-danilo-text-secondary">{task.courseTitle}</p>
                  </div>
                  <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded-md">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={ClipboardList} 
              title="No pending tasks" 
              description="All pending performance tasks have been completed."
            />
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-danilo-primary" />
            <h2 className="text-lg font-bold text-danilo-text">Recent Written Works</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : recentGrades.length > 0 ? (
            <div className="space-y-3">
              {recentGrades.map(work => (
                <div key={work.id || Math.random()} className="p-3 bg-danilo-bg-secondary rounded-xl border border-danilo-border flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-danilo-text">{work.component || "Assessment"}</h4>
                    <p className="text-xs text-danilo-text-secondary">{work.courseCode}</p>
                  </div>
                  <span className="text-sm font-bold text-danilo-primary">
                    {work.score} / {work.maxScore}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={FileText} 
              title="No written works" 
              description="No recent written works have been recorded."
            />
          )}
        </Card>
      </div>
    </div>
  );
}
