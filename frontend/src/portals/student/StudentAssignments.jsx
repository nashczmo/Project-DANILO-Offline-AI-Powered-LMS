import { useState } from "react";
import { useApi } from "../../hooks/useApi";
import { apiRequest } from "../../api";
import { Card, PageHeader, Skeleton, EmptyState, Badge, Button } from "../../components/ui";
import { ClipboardList, Send, CheckCircle, FileText } from "lucide-react";

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
      <div className="space-y-6">
        <PageHeader title="My Assignments" description="View and submit your course assignments." />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Assignments" description="View and submit your course assignments." />
        <Card>
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <h3 className="text-lg font-semibold text-danilo-text mb-2">Unable to load assignments</h3>
            <p className="text-sm text-danilo-text-secondary max-w-sm mb-6">{error}</p>
            <Button onClick={refresh} variant="secondary">Try Again</Button>
          </div>
        </Card>
      </div>
    );
  }

  const notStarted = assignments.filter((a) => a.status === "not_started");
  const submitted = assignments.filter((a) => a.status === "submitted" || a.status === "completed");

  return (
    <div className="space-y-6">
      <PageHeader title="My Assignments" description="View and submit your course assignments." />

      {submitError && (
        <div className="p-3 rounded-xl bg-danilo-error-subtle border border-danilo-error/20 text-sm text-danilo-error font-medium">
          {submitError}
        </div>
      )}

      {notStarted.length === 0 && submitted.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="No assignments"
          description="You don't have any assignments right now."
        />
      )}

      {notStarted.length > 0 && (
        <div className="space-y-4">
          <h2 className="dn-title">Pending</h2>
          {notStarted.map((a) => (
            <Card key={a.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-danilo-warning-subtle text-danilo-warning flex items-center justify-center">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-danilo-text text-sm">{a.title}</h4>
                    <p className="dn-caption">{a.courseTitle} {a.points} pts</p>
                  </div>
                </div>
                <Badge color="warning">Pending</Badge>
              </div>
              <p className="text-sm text-danilo-text-secondary mb-4 whitespace-pre-line">{a.instructions}</p>
              <div className="space-y-3">
                <textarea
                  value={responseText[a.id] || ""}
                  onChange={(e) => setResponseText((prev) => ({ ...prev, [a.id]: e.target.value }))}
                  placeholder="Type your response here..."
                  className="dn-textarea w-full"
                  rows={4}
                  disabled={submittingId === a.id}
                />
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleSubmit(a.id)}
                    disabled={submittingId === a.id || !(responseText[a.id] || "").trim()}
                    size="sm"
                  >
                    {submittingId === a.id ? <Skeleton className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                    Submit
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleComplete(a.id)} disabled={submittingId === a.id}>
                    <CheckCircle className="w-4 h-4" />
                    Mark Complete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {submitted.length > 0 && (
        <div className="space-y-4">
          <h2 className="dn-title">Submitted</h2>
          {submitted.map((a) => (
            <Card key={a.id} className="opacity-80">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-danilo-success-subtle text-danilo-success flex items-center justify-center">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-danilo-text text-sm">{a.title}</h4>
                    <p className="dn-caption">{a.courseTitle}</p>
                  </div>
                </div>
                <Badge color={a.status === "completed" ? "success" : "primary"}>
                  {a.status === "completed" ? "Completed" : "Submitted"}
                </Badge>
              </div>
              {a.responseText && (
                <div className="mt-3 p-3 bg-danilo-bg-secondary rounded-xl border border-danilo-border">
                  <p className="text-xs font-medium text-danilo-text-muted mb-1">Your response</p>
                  <p className="text-sm text-danilo-text-secondary whitespace-pre-line">{a.responseText}</p>
                </div>
              )}
              {a.score !== null && (
                <div className="mt-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-danilo-primary" />
                  <span className="text-sm font-medium text-danilo-text">
                    Score: {a.score} / {a.points}
                  </span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
