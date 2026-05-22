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
          <Card className="flex flex-col justify-between" hover>
            <div>
              <div className="w-12 h-12 bg-danilo-success-subtle text-danilo-success rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="dn-heading-lg">Active</h3>
              <p className="dn-subtitle mt-1">Study Status</p>
            </div>
            <div className="mt-4 pt-4 border-t border-danilo-border">
              <span className="dn-caption font-medium text-danilo-success">On track this week</span>
            </div>
          </Card>
          
          <Card className="md:col-span-2 dn-gradient-ai border-blue-100 relative overflow-hidden" hover>
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <div className="flex items-start gap-5 relative z-10">
              <div className="w-12 h-12 bg-white/60 backdrop-blur text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-white">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="dn-heading-md text-blue-900 mb-2">AI Learning Insights</h3>
                <p className="text-[15px] text-blue-800/90 leading-relaxed max-w-2xl">{insights}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="w-5 h-5 text-danilo-primary" />
            <h2 className="dn-title">Upcoming Performance Tasks</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : performanceTasks.length > 0 ? (
            <div className="space-y-3">
              {performanceTasks.map(task => (
                <div key={task.id} className="p-4 bg-white hover:bg-danilo-bg-secondary rounded-xl border border-danilo-border transition-colors flex justify-between items-center group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-danilo-warning-subtle text-danilo-warning flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-danilo-text">{task.title}</h4>
                      <p className="dn-caption">{task.courseTitle}</p>
                    </div>
                  </div>
                  <span className="dn-chip bg-danilo-warning-subtle text-danilo-warning border-transparent">
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
            <h2 className="dn-title">Recent Written Works</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : recentGrades.length > 0 ? (
            <div className="space-y-3">
              {recentGrades.map(work => (
                <div key={work.id || Math.random()} className="p-4 bg-white hover:bg-danilo-bg-secondary rounded-xl border border-danilo-border transition-colors flex justify-between items-center group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-danilo-bg-tertiary flex items-center justify-center text-danilo-text-secondary group-hover:bg-white group-hover:shadow-sm transition-all">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-danilo-text">{work.component || "Assessment"}</h4>
                      <p className="dn-caption">{work.courseCode}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-bold text-danilo-primary">
                      {work.score} <span className="text-sm text-danilo-text-muted font-normal">/ {work.maxScore}</span>
                    </span>
                    <span className="dn-caption text-danilo-success">Graded</span>
                  </div>
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
