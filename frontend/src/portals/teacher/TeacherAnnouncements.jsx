import { useState } from "react";
import { useApi } from "../../hooks/useApi";
import { apiRequest } from "../../api";
import { Card, PageHeader, Skeleton, EmptyState, Badge, Button } from "../../components/ui";
import { Bell, Plus, MessageSquare, X } from "lucide-react";

export default function TeacherAnnouncements() {
  const { data, loading, error, refresh } = useApi("/teacher/announcements", { immediate: true });
  const { data: courses } = useApi("/teacher/courses", { immediate: true });
  const announcements = data || [];
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("error");

  const validateAnnouncement = () => {
    if (!formData.courseId) return "Class is required.";
    if (!formData.title) return "Title required.";
    if (!formData.title.trim()) return "Title cannot be spaces.";
    if (!formData.body) return "Body required.";
    if (!formData.body.trim()) return "Body cannot be spaces.";
    if (/[<>`{}]/.test(formData.title) || /[<>`{}]/.test(formData.body)) return "Invalid characters.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateAnnouncement();
    if (validationError) {
      setNoticeType("error");
      setNotice(validationError);
      return;
    }
    setSubmitting(true);
    setNotice("");
    try {
      await apiRequest("/teacher/announcements", {
        method: "POST",
        body: {
          courseId: formData.courseId,
          title: formData.title,
          body: formData.body,
        },
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
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Announcements" description="Post and manage class announcements." />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Announcements" description="Post and manage class announcements." />
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="text-base font-bold text-[#202124] mb-2">Unable to load announcements</h3>
            <p className="text-sm text-[#5F6368] max-w-sm mb-6">{error}</p>
            <Button onClick={refresh} variant="secondary">Try Again</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Announcements"
        description="Post and manage class announcements."
        action={
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Cancel" : "New Announcement"}
          </Button>
        }
      />

      {/* Notice */}
      {notice && (
        <div
          role="alert"
          className={`px-4 py-3 rounded-xl border text-sm font-bold animate-fade-in ${
            noticeType === "success"
              ? "bg-[#E6F4EA] border-[#188038]/20 text-[#188038]"
              : "bg-[#FCE8E6] border-[#D93025]/20 text-[#D93025]"
          }`}
        >
          {notice}
        </div>
      )}

      {/* New Announcement Form */}
      {showForm && (
        <Card className="border-[#1A73E8]/20 animate-slide-down">
          <h3 className="text-base font-black text-[#202124] mb-5 flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#1A73E8]" />
            New Announcement
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <select
              className="dn-input"
              value={formData.courseId || ""}
              onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
              required
              aria-label="Select class"
            >
              <option value="">Select class *</option>
              {(courses || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.subject} — {c.gradeLevel}
                </option>
              ))}
            </select>
            <input
              className="dn-input"
              placeholder="Announcement title *"
              value={formData.title || ""}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              aria-label="Title"
            />
            <textarea
              className="dn-textarea"
              placeholder="Write your announcement here…"
              value={formData.body || ""}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              required
              rows={4}
              aria-label="Announcement body"
            />
            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={submitting}>
                <Bell className="w-4 h-4" />
                {submitting ? "Posting…" : "Post Announcement"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setShowForm(false); setFormData({}); }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Announcement List */}
      {announcements.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No announcements yet"
          description="Announcements you post will appear here for students to see."
        />
      ) : (
        <div className="space-y-3">
          {announcements.map((item) => (
            <Card key={item.id}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-[#202124]">{item.title}</h4>
                  <p className="text-sm text-[#5F6368] mt-2 leading-relaxed">{item.body}</p>
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <Badge color="primary">{item.courseTitle || item.courseCode}</Badge>
                    <span className="text-xs text-[#9AA0A6] font-bold">{item.authorName}</span>
                    {item.createdAt && (
                      <span className="text-xs text-[#9AA0A6] font-bold">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    )}
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
