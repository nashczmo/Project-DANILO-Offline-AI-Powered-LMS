import { useState } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import { useApi } from "../../hooks/useApi";
import { apiRequest } from "../../api";
import { Card, PageHeader, Skeleton, EmptyState, Badge, Button } from "../../components/ui";
import { BookOpen, Users, ArrowLeft, FileText, ClipboardList, MessageSquare, Plus } from "lucide-react";

function ClassList() {
  const { data, loading, error, refresh } = useApi("/teacher/courses", { immediate: true });
  const navigate = useNavigate();
  const courses = data || [];
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.subject?.trim()) {
      setNotice("Class name and subject are required.");
      return;
    }
    setSubmitting(true);
    setNotice("");
    try {
      const created = await apiRequest("/teacher/courses", {
        method: "POST",
        body: {
          code: formData.code || `${formData.subject.slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-5)}`,
          title: formData.title,
          subject: formData.subject,
          educationLevel: formData.educationLevel || "Junior High School",
          gradeLevel: formData.gradeLevel || "Grade 7",
          quarter: formData.quarter || "Q1",
          schoolYear: formData.schoolYear || "2026-2027",
        },
      });
      setFormData({});
      setShowCreateForm(false);
      refresh();
      navigate(`/teacher/classes/${created.id}`);
    } catch (err) {
      setNotice(err.message || "Could not create class.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Classes" description="Manage your instructional sections." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Classes" description="Manage your instructional sections." />
        <Card>
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <h3 className="text-lg font-semibold text-danilo-text mb-2">Unable to load classes</h3>
            <p className="text-sm text-danilo-text-secondary max-w-sm mb-6">{error}</p>
            <Button onClick={refresh} variant="secondary">Try Again</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Classes" description="Manage your instructional sections." action={<Button size="sm" onClick={() => setShowCreateForm(!showCreateForm)}><Plus className="w-4 h-4" /> Create Class</Button>} />
      {notice && <div className="p-3 rounded-xl bg-danilo-error-subtle border border-danilo-error/20 text-sm text-danilo-error font-medium">{notice}</div>}
      {showCreateForm && (
        <Card>
          <form onSubmit={handleCreateClass} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input className="dn-input" placeholder="Class name" value={formData.title || ""} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            <input className="dn-input" placeholder="Subject" value={formData.subject || ""} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required />
            <input className="dn-input" placeholder="Class code (optional)" value={formData.code || ""} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
            <select className="dn-input" value={formData.educationLevel || "Junior High School"} onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}>
              <option value="Elementary">Elementary</option>
              <option value="Junior High School">Junior High</option>
              <option value="Senior High School">Senior High</option>
              <option value="College">College</option>
            </select>
            <input className="dn-input" placeholder="Grade level" value={formData.gradeLevel || ""} onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })} />
            <select className="dn-input" value={formData.quarter || "Q1"} onChange={(e) => setFormData({ ...formData, quarter: e.target.value })}>
              <option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option>
            </select>
            <div className="sm:col-span-2 lg:col-span-3 flex gap-2">
              <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Creating..." : "Create"}</Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowCreateForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}
      {courses.length === 0 ? (
        <EmptyState icon={BookOpen} title="No classes assigned" description="You have not been assigned to any classes yet." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((cls) => (
            <Card key={cls.id} className="flex flex-col cursor-pointer" hover onClick={() => navigate(`/teacher/classes/${cls.id}`)}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <BookOpen className="w-5 h-5" />
                </div>
                <Badge color="primary">{cls.quarter}</Badge>
              </div>
              <h3 className="dn-heading-md mb-1">{cls.subject}</h3>
              <p className="text-sm text-danilo-text-secondary mb-4">{cls.title}</p>
              <div className="mt-auto space-y-2">
                <div className="flex items-center gap-2 text-sm text-danilo-text-secondary">
                  <Users className="w-4 h-4" />
                  <span>{cls.studentTotal || 0} students</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-danilo-text-secondary">
                  <FileText className="w-4 h-4" />
                  <span>{cls.moduleTotal || 0} modules</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ClassDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { data: course, loading: courseLoading } = useApi(`/classes/${courseId}`, { immediate: !!courseId });
  const { data: classwork, loading: classworkLoading, refresh: refreshClasswork } = useApi(`/classes/${courseId}/classwork`, { immediate: !!courseId });
  const { data: people, loading: peopleLoading } = useApi(`/classes/${courseId}/people`, { immediate: !!courseId });
  const { data: stream, loading: streamLoading, refresh: refreshStream } = useApi(`/classes/${courseId}/stream`, { immediate: !!courseId });
  const [activeTab, setActiveTab] = useState("stream");
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  if (!courseId) return <ClassList />;

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      await apiRequest(`/teacher/courses/${courseId}/announcements`, {
        method: "POST",
        body: { title: formData.title, body: formData.body },
      });
      setShowAnnouncementForm(false);
      setFormData({});
      refreshStream();
    } catch (err) {
      setFormError(err.message || "Could not post announcement.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      await apiRequest(`/teacher/courses/${courseId}/assignments`, {
        method: "POST",
        body: { title: formData.assignmentTitle, instructions: formData.assignmentInstructions, points: parseFloat(formData.assignmentPoints) || 100 },
      });
      setShowAssignmentForm(false);
      setFormData({});
      refreshClasswork();
      refreshStream();
    } catch (err) {
      setFormError(err.message || "Could not create assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateModule = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      await apiRequest(`/teacher/courses/${courseId}/modules`, {
        method: "POST",
        body: { title: formData.moduleTitle, summary: formData.moduleSummary, essentialQuestion: formData.moduleQuestion || "What will you learn?", content: formData.moduleContent },
      });
      setShowModuleForm(false);
      setFormData({});
      refreshClasswork();
    } catch (err) {
      setFormError(err.message || "Could not create module.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate("/teacher/classes")} className="inline-flex items-center gap-1.5 text-sm text-danilo-text-secondary hover:text-danilo-text transition-colors mb-2">
        <ArrowLeft className="w-4 h-4" /> Back to Classes
      </button>

      {courseLoading ? (
        <Skeleton className="h-24" />
      ) : (
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="dn-heading-lg">{course?.subject}</h1>
              <p className="dn-subtitle mt-1">{course?.title}</p>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <Badge color="primary">{course?.quarter}</Badge>
                <span className="text-sm text-danilo-text-secondary">{course?.gradeLevel}</span>
                <span className="text-sm text-danilo-text-secondary">{course?.educationLevel}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="dn-tabs">
        {["stream", "classwork", "people"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`dn-tab ${activeTab === tab ? "active" : ""}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {formError && (
        <div className="p-3 rounded-xl bg-danilo-error-subtle border border-danilo-error/20 text-sm text-danilo-error font-medium">
          {formError}
        </div>
      )}

      {activeTab === "stream" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="dn-title">Stream</h3>
            <Button size="sm" onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}>
              <Plus className="w-4 h-4" /> Announcement
            </Button>
          </div>
          {showAnnouncementForm && (
            <Card>
              <form onSubmit={handleCreateAnnouncement} className="space-y-3">
                <input className="dn-input" placeholder="Title" value={formData.title || ""} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                <textarea className="dn-textarea" placeholder="Body" value={formData.body || ""} onChange={(e) => setFormData({ ...formData, body: e.target.value })} required />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Posting..." : "Post"}</Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setShowAnnouncementForm(false)}>Cancel</Button>
                </div>
              </form>
            </Card>
          )}
          {streamLoading ? <Skeleton className="h-32" /> : stream?.length > 0 ? (
            stream.map((item) => (
              <Card key={item.id}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-danilo-primary-subtle text-danilo-primary flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-danilo-text text-sm">{item.title}</h4>
                    <p className="text-sm text-danilo-text-secondary mt-1">{item.body}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="dn-caption">{item.authorName}</span>
                      <Badge color="secondary">{item.postType}</Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <EmptyState icon={MessageSquare} title="No stream posts" description="Announcements will appear here." />
          )}
        </div>
      )}

      {activeTab === "classwork" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="dn-title">Modules</h3>
            <Button size="sm" onClick={() => setShowModuleForm(!showModuleForm)}><Plus className="w-4 h-4" /> Module</Button>
          </div>
          {showModuleForm && (
            <Card>
              <form onSubmit={handleCreateModule} className="space-y-3">
                <input className="dn-input" placeholder="Title" value={formData.moduleTitle || ""} onChange={(e) => setFormData({ ...formData, moduleTitle: e.target.value })} required />
                <textarea className="dn-textarea" placeholder="Summary" value={formData.moduleSummary || ""} onChange={(e) => setFormData({ ...formData, moduleSummary: e.target.value })} required />
                <textarea className="dn-textarea" placeholder="Essential Question" value={formData.moduleQuestion || ""} onChange={(e) => setFormData({ ...formData, moduleQuestion: e.target.value })} />
                <textarea className="dn-textarea" placeholder="Content" value={formData.moduleContent || ""} onChange={(e) => setFormData({ ...formData, moduleContent: e.target.value })} />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Creating..." : "Create"}</Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setShowModuleForm(false)}>Cancel</Button>
                </div>
              </form>
            </Card>
          )}
          {classworkLoading ? <Skeleton className="h-24" /> : classwork?.modules?.length > 0 ? (
            <div className="space-y-3">
              {classwork.modules.map((mod) => (
                <div key={mod.id} className="p-4 bg-danilo-bg-secondary rounded-xl border border-danilo-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><FileText className="w-4 h-4" /></div>
                    <div>
                      <h4 className="font-semibold text-danilo-text text-sm">{mod.title}</h4>
                      <p className="dn-caption">Week {mod.week} {mod.quarter}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={FileText} title="No modules" description="Lesson modules will appear here." />
          )}

          <div className="flex items-center justify-between">
            <h3 className="dn-title">Assignments</h3>
            <Button size="sm" onClick={() => setShowAssignmentForm(!showAssignmentForm)}><Plus className="w-4 h-4" /> Assignment</Button>
          </div>
          {showAssignmentForm && (
            <Card>
              <form onSubmit={handleCreateAssignment} className="space-y-3">
                <input className="dn-input" placeholder="Title" value={formData.assignmentTitle || ""} onChange={(e) => setFormData({ ...formData, assignmentTitle: e.target.value })} required />
                <textarea className="dn-textarea" placeholder="Instructions" value={formData.assignmentInstructions || ""} onChange={(e) => setFormData({ ...formData, assignmentInstructions: e.target.value })} required />
                <input className="dn-input" type="number" placeholder="Points" value={formData.assignmentPoints || ""} onChange={(e) => setFormData({ ...formData, assignmentPoints: e.target.value })} />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Creating..." : "Create"}</Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setShowAssignmentForm(false)}>Cancel</Button>
                </div>
              </form>
            </Card>
          )}
          {classworkLoading ? <Skeleton className="h-24" /> : classwork?.assignments?.length > 0 ? (
            <div className="space-y-3">
              {classwork.assignments.map((a) => (
                <div key={a.id} className="p-4 bg-danilo-bg-secondary rounded-xl border border-danilo-border flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-danilo-warning-subtle text-danilo-warning flex items-center justify-center"><ClipboardList className="w-4 h-4" /></div>
                    <div>
                      <h4 className="font-semibold text-danilo-text text-sm">{a.title}</h4>
                      <p className="dn-caption">{a.points} points</p>
                    </div>
                  </div>
                  <Badge color={a.isActive ? "success" : "secondary"}>{a.isActive ? "Active" : "Inactive"}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={ClipboardList} title="No assignments" description="Assignments will appear here." />
          )}
        </div>
      )}

      {activeTab === "people" && (
        <Card>
          <h3 className="dn-title mb-4">Class Roster</h3>
          {peopleLoading ? <Skeleton className="h-24" /> : (
            <div className="space-y-4">
              {people?.students?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-danilo-text-muted mb-2">Students ({people.students.length})</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {people.students.map((s) => (
                      <div key={s.id} className="flex items-center gap-3 p-3 bg-danilo-bg-secondary rounded-xl border border-danilo-border">
                        <div className="w-8 h-8 rounded-full bg-danilo-bg-tertiary text-danilo-text-secondary flex items-center justify-center font-bold text-xs">{s.fullName?.charAt(0) || "S"}</div>
                        <p className="text-sm text-danilo-text font-medium">{s.fullName}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export default function TeacherClasses() {
  return (
    <Routes>
      <Route path="/" element={<ClassList />} />
      <Route path=":courseId/*" element={<ClassDetail />} />
    </Routes>
  );
}
