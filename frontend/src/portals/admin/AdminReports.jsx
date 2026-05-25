import { useApi } from "../../hooks/useApi";
import { Card, PageHeader, Skeleton, EmptyState, Badge } from "../../components/ui";
import { BarChart3, Users, Activity, MessageSquare } from "lucide-react";

export default function AdminReports() {
  const { data, loading, error, refresh } = useApi("/admin/overview", { immediate: true });

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reports" description="Platform analytics and usage reports." />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reports" description="Platform analytics and usage reports." />
        <Card>
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <h3 className="text-lg font-semibold text-danilo-text mb-2">Unable to load reports</h3>
            <p className="text-sm text-danilo-text-secondary max-w-sm mb-6">{error}</p>
            <button onClick={refresh} className="dn-btn-secondary">Try Again</button>
          </div>
        </Card>
      </div>
    );
  }

  const totals = data?.totals || {};
  const system = data?.system || {};

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Platform analytics and usage reports." />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="dn-caption">Total Users</p>
              <p className="text-xl font-bold text-danilo-text">{(totals.learners || 0) + (totals.faculty || 0) + (totals.admins || 0)}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-danilo-success-subtle text-danilo-success rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <p className="dn-caption">Active Enrollments</p>
              <p className="text-xl font-bold text-danilo-text">{totals.enrollments || 0}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-danilo-purple-subtle text-danilo-purple rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <p className="dn-caption">Chat Sessions</p>
              <p className="text-xl font-bold text-danilo-text">{totals.chatSessions || 0}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-danilo-warning-subtle text-danilo-warning rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <p className="dn-caption">AI Conversations</p>
              <p className="text-xl font-bold text-danilo-text">{totals.aiConversations || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="dn-title mb-4">Network & Operations</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(data?.operationsHighlights || []).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-danilo-bg-secondary rounded-xl border border-danilo-border">
              <span className="text-sm text-danilo-text-secondary">{item.label}</span>
              <span className="text-sm font-medium text-danilo-text font-mono">{item.value}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="dn-title mb-4">AI Status</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-danilo-bg-secondary rounded-xl border border-danilo-border">
            <span className="text-sm text-danilo-text-secondary">Runtime</span>
            <Badge color="success">{system.aiRuntime || "N/A"}</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-danilo-bg-secondary rounded-xl border border-danilo-border">
            <span className="text-sm text-danilo-text-secondary">Model</span>
            <span className="text-sm font-medium text-danilo-text font-mono">{system.aiModel || "N/A"}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-danilo-bg-secondary rounded-xl border border-danilo-border">
            <span className="text-sm text-danilo-text-secondary">Mode</span>
            <Badge color="primary">{system.mode || "N/A"}</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
