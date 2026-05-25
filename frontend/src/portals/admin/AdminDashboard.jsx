import { useApi } from "../../hooks/useApi";
import { Card, PageHeader, Skeleton, EmptyState, Badge } from "../../components/ui";
import { Users, BookOpen, Shield, Wifi, Cpu, MessageSquare, Activity } from "lucide-react";

export default function AdminDashboard() {
  const { data, loading, error, refresh } = useApi("/admin/overview", { immediate: true });

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="System Overview" description="Monitor the DANILO LMS platform." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="System Overview" description="Monitor the DANILO LMS platform." />
        <Card>
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <h3 className="text-lg font-semibold text-danilo-text mb-2">Unable to load overview</h3>
            <p className="text-sm text-danilo-text-secondary max-w-sm mb-6">{error}</p>
            <button onClick={refresh} className="dn-btn-secondary">Try Again</button>
          </div>
        </Card>
      </div>
    );
  }

  const totals = data?.totals || {};
  const system = data?.system || {};
  const courses = data?.courses || [];
  const stream = data?.stream || [];

  const statCards = [
    { label: "Learners", value: totals.learners || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Faculty", value: totals.faculty || 0, icon: Shield, color: "text-danilo-secondary", bg: "bg-cyan-50" },
    { label: "Classes", value: totals.classes || 0, icon: BookOpen, color: "text-danilo-warning", bg: "bg-amber-50" },
    { label: "Modules", value: totals.modules || 0, icon: BookOpen, color: "text-danilo-purple", bg: "bg-violet-50" },
    { label: "Enrollments", value: totals.enrollments || 0, icon: Activity, color: "text-danilo-success", bg: "bg-green-50" },
    { label: "AI Conversations", value: totals.aiConversations || 0, icon: MessageSquare, color: "text-danilo-primary", bg: "bg-blue-50" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="System Overview" description="Monitor the DANILO LMS platform." />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="flex flex-col items-center text-center">
            <div className={`w-10 h-10 ${s.bg} ${s.color} rounded-lg flex items-center justify-center mb-3`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-danilo-text">{s.value}</p>
            <p className="text-xs text-danilo-text-muted mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="dn-title mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-danilo-bg-secondary rounded-xl border border-danilo-border">
              <div className="flex items-center gap-3">
                <Cpu className="w-4 h-4 text-danilo-text-secondary" />
                <span className="text-sm text-danilo-text">AI Runtime</span>
              </div>
              <Badge color="success">{system.aiRuntime || "N/A"}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-danilo-bg-secondary rounded-xl border border-danilo-border">
              <div className="flex items-center gap-3">
                <Cpu className="w-4 h-4 text-danilo-text-secondary" />
                <span className="text-sm text-danilo-text">AI Model</span>
              </div>
              <span className="text-sm text-danilo-text-secondary font-mono">{system.aiModel || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-danilo-bg-secondary rounded-xl border border-danilo-border">
              <div className="flex items-center gap-3">
                <Wifi className="w-4 h-4 text-danilo-text-secondary" />
                <span className="text-sm text-danilo-text">Database</span>
              </div>
              <Badge color="success">{system.database || "N/A"}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-danilo-bg-secondary rounded-xl border border-danilo-border">
              <div className="flex items-center gap-3">
                <Wifi className="w-4 h-4 text-danilo-text-secondary" />
                <span className="text-sm text-danilo-text">Mode</span>
              </div>
              <Badge color="primary">{system.mode || "N/A"}</Badge>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="dn-title mb-4">Recent Activity</h3>
          {stream?.length > 0 ? (
            <div className="space-y-3">
              {stream.slice(0, 5).map((item) => (
                <div key={item.id} className="p-3 bg-danilo-bg-secondary rounded-xl border border-danilo-border">
                  <p className="text-sm font-medium text-danilo-text">{item.title}</p>
                  <p className="dn-caption mt-1">{item.courseTitle} {item.authorName}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Activity} title="No recent activity" description="Platform activity will appear here." />
          )}
        </Card>
      </div>

      <Card>
        <h3 className="dn-title mb-4">Active Classes</h3>
        {courses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-danilo-border">
                  <th className="text-left py-2 px-3 font-medium text-danilo-text-muted">Code</th>
                  <th className="text-left py-2 px-3 font-medium text-danilo-text-muted">Title</th>
                  <th className="text-left py-2 px-3 font-medium text-danilo-text-muted">Subject</th>
                  <th className="text-left py-2 px-3 font-medium text-danilo-text-muted">Grade</th>
                  <th className="text-right py-2 px-3 font-medium text-danilo-text-muted">Students</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.id} className="border-b border-danilo-border/50 hover:bg-danilo-bg-secondary">
                    <td className="py-2 px-3 text-danilo-text font-medium">{c.code}</td>
                    <td className="py-2 px-3 text-danilo-text-secondary">{c.title}</td>
                    <td className="py-2 px-3 text-danilo-text-secondary">{c.subject}</td>
                    <td className="py-2 px-3 text-danilo-text-secondary">{c.gradeLevel}</td>
                    <td className="py-2 px-3 text-right text-danilo-text">{c.studentTotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={BookOpen} title="No classes" description="Classes will appear here once created." />
        )}
      </Card>
    </div>
  );
}
