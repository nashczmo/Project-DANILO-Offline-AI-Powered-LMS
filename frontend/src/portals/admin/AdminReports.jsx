import { useApi } from "../../hooks/useApi";
import { apiUrl } from "../../api";
import { useAppStore } from "../../store/useAppStore";
import { Card, PageHeader, Skeleton, Button } from "../../components/ui";
import { BarChart3, Users, Activity, MessageSquare, TrendingUp, Download } from "lucide-react";

export default function AdminReports() {
  const { data, loading, error, refresh } = useApi("/admin/overview", { immediate: true });
  const token = useAppStore((s) => s.token);

  const handleDownload = async (endpoint, filename) => {
    try {
      const res = await fetch(apiUrl(endpoint), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to download");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error downloading report.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Reports" description="Platform analytics and usage reports." />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reports" description="Platform analytics and usage reports." />
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="text-base font-bold text-[#202124] mb-2">Unable to load reports</h3>
            <p className="text-sm text-[#5F6368] max-w-sm mb-6">{error}</p>
            <button onClick={refresh} className="dn-btn-secondary">Try Again</button>
          </div>
        </Card>
      </div>
    );
  }

  const totals = data?.totals || {};

  const metrics = [
    {
      label: "Total Users",
      value: (totals.learners || 0) + (totals.faculty || 0) + (totals.admins || 0),
      icon: Users,
      iconBg: "bg-[#E8F0FE]",
      iconColor: "text-[#1A73E8]",
      sub: `${totals.learners || 0} students · ${totals.faculty || 0} teachers`,
    },
    {
      label: "Active Enrollments",
      value: totals.enrollments || 0,
      icon: Activity,
      iconBg: "bg-[#E6F4EA]",
      iconColor: "text-[#188038]",
      sub: "Active class enrollments",
    },
    {
      label: "Chat Sessions",
      value: totals.chatSessions || 0,
      icon: MessageSquare,
      iconBg: "bg-[#F3E8FD]",
      iconColor: "text-[#7B1FA2]",
      sub: "Total AI chat sessions",
    },
    {
      label: "AI Conversations",
      value: totals.aiConversations || 0,
      icon: BarChart3,
      iconBg: "bg-[#FEF7E0]",
      iconColor: "text-[#E37400]",
      sub: "Total AI exchanges",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Reports"
        description="Platform analytics, usage metrics, and operational highlights."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => handleDownload('/admin/reports/roster', 'danilo-roster.csv')}>
              <Download className="w-4 h-4" /> Roster
            </Button>
            <Button variant="secondary" onClick={() => handleDownload('/admin/reports/grades', 'danilo-grades.csv')}>
              <Download className="w-4 h-4" /> Grades
            </Button>
          </div>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label} className="flex flex-col gap-4 p-5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${m.iconBg} ${m.iconColor}`}>
              <m.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-3xl font-black text-[#202124] leading-none">{m.value}</p>
              <p className="text-sm font-black text-[#202124] mt-2">{m.label}</p>
              <p className="text-xs text-[#9AA0A6] font-bold mt-0.5">{m.sub}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Operations Highlights */}
      {(data?.operationsHighlights || []).length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-5 h-5 text-[#1A73E8]" />
            <h3 className="text-base font-black text-[#202124]">Network &amp; Operations</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(data.operationsHighlights || []).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-3 px-4 bg-[#F8F9FA] rounded-xl border border-[#E0E0E0]"
              >
                <span className="text-sm font-bold text-[#5F6368]">{item.label}</span>
                <span className="text-sm font-black text-[#202124] font-mono">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
