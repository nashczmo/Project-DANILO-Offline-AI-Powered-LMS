import { useAppStore } from "../../store/useAppStore";
import { Card, PageHeader, Skeleton, EmptyState, Badge } from "../../components/ui";
import { FileText, Activity, BookOpen, ArrowRight, Sparkles, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TeacherDashboard() {
  const dashboard = useAppStore((s) => s.dashboard);
  const user = useAppStore((s) => s.user);
  const navigate = useNavigate();
  const loading = !dashboard;
  const courses = dashboard?.courses || [];
  const stream = dashboard?.stream || [];
  const assignments = stream.filter((s) => s.postType === "assignment");

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Overview" description="Welcome to the faculty portal." />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Overview"
          description="Welcome to the faculty portal."
        />
        <EmptyState
          icon={Activity}
          title="No Classes Assigned"
          description="You have not been assigned to any instructional sections yet. Please contact your administrator."
        />
      </div>
    );
  }

  const stats = [
    {
      label: "Active Classes",
      value: courses.length,
      icon: BookOpen,
      iconBg: "bg-[#E8F0FE]",
      iconColor: "text-[#1A73E8]",
      linkLabel: "View classes",
      onClick: () => navigate("/teacher/classes"),
    },
    {
      label: "Items to Grade",
      value: assignments.length,
      icon: FileText,
      iconBg: "bg-[#FEF7E0]",
      iconColor: "text-[#E37400]",
      linkLabel: "View grades",
      onClick: () => navigate("/teacher/grades"),
    },
    {
      label: "AI Insights",
      value: null,
      icon: Sparkles,
      iconBg: "bg-[#E6F4EA]",
      iconColor: "text-[#188038]",
      description: "Get AI-powered analysis of student performance and recommendations.",
      linkLabel: "Open insights",
      onClick: () => navigate("/teacher/insights"),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Overview"
        description={`Welcome back, ${user?.fullName || "Teacher"}. Here's a summary of your classes.`}
      />

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card
            key={s.label}
            hover
            onClick={s.onClick}
            className="flex flex-col gap-4 p-5 cursor-pointer"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.iconBg} ${s.iconColor}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              {s.value !== null ? (
                <p className="text-3xl font-black text-[#202124] leading-none">{s.value}</p>
              ) : null}
              <p className="text-sm font-black text-[#202124] mt-2">{s.label}</p>
              {s.description && (
                <p className="text-xs text-[#9AA0A6] font-bold mt-0.5 leading-relaxed">{s.description}</p>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm font-black text-[#1A73E8] border-t border-[#E0E0E0] pt-3">
              {s.linkLabel} <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Card>
        ))}
      </div>

      {/* ── Recent Activity ── */}
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <Activity className="w-5 h-5 text-[#1A73E8]" />
          <h3 className="text-base font-black text-[#202124]">Recent Activity</h3>
        </div>
        {assignments.length > 0 ? (
          <div className="space-y-2">
            {assignments.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-3 px-4 bg-[#F8F9FA] hover:bg-white rounded-xl border border-[#E0E0E0] hover:border-[#C5D4F5] transition-colors cursor-pointer"
                onClick={() => navigate("/teacher/classes")}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#FEF7E0] text-[#E37400] flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#202124] truncate">{item.title || "Untitled"}</p>
                    <p className="text-xs text-[#9AA0A6] font-bold">{item.courseTitle || "Course"}</p>
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
            description="Student submissions and academic activities will appear here."
          />
        )}
      </Card>

      {/* ── My Classes (compact list) ── */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#1A73E8]" />
            <h3 className="text-base font-black text-[#202124]">My Classes</h3>
          </div>
          <button
            onClick={() => navigate("/teacher/classes")}
            className="text-sm font-black text-[#1A73E8] hover:text-[#1557B0] flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="dn-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Subject</th>
                <th className="hidden sm:table-cell">Grade Level</th>
                <th className="text-right">Students</th>
              </tr>
            </thead>
            <tbody>
              {courses.slice(0, 6).map((c) => (
                <tr
                  key={c.id}
                  onClick={() => navigate("/teacher/classes")}
                  className="cursor-pointer"
                >
                  <td>
                    <div>
                      <p className="font-bold text-[#202124]">{c.title || c.code}</p>
                      <p className="text-xs text-[#9AA0A6] font-bold">{c.code}</p>
                    </div>
                  </td>
                  <td className="text-[#5F6368]">{c.subject}</td>
                  <td className="hidden sm:table-cell text-[#5F6368]">{c.gradeLevel}</td>
                  <td className="text-right font-black text-[#202124]">{c.studentTotal ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
