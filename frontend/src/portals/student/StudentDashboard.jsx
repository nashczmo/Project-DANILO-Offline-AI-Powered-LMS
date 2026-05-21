import { useAppStore } from "../../store/useAppStore";
import { Card, PageHeader, Skeleton, EmptyState } from "../../components/ui";
import { FileText, ClipboardList, TrendingUp, Sparkles } from "lucide-react";

export default function StudentDashboard() {
  const dashboard = useAppStore((s) => s.dashboard);
  const loading = !dashboard;
  const data = dashboard || { performanceTasks: [], writtenWorks: [], streak: 0, insights: "" };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="My Overview" 
        description="Here is your summary of upcoming DepEd requirements and performance."
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
            <h3 className="text-3xl font-bold text-danilo-text">{data.streak || 0} Days</h3>
            <p className="text-sm text-danilo-text-secondary mt-1">Study Streak</p>
          </Card>
          
          <Card className="md:col-span-2 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-blue-900 mb-1">AI Insights</h3>
                <p className="text-sm text-blue-800 leading-relaxed">{data.insights || "Keep up the good work! We'll provide more insights as you interact with the platform."}</p>
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
          ) : data.performanceTasks && data.performanceTasks.length > 0 ? (
            <div className="space-y-3">
              {data.performanceTasks.map(task => (
                <div key={task.id} className="p-3 bg-danilo-bg-secondary rounded-xl border border-danilo-border flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-danilo-text">{task.title}</h4>
                    <p className="text-xs text-danilo-text-secondary">{task.subject}</p>
                  </div>
                  <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded-md">
                    Due {task.due}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={ClipboardList} 
              title="No pending tasks" 
              description="You have caught up with all your performance tasks!"
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
          ) : data.writtenWorks && data.writtenWorks.length > 0 ? (
            <div className="space-y-3">
              {data.writtenWorks.map(work => (
                <div key={work.id} className="p-3 bg-danilo-bg-secondary rounded-xl border border-danilo-border flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-danilo-text">{work.title}</h4>
                    <p className="text-xs text-danilo-text-secondary">{work.subject}</p>
                  </div>
                  <span className="text-sm font-bold text-danilo-primary">
                    {work.score}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={FileText} 
              title="No written works" 
              description="No recent written works recorded."
            />
          )}
        </Card>
      </div>
    </div>
  );
}
