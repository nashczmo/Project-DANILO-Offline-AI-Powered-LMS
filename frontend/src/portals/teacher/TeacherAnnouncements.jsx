import { useState } from "react";
import { useApi } from "../../hooks/useApi";
import { apiRequest } from "../../api";
import { Card, PageHeader, Skeleton, EmptyState, Badge, Button } from "../../components/ui";
import { Bell, Plus, MessageSquare } from "lucide-react";

export default function TeacherAnnouncements() {
  const { data, loading, error, refresh } = useApi("/teacher/announcements", { immediate: true });
  const { data: courses } = useApi("/teacher/courses", { immediate: true });
  const announcements = data || [];
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("error");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.courseId || !formData.title || !formData.body) return;
    setSubmitting(true);
    setNotice("");
    try {
      await apiRequest("/teacher/announcements", {
        method: "POST",
        body: { courseId: parseInt(formData.courseId), title: formData.title, body: formData.body },
      });
      setShowForm(false);
      setFormData({});
      refresh();
      setNoticeType("success");
      setNotice("Announcement posted successfully.");
    } catch (err) {
      setNoticeType("error");
      setNotice(err.message || "Could not post announcement.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Announcements" description="Post and manage class announcements." />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Announcements" description="Post and manage class announcements." />
        <Card>
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <h3 className="text-lg font-semibold text-danilo-text mb-2">Unable to load announcements</h3>
            <p className="text-sm text-danilo-text-secondary max-w-sm mb-6">{error}</p>
            <Button onClick={refresh} variant="secondary">Try Again</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Post and manage class announcements."
        action={<Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4" /> New</Button>}
      />

      {notice && (
        <div className={`p-3 rounded-xl border text-sm font-medium ${
          noticeType === "success"
            ? "bg-danilo-success-subtle border-danilo-success/20 text-danilo-success"
            : "bg-danilo-error-subtle border-danilo-error/20 text-danilo-error"
        }`}>
          {notice}
        </div>
      )}

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-3">
            <select
              className="dn-input"
              value={formData.courseId || ""}
              onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
              required
            >
              <option value="">Select class</option>
              {(courses || []).map((c) => (
                <option key={c.id} value={c.id}>{c.subject} {c.gradeLevel}</option>
              ))}
            </select>
            <input className="dn-input" placeholder="Title" value={formData.title || ""} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            <textarea className="dn-textarea" placeholder="Body" value={formData.body || ""} onChange={(e) => setFormData({ ...formData, body: e.target.value })} required />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Posting..." : "Post Announcement"}</Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {announcements.length === 0 ? (
        <EmptyState icon={Bell} title="No announcements" description="Announcements you post will appear here." />
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => (
            <Card key={item.id}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-danilo-primary-subtle text-danilo-primary flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-danilo-text text-sm">{item.title}</h4>
                  <p className="text-sm text-danilo-text-secondary mt-1">{item.body}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge color="secondary">{item.courseTitle || item.courseCode}</Badge>
                    <span className="dn-caption">{item.authorName}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
