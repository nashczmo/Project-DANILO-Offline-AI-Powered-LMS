import { useApi } from "../../hooks/useApi";
import { Card, PageHeader, Skeleton, EmptyState, Badge, StatCard } from "../../components/ui";
import { Users, BookOpen, Shield, Wifi, Cpu, MessageSquare, Activity, GraduationCap } from "lucide-react";

export default function AdminDashboard() {
  const { data, loading, error, refresh } = useApi("/admin/overview", { immediate: true });

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="System Overview" description="Monitor the DANILO LMS platform." />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
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
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#FCE8E6] flex items-center justify-center mb-4">
              <Activity className="w-7 h-7 text-[#D93025]" />
            </div>
            <h3 className="text-base font-bold text-[#202124] mb-2">Unable to load overview</h3>
            <p className="text-sm text-[#5F6368] max-w-sm mb-6">{error}</p>
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
    {
      label: "Learners",
      value: totals.learners ?? 0,
      icon: Users,
      iconBg: "bg-[#E8F0FE]",
      iconColor: "text-[#1A73E8]",
    },
    {
      label: "Faculty",
      value: totals.faculty ?? 0,
      icon: Shield,
      iconBg: "bg-[#E6F4EA]",
      iconColor: "text-[#188038]",
    },
    {
      label: "Classes",
      value: totals.classes ?? 0,
      icon: BookOpen,
      iconBg: "bg-[#FEF7E0]",
      iconColor: "text-[#E37400]",
    },
    {
      label: "Modules",
      value: totals.modules ?? 0,
      icon: GraduationCap,
      iconBg: "bg-[#F3E8FD]",
      iconColor: "text-[#7B1FA2]",
    },
    {
      label: "Enrollments",
      value: totals.enrollments ?? 0,
      icon: Activity,
      iconBg: "bg-[#E6F4EA]",
      iconColor: "text-[#188038]",
    },
    {
      label: "AI Chats",
      value: totals.aiConversations ?? 0,
      icon: MessageSquare,
      iconBg: "bg-[#E8F0FE]",
      iconColor: "text-[#1A73E8]",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="System Overview"
        description="Monitor users, classes, and platform health at a glance."
      />

      {/* ── Stat Cards Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="flex flex-col gap-3 p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.iconBg} ${s.iconColor}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-black text-[#202124] leading-none">{s.value}</p>
              <p className="text-xs font-bold text-[#9AA0A6] mt-1 uppercase tracking-wide">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* ── System Status + Recent Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* System Status */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <Cpu className="w-5 h-5 text-[#1A73E8]" />
            <h3 className="text-base font-black text-[#202124]">System Status</h3>
          </div>
          <div className="space-y-2">
            {[
              { label: "AI Runtime",  icon: Cpu,  value: system.aiRuntime || "N/A",  badge: "success" },
              { label: "AI Model",    icon: Cpu,  value: system.aiModel || "N/A",    badge: null },
              { label: "Database",    icon: Wifi, value: system.database || "N/A",   badge: "success" },
              { label: "Mode",        icon: Wifi, value: system.mode || "N/A",       badge: "primary" },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between py-3 px-4 bg-[#F8F9FA] rounded-xl border border-[#E0E0E0]"
              >
                <div className="flex items-center gap-3">
                  <row.icon className="w-4 h-4 text-[#9AA0A6]" />
                  <span className="text-sm font-bold text-[#202124]">{row.label}</span>
                </div>
                {row.badge ? (
                  <Badge color={row.badge}>{row.value}</Badge>
                ) : (
                  <span className="text-sm text-[#5F6368] font-mono">{row.value}</span>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <Activity className="w-5 h-5 text-[#1A73E8]" />
            <h3 className="text-base font-black text-[#202124]">Recent Activity</h3>
          </div>
          {stream?.length > 0 ? (
            <div className="space-y-2">
              {stream.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="py-3 px-4 bg-[#F8F9FA] rounded-xl border border-[#E0E0E0]"
                >
                  <p className="text-sm font-bold text-[#202124]">{item.title}</p>
                  <p className="text-xs text-[#9AA0A6] mt-0.5 font-bold">
                    {[item.courseTitle, item.authorName].filter(Boolean).join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Activity}
              title="No recent activity"
              description="Platform activity will appear here."
            />
          )}
        </Card>
      </div>

      {/* ── Active Classes Table ── */}
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <BookOpen className="w-5 h-5 text-[#1A73E8]" />
          <h3 className="text-base font-black text-[#202124]">Active Classes</h3>
        </div>
        {courses.length > 0 ? (
          <div className="dn-table-responsive">
            <table className="dn-table dn-table-sticky-col">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Title</th>
                  <th className="hidden sm:table-cell">Subject</th>
                  <th className="hidden md:table-cell">Grade</th>
                  <th className="text-right">Students</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="font-bold text-[#1A73E8] font-mono text-xs bg-[#E8F0FE] px-2 py-0.5 rounded-md">
                        {c.code}
                      </span>
                    </td>
                    <td className="font-bold text-[#202124]">{c.title}</td>
                    <td className="hidden sm:table-cell text-[#5F6368]">{c.subject}</td>
                    <td className="hidden md:table-cell text-[#5F6368]">{c.gradeLevel}</td>
                    <td className="text-right font-bold text-[#202124]">{c.studentTotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title="No classes yet"
            description="Classes will appear here once created."
          />
        )}
      </Card>
    </div>
  );
}
