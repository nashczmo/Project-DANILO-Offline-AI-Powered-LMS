import { useState } from "react";
import { useApi } from "../../hooks/useApi";
import { apiRequest } from "../../api";
import { Card, PageHeader, Skeleton, EmptyState, Badge, Button } from "../../components/ui";
import { ClipboardList, Send, CheckCircle, FileText, AlertCircle } from "lucide-react";

export default function StudentAssignments() {
  const { data, loading, error, refresh } = useApi("/student/assignments", { immediate: true });
  const assignments = data || [];
  const [submittingId, setSubmittingId] = useState(null);
  const [responseText, setResponseText] = useState({});
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async (assignmentId) => {
    const text = responseText[assignmentId] || "";
    if (!text.trim()) return;
    setSubmittingId(assignmentId);
    setSubmitError("");
    try {
      await apiRequest(`/student/assignments/${assignmentId}/submit`, {
        method: "POST",
        body: { responseText: text },
      });
      refresh();
      setResponseText((prev) => ({ ...prev, [assignmentId]: "" }));
    } catch (err) {
      setSubmitError(err.message || "Failed to submit assignment.");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleComplete = async (assignmentId) => {
    setSubmittingId(assignmentId);
    try {
      await apiRequest(`/student/assignments/${assignmentId}/complete`, { method: "POST" });
      refresh();
    } catch (err) {
      setSubmitError(err.message || "Failed to mark complete.");
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="My Assignments" description="View and submit your course assignments." />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Assignments" description="View and submit your course assignments." />
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="text-base font-bold text-[#202124] mb-2">Unable to load assignments</h3>
            <p className="text-sm text-[#5F6368] max-w-sm mb-6">{error}</p>
            <Button onClick={refresh} variant="secondary">Try Again</Button>
          </div>
        </Card>
      </div>
    );
  }

  const notStarted = assignments.filter((a) => a.status === "not_started");
  const submitted = assignments.filter((a) => a.status === "submitted" || a.status === "completed");

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="My Assignments"
        description="View and submit your course assignments."
      />

      {/* Error banner */}
      {submitError && (
        <div
          role="alert"
          className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#FCE8E6] border border-[#D93025]/20 text-sm font-bold text-[#D93025] animate-fade-in"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {submitError}
        </div>
      )}

      {notStarted.length === 0 && submitted.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="No assignments yet"
          description="You don't have any assignments right now."
        />
      )}

      {/* ── Pending Assignments ── */}
      {notStarted.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-[#202124]">Pending</h2>
            <Badge color="warning">{notStarted.length}</Badge>
          </div>
          {notStarted.map((a) => (
            <Card key={a.id}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FEF7E0] text-[#E37400] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-[#202124]">{a.title}</h4>
                    <p className="text-xs text-[#9AA0A6] font-bold mt-0.5">
                      {a.courseTitle} · {a.points} pts
                    </p>
                  </div>
                </div>
                <Badge color="warning">Pending</Badge>
              </div>

              {a.instructions && (
                <div className="p-4 bg-[#F8F9FA] rounded-xl border border-[#E0E0E0] mb-4">
                  <p className="text-xs font-black text-[#9AA0A6] uppercase tracking-wide mb-1.5">Instructions</p>
                  <p className="text-sm text-[#5F6368] leading-relaxed whitespace-pre-line">{a.instructions}</p>
                </div>
              )}

              <div className="space-y-3">
                <textarea
                  value={responseText[a.id] || ""}
                  onChange={(e) =>
                    setResponseText((prev) => ({ ...prev, [a.id]: e.target.value }))
                  }
                  placeholder="Type your response here…"
                  className="dn-textarea w-full"
                  rows={4}
                  disabled={submittingId === a.id}
                  aria-label={`Response for ${a.title}`}
                />
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleSubmit(a.id)}
                    disabled={submittingId === a.id || !(responseText[a.id] || "").trim()}
                    size="sm"
                  >
                    <Send className="w-4 h-4" />
                    {submittingId === a.id ? "Submitting…" : "Submit"}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleComplete(a.id)}
                    disabled={submittingId === a.id}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark Complete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </section>
      )}

      {/* ── Submitted Assignments ── */}
      {submitted.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-[#202124]">Submitted</h2>
            <Badge color="success">{submitted.length}</Badge>
          </div>
          {submitted.map((a) => (
            <Card key={a.id} className="opacity-90">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E6F4EA] text-[#188038] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-[#202124]">{a.title}</h4>
                    <p className="text-xs text-[#9AA0A6] font-bold mt-0.5">{a.courseTitle}</p>
                  </div>
                </div>
                <Badge color={a.status === "completed" ? "success" : "primary"}>
                  {a.status === "completed" ? "Completed" : "Submitted"}
                </Badge>
              </div>

              {a.responseText && (
                <div className="mt-4 p-4 bg-[#F8F9FA] rounded-xl border border-[#E0E0E0]">
                  <p className="text-xs font-black text-[#9AA0A6] uppercase tracking-wide mb-1.5">Your response</p>
                  <p className="text-sm text-[#5F6368] leading-relaxed whitespace-pre-line">{a.responseText}</p>
                </div>
              )}

              {a.score !== null && (
                <div className="mt-3 flex items-center gap-3 pt-3 border-t border-[#E0E0E0]">
                  <FileText className="w-4 h-4 text-[#1A73E8]" />
                  <span className="text-sm font-black text-[#202124]">
                    Score: {a.score} / {a.points}
                  </span>
                  <Badge color={a.score >= a.points * 0.75 ? "success" : "warning"}>
                    {Math.round((a.score / a.points) * 100)}%
                  </Badge>
                </div>
              )}
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}
