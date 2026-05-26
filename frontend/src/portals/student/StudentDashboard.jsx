import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";
import { useApi } from "../../hooks/useApi";
import { Card, PageHeader, Skeleton, EmptyState, Badge } from "../../components/ui";
import { ClipboardList, FileText, TrendingUp, Sparkles, Bell, ArrowRight, BookOpen } from "lucide-react";

export default function StudentDashboard() {
  const dashboard = useAppStore((s) => s.dashboard);
  const user = useAppStore((s) => s.user);
  const { data: assignmentsData, loading: assignmentsLoading } = useApi("/student/assignments", {
    immediate: true,
  });
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
    : [
        "Ask your AI Tutor to explain today's lesson in simpler words.",
        "Review one weak topic for 10 minutes before class.",
        "Use Quiz Me mode before your next exam.",
      ];

  // Quick stat cards
  const stats = loading
    ? null
    : [
        {
          label: "Active Classes",
          value: courses.length,
          icon: BookOpen,
          iconBg: "bg-[#E8F0FE]",
          iconColor: "text-[#1A73E8]",
          trend: "On track this week",
          trendColor: "text-[#188038]",
          onClick: () => navigate("/student/classes"),
        },
        {
          label: "Pending Assignments",
          value: pendingAssignments.length,
          icon: ClipboardList,
          iconBg: "bg-[#FEF7E0]",
          iconColor: "text-[#E37400]",
          trend: pendingAssignments.length > 0 ? "Due soon" : "All caught up ✓",
          trendColor: pendingAssignments.length > 0 ? "text-[#E37400]" : "text-[#188038]",
          onClick: () => navigate("/student/assignments"),
        },
        {
          label: "Graded Items",
          value: recentGrades.length,
          icon: TrendingUp,
          iconBg: "bg-[#E6F4EA]",
          iconColor: "text-[#188038]",
          trend: "Recent grades",
          trendColor: "text-[#9AA0A6]",
          onClick: () => navigate("/student/grades"),
        },
      ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="My Overview"
        description={`Welcome back, ${user?.fullName || "Student"}. Here is everything you need for today.`}
      />

      {/* ── Quick Stats ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
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
              <div>
                <p className="text-3xl font-black text-[#202124] leading-none">{s.value}</p>
                <p className="text-sm font-black text-[#202124] mt-2">{s.label}</p>
                <p className={`text-xs font-bold mt-0.5 ${s.trendColor}`}>{s.trend}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── AI Insights Banner ── */}
      {!loading && (
        <div className="dn-card p-5 flex flex-col sm:flex-row sm:items-center gap-4 border-[#1A73E8]/20 bg-[#E8F0FE]/30">
          <div className="w-11 h-11 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-[#202124]">AI Learning Insights</p>
            <p className="text-sm text-[#5F6368] leading-relaxed mt-0.5 dn-line-clamp-2">
              {aiProfile?.recommendations?.length
                ? aiProfile.recommendations[0]
                : "Interact with the AI Tutor to receive personalized learning recommendations."}
            </p>
          </div>
          <button
            onClick={() => navigate("/student/tutor")}
            className="dn-btn-primary flex-shrink-0 text-sm"
          >
            Ask AI Tutor <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Pending Assignments ── */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <ClipboardList className="w-5 h-5 text-[#1A73E8]" />
            <h2 className="text-base font-black text-[#202124]">Pending Assignments</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-[60px]" />
              <Skeleton className="h-[60px]" />
              <Skeleton className="h-[60px]" />
            </div>
          ) : pendingAssignments.length > 0 ? (
            <div className="space-y-2">
              {pendingAssignments.map((task) => (
                <div
                  key={task.id}
                  onClick={() => navigate("/student/assignments")}
                  className="flex items-center justify-between py-3 px-4 bg-[#F8F9FA] hover:bg-white rounded-xl border border-[#E0E0E0] hover:border-[#C5D4F5] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#FEF7E0] text-[#E37400] flex items-center justify-center flex-shrink-0">
                      <ClipboardList className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#202124] truncate">{task.title}</p>
                      <p className="text-xs text-[#9AA0A6] font-bold">{task.courseTitle}</p>
                    </div>
                  </div>
                  <Badge color="warning">Pending</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ClipboardList}
              title="All done!"
              description="No pending assignments. Great work!"
            />
          )}
        </Card>

        {/* ── Recent Grades ── */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <FileText className="w-5 h-5 text-[#1A73E8]" />
            <h2 className="text-base font-black text-[#202124]">Recent Grades</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-[60px]" />
              <Skeleton className="h-[60px]" />
              <Skeleton className="h-[60px]" />
            </div>
          ) : recentGrades.length > 0 ? (
            <div className="space-y-2">
              {recentGrades.map((work) => (
                <div
                  key={work.id || Math.random()}
                  className="flex items-center justify-between py-3 px-4 bg-[#F8F9FA] rounded-xl border border-[#E0E0E0]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#F1F3F4] text-[#5F6368] flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#202124] truncate">
                        {work.component || "Assessment"}
                      </p>
                      <p className="text-xs text-[#9AA0A6] font-bold">{work.courseCode}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span className="text-base font-black text-[#1A73E8]">
                      {work.score}
                      <span className="text-sm text-[#9AA0A6] font-bold"> / {work.maxScore}</span>
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
              description="Your grades will appear here once your teachers record them."
            />
          )}
        </Card>
      </div>

      {/* ── AI Study Suggestions ── */}
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="w-5 h-5 text-[#1A73E8]" />
          <h2 className="text-base font-black text-[#202124]">AI Study Suggestions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {suggestions.map((item, idx) => (
            <div
              key={idx}
              className="p-4 bg-[#F8F9FA] rounded-xl border border-[#E0E0E0] flex gap-3"
            >
              <span className="w-5 h-5 rounded-full bg-[#1A73E8] text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <p className="text-sm text-[#5F6368] leading-relaxed font-bold">{item}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Announcements ── */}
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <Bell className="w-5 h-5 text-[#1A73E8]" />
          <h2 className="text-base font-black text-[#202124]">Announcements</h2>
        </div>
        {announcements.length > 0 ? (
          <div className="space-y-3">
            {announcements.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-[#F8F9FA] rounded-xl border border-[#E0E0E0]"
              >
                <div className="flex items-start gap-2 mb-2">
                  <Badge color="primary">Pinned</Badge>
                  <h4 className="text-sm font-bold text-[#202124] leading-snug">{item.title}</h4>
                </div>
                <p className="text-sm text-[#5F6368] leading-relaxed">{item.body}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-xs text-[#9AA0A6] font-bold">
                    {item.courseTitle || "School"}
                  </span>
                  <span className="text-xs text-[#9AA0A6] font-bold">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Bell}
            title="No announcements"
            description="Class and school announcements will appear here."
          />
        )}
      </Card>
    </div>
  );
}
