import { useEffect, useState } from "react";
import { useApi } from "../../hooks/useApi";
import { apiRequest } from "../../api";
import { Card, PageHeader, Skeleton, EmptyState, Badge, Button, ErrorRetry } from "../../components/ui";
import { AlertTriangle, Users, Cpu, Sparkles, Send, BookOpen } from "lucide-react";

export default function TeacherInsights() {
  const { data: courses, loading: coursesLoading, error: coursesError, refresh: refreshCourses } = useApi("/teacher/courses", { immediate: true });
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatAnswer, setChatAnswer] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const { data: insights, loading, error, refresh } = useApi(
    selectedCourseId ? `/teacher/insights?class_id=${selectedCourseId}&include_ai=true` : null,
    { immediate: !!selectedCourseId }
  );

  useEffect(() => {
    if (!selectedCourseId && courses?.length) {
      setSelectedCourseId(String(courses[0].id));
    }
  }, [courses, selectedCourseId]);

  const sendInsightChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatLoading(true);
    setChatError("");
    try {
      const result = await apiRequest("/ai/tutor", {
        method: "POST",
        body: {
          question: chatInput,
          course_id: selectedCourseId || undefined,
          response_mode: "normal",
        },
      });
      setChatAnswer(result.answer || "DANILO did not return a response.");
    } catch (err) {
      setChatError(err.message || "AI unavailable. Please try again.");
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="AI Insights"
        description="AI-powered analysis of student performance, struggling learners, and class-wide recommendations."
      />

      {/* Class Selector */}
      <Card>
        <label htmlFor="insights-course-select" className="block text-sm font-black text-[#202124] mb-2">
          Select Class
        </label>
        <select
          id="insights-course-select"
          className="dn-input"
          value={selectedCourseId || ""}
          onChange={(e) => setSelectedCourseId(e.target.value || null)}
          disabled={coursesLoading || !!coursesError || !courses?.length}
        >
          <option value="">
            {coursesLoading ? "Loading classes..." : "Choose a class to analyze..."}
          </option>
          {(courses || []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.subject} - {c.gradeLevel} {c.term}
            </option>
          ))}
        </select>
      </Card>

      {coursesLoading && (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-40" />
        </div>
      )}

      {!coursesLoading && coursesError && (
        <Card>
          <ErrorRetry message={coursesError} onRetry={refreshCourses} />
        </Card>
      )}

      {!coursesLoading && !coursesError && courses?.length === 0 && (
        <Card>
          <EmptyState
            icon={BookOpen}
            title="No classes available"
            description="AI Insights will appear after a class is assigned to your teacher account."
          />
        </Card>
      )}

      {/* AI Chat */}
      {!coursesLoading && !coursesError && courses?.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[#1A73E8]" />
            <h3 className="text-base font-black text-[#202124]">Ask DANILO</h3>
            <span className="text-xs text-[#9AA0A6] font-bold">
              Intervention ideas, rubric help, or subject planning
            </span>
          </div>
          <form onSubmit={sendInsightChat} className="flex flex-col sm:flex-row gap-2">
            <input
              className="dn-input flex-1"
              placeholder="e.g. Which students need remediation in fractions?"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              aria-label="Ask AI a question"
              disabled={chatLoading}
            />
            <Button type="submit" disabled={chatLoading || !chatInput.trim()}>
              <Send className="w-4 h-4" />
              {chatLoading ? "Thinking..." : "Send"}
            </Button>
          </form>
          {chatError && (
            <div
              role="alert"
              className="mt-3 px-4 py-3 rounded-xl bg-[#FCE8E6] border border-[#D93025]/20 text-sm font-bold text-[#D93025]"
            >
              {chatError}
            </div>
          )}
          {chatAnswer && (
            <div className="mt-4 p-4 bg-[#E8F0FE]/40 rounded-xl border border-[#1A73E8]/15">
              <p className="text-xs font-black text-[#1A73E8] uppercase tracking-wide mb-2">DANILO's Response</p>
              <p className="text-sm text-[#202124] leading-relaxed whitespace-pre-line">{chatAnswer}</p>
            </div>
          )}
        </Card>
      )}

      {selectedCourseId && error && (
        <Card>
          <ErrorRetry message={error} onRetry={refresh} />
        </Card>
      )}

      {selectedCourseId && loading && !error && (
        <div className="space-y-4">
          <Skeleton className="h-40" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-40" />
        </div>
      )}

      {selectedCourseId && !loading && !error && insights && (
        <div className="space-y-6 animate-fade-in">
          {/* AI Summary */}
          <Card className="border-[#1A73E8]/20">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-[#E8F0FE] text-[#1A73E8] rounded-xl flex items-center justify-center flex-shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-base font-black text-[#202124]">AI Summary</h3>
                  <Badge
                    color={
                      insights.aiStatus === "ready"
                        ? "success"
                        : insights.aiStatus === "offline"
                        ? "warning"
                        : "secondary"
                    }
                  >
                    {insights.aiStatus === "ready"
                      ? "AI Ready"
                      : insights.aiStatus === "offline"
                      ? "AI Offline"
                      : "Skipped"}
                  </Badge>
                </div>
                <p className="text-sm text-[#5F6368] leading-relaxed whitespace-pre-line">
                  {insights.aiSummary || "No AI summary available for this class yet."}
                </p>
              </div>
            </div>
          </Card>

          {/* Stats Grid */}
          {insights.stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  label: "Students",
                  value: insights.stats.studentCount,
                  iconBg: "bg-[#E8F0FE]",
                  iconColor: "text-[#1A73E8]",
                  icon: Users,
                },
                {
                  label: "Class Average",
                  value: insights.stats.classAverage ?? "N/A",
                  iconBg: "bg-[#E6F4EA]",
                  iconColor: "text-[#188038]",
                  icon: BookOpen,
                },
                {
                  label: "Struggling",
                  value: insights.stats.strugglingCount,
                  iconBg: "bg-[#FCE8E6]",
                  iconColor: "text-[#D93025]",
                  icon: AlertTriangle,
                },
                {
                  label: "At Risk",
                  value: insights.stats.atRiskCount,
                  iconBg: "bg-[#FEF7E0]",
                  iconColor: "text-[#E37400]",
                  icon: AlertTriangle,
                },
              ].map((s) => (
                <Card key={s.label} className="flex flex-col gap-3 p-5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.iconBg} ${s.iconColor}`}>
                    <s.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-[#202124]">{s.value}</p>
                    <p className="text-xs font-black text-[#9AA0A6] uppercase tracking-wide mt-0.5">{s.label}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Struggling Students */}
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <AlertTriangle className="w-5 h-5 text-[#D93025]" />
              <h3 className="text-base font-black text-[#202124]">Struggling Students</h3>
            </div>
            {insights.strugglingStudents?.length > 0 ? (
              <div className="space-y-2">
                {insights.strugglingStudents.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 py-3 px-4 bg-[#FCE8E6]/50 rounded-xl border border-[#D93025]/10"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#FCE8E6] text-[#D93025] flex items-center justify-center font-black text-xs flex-shrink-0">
                      {s.studentName?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#202124]">{s.studentName || "Unknown"}</p>
                      <p className="text-xs text-[#9AA0A6] font-bold">{s.reason || "Needs attention"}</p>
                    </div>
                    <Badge color="error" className="ml-auto flex-shrink-0">At Risk</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Users}
                title="No struggling students"
                description="Great news! All students are performing well."
              />
            )}
          </Card>

          {/* Weak Topics */}
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <BookOpen className="w-5 h-5 text-[#E37400]" />
              <h3 className="text-base font-black text-[#202124]">Class Weak Topics</h3>
            </div>
            {insights.classWeakTopics?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {insights.classWeakTopics.map((topicObj, idx) => (
                  <Badge key={idx} color="warning">
                    {typeof topicObj === 'string' ? topicObj : topicObj.topic || "Unknown Topic"}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#9AA0A6] font-bold">No weak topics identified yet.</p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
