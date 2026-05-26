import { useState } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import { useApi } from "../../hooks/useApi";
import { apiRequest } from "../../api";
import { Card, PageHeader, Skeleton, EmptyState, Badge, Button } from "../../components/ui";
import {
  BookOpen, Users, ArrowLeft, FileText, ClipboardList,
  MessageSquare, Plus, X, ChevronRight,
} from "lucide-react";

const SUBJECT_COLORS = [
  { bg: "bg-[#E8F0FE]", text: "text-[#1A73E8]" },
  { bg: "bg-[#E6F4EA]", text: "text-[#188038]" },
  { bg: "bg-[#FEF7E0]", text: "text-[#E37400]" },
  { bg: "bg-[#F3E8FD]", text: "text-[#7B1FA2]" },
  { bg: "bg-[#FCE8E6]", text: "text-[#D93025]" },
];

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
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="My Classes" description="Manage your instructional sections." />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-52" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Classes" description="Manage your instructional sections." />
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="text-base font-bold text-[#202124] mb-2">Unable to load classes</h3>
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
        title="My Classes"
        description="Manage your instructional sections."
        action={
          <Button onClick={() => { setShowCreateForm(!showCreateForm); setFormData({}); }}>
            {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showCreateForm ? "Cancel" : "Create Class"}
          </Button>
        }
      />

      {notice && (
        <div role="alert" className="px-4 py-3 rounded-xl bg-[#FCE8E6] border border-[#D93025]/20 text-sm font-bold text-[#D93025]">
          {notice}
        </div>
      )}

      {showCreateForm && (
        <Card className="border-[#1A73E8]/20 animate-slide-down">
          <h3 className="text-base font-black text-[#202124] mb-5">Create New Class</h3>
          <form onSubmit={handleCreateClass} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input className="dn-input" placeholder="Class name *" value={formData.title || ""} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            <input className="dn-input" placeholder="Subject *" value={formData.subject || ""} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required />
            <input className="dn-input" placeholder="Class code (auto-generated if empty)" value={formData.code || ""} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
            <select className="dn-input" value={formData.educationLevel || "Junior High School"} onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}>
              <option value="Elementary">Elementary</option>
              <option value="Junior High School">Junior High</option>
              <option value="Senior High School">Senior High</option>
              <option value="College">College</option>
            </select>
            <input className="dn-input" placeholder="Grade level (e.g. Grade 7)" value={formData.gradeLevel || ""} onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })} />
            <select className="dn-input" value={formData.quarter || "Q1"} onChange={(e) => setFormData({ ...formData, quarter: e.target.value })}>
              <option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option>
            </select>
            <div className="sm:col-span-2 lg:col-span-3 flex gap-2 pt-1">
              <Button type="submit" disabled={submitting}>{submitting ? "Creating…" : "Create Class"}</Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreateForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {courses.length === 0 ? (
        <EmptyState icon={BookOpen} title="No classes assigned" description="You have not been assigned to any classes yet." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {courses.map((cls, idx) => {
            const colors = SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
            return (
              <Card
                key={cls.id}
                className="flex flex-col cursor-pointer group"
                hover
                onClick={() => navigate(`/teacher/classes/${cls.id}`)}
              >
                <div className={`w-full h-1.5 rounded-full mb-4 ${colors.bg}`} />
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.bg} ${colors.text}`}>
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <Badge color="primary">{cls.quarter}</Badge>
                </div>
                <h3 className="text-base font-black text-[#202124] leading-tight">{cls.subject}</h3>
                <p className="text-sm text-[#5F6368] font-bold mt-0.5">{cls.title}</p>
                <div className="mt-auto pt-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-[#9AA0A6] font-bold">
                    <Users className="w-3.5 h-3.5" />
                    <span>{cls.studentTotal || 0} students</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#9AA0A6] font-bold">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{cls.moduleTotal || 0} modules</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-black text-[#1A73E8] mt-4 pt-4 border-t border-[#E0E0E0] group-hover:gap-2 transition-all">
                  Manage class <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Card>
            );
          })}
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
        body: {
          title: formData.assignmentTitle,
          instructions: formData.assignmentInstructions,
          points: parseFloat(formData.assignmentPoints) || 100,
        },
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
        body: {
          title: formData.moduleTitle,
          summary: formData.moduleSummary,
          essentialQuestion: formData.moduleQuestion || "What will you learn?",
          content: formData.moduleContent,
        },
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
    <div className="space-y-5 animate-fade-in">
      <button
        onClick={() => navigate("/teacher/classes")}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-[#5F6368] hover:text-[#1A73E8] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Classes
      </button>

      {/* Course Header */}
      {courseLoading ? <Skeleton className="h-28" /> : (
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl font-black text-[#202124] leading-tight">{course?.subject}</h1>
              <p className="text-sm text-[#5F6368] font-bold mt-0.5">{course?.title}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge color="primary">{course?.quarter}</Badge>
                <span className="text-sm text-[#9AA0A6] font-bold">{course?.gradeLevel}</span>
                <span className="text-sm text-[#9AA0A6] font-bold">{course?.educationLevel}</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="dn-tabs">
        {["stream", "classwork", "people"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`dn-tab ${activeTab === tab ? "active" : ""}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {formError && (
        <div role="alert" className="px-4 py-3 rounded-xl bg-[#FCE8E6] border border-[#D93025]/20 text-sm font-bold text-[#D93025]">
          {formError}
        </div>
      )}

      {/* ── Stream Tab ── */}
      {activeTab === "stream" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-[#202124]">Announcements</h3>
            <Button size="sm" onClick={() => { setShowAnnouncementForm(!showAnnouncementForm); setFormData({}); }}>
              {showAnnouncementForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {showAnnouncementForm ? "Cancel" : "Post"}
            </Button>
          </div>
          {showAnnouncementForm && (
            <Card className="border-[#1A73E8]/20 animate-slide-down">
              <form onSubmit={handleCreateAnnouncement} className="space-y-3">
                <input className="dn-input" placeholder="Announcement title *" value={formData.title || ""} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                <textarea className="dn-textarea" placeholder="Write your announcement…" value={formData.body || ""} onChange={(e) => setFormData({ ...formData, body: e.target.value })} required rows={3} />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Posting…" : "Post Announcement"}</Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setShowAnnouncementForm(false)}>Cancel</Button>
                </div>
              </form>
            </Card>
          )}
          {streamLoading ? <Skeleton className="h-32" /> : stream?.length > 0 ? (
            stream.map((item) => (
              <Card key={item.id}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-[#202124]">{item.title}</h4>
                    <p className="text-sm text-[#5F6368] mt-1.5 leading-relaxed">{item.body}</p>
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span className="text-xs text-[#9AA0A6] font-bold">{item.authorName}</span>
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

      {/* ── Classwork Tab ── */}
      {activeTab === "classwork" && (
        <div className="space-y-5">
          {/* Modules */}
          <Card>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#1A73E8]" />
                <h3 className="text-base font-black text-[#202124]">Modules</h3>
              </div>
              <Button size="sm" onClick={() => { setShowModuleForm(!showModuleForm); setFormData({}); }}>
                {showModuleForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {showModuleForm ? "Cancel" : "Add Module"}
              </Button>
            </div>
            {showModuleForm && (
              <div className="mb-5 p-4 bg-[#E8F0FE]/40 rounded-xl border border-[#1A73E8]/15 animate-slide-down space-y-3">
                <form onSubmit={handleCreateModule} className="space-y-3">
                  <input className="dn-input" placeholder="Module title *" value={formData.moduleTitle || ""} onChange={(e) => setFormData({ ...formData, moduleTitle: e.target.value })} required />
                  <textarea className="dn-textarea" placeholder="Summary *" value={formData.moduleSummary || ""} onChange={(e) => setFormData({ ...formData, moduleSummary: e.target.value })} required rows={2} />
                  <textarea className="dn-textarea" placeholder="Essential question" value={formData.moduleQuestion || ""} onChange={(e) => setFormData({ ...formData, moduleQuestion: e.target.value })} rows={2} />
                  <textarea className="dn-textarea" placeholder="Content" value={formData.moduleContent || ""} onChange={(e) => setFormData({ ...formData, moduleContent: e.target.value })} rows={3} />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Creating…" : "Create Module"}</Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => setShowModuleForm(false)}>Cancel</Button>
                  </div>
                </form>
              </div>
            )}
            {classworkLoading ? <Skeleton className="h-24" /> : classwork?.modules?.length > 0 ? (
              <div className="space-y-2">
                {classwork.modules.map((mod) => (
                  <div key={mod.id} className="flex items-center gap-3 py-3 px-4 bg-[#F8F9FA] rounded-xl border border-[#E0E0E0]">
                    <div className="w-9 h-9 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-[#202124] truncate">{mod.title}</h4>
                      <p className="text-xs text-[#9AA0A6] font-bold">Week {mod.week} · {mod.quarter}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={FileText} title="No modules" description="Create a module to add learning content." />
            )}
          </Card>

          {/* Assignments */}
          <Card>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[#E37400]" />
                <h3 className="text-base font-black text-[#202124]">Assignments</h3>
              </div>
              <Button size="sm" onClick={() => { setShowAssignmentForm(!showAssignmentForm); setFormData({}); }}>
                {showAssignmentForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {showAssignmentForm ? "Cancel" : "Add Assignment"}
              </Button>
            </div>
            {showAssignmentForm && (
              <div className="mb-5 p-4 bg-[#FEF7E0]/60 rounded-xl border border-[#E37400]/15 animate-slide-down">
                <form onSubmit={handleCreateAssignment} className="space-y-3">
                  <input className="dn-input" placeholder="Assignment title *" value={formData.assignmentTitle || ""} onChange={(e) => setFormData({ ...formData, assignmentTitle: e.target.value })} required />
                  <textarea className="dn-textarea" placeholder="Instructions *" value={formData.assignmentInstructions || ""} onChange={(e) => setFormData({ ...formData, assignmentInstructions: e.target.value })} required rows={3} />
                  <input className="dn-input" type="number" placeholder="Total points (default: 100)" value={formData.assignmentPoints || ""} onChange={(e) => setFormData({ ...formData, assignmentPoints: e.target.value })} />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Creating…" : "Create Assignment"}</Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => setShowAssignmentForm(false)}>Cancel</Button>
                  </div>
                </form>
              </div>
            )}
            {classworkLoading ? <Skeleton className="h-24" /> : classwork?.assignments?.length > 0 ? (
              <div className="space-y-2">
                {classwork.assignments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-3 px-4 bg-[#F8F9FA] rounded-xl border border-[#E0E0E0]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#FEF7E0] text-[#E37400] flex items-center justify-center flex-shrink-0">
                        <ClipboardList className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[#202124] truncate">{a.title}</h4>
                        <p className="text-xs text-[#9AA0A6] font-bold">{a.points} pts</p>
                      </div>
                    </div>
                    <Badge color={a.isActive ? "success" : "secondary"}>{a.isActive ? "Active" : "Inactive"}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={ClipboardList} title="No assignments" description="Create an assignment for your students." />
            )}
          </Card>
        </div>
      )}

      {/* ── People Tab ── */}
      {activeTab === "people" && (
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-5 h-5 text-[#1A73E8]" />
            <h3 className="text-base font-black text-[#202124]">Class Roster</h3>
          </div>
          {peopleLoading ? <Skeleton className="h-24" /> : (
            <div className="space-y-4">
              {people?.students?.length > 0 ? (
                <>
                  <p className="text-xs font-black text-[#9AA0A6] uppercase tracking-wide">
                    Students ({people.students.length})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {people.students.map((s) => (
                      <div key={s.id} className="flex items-center gap-3 py-2.5 px-4 bg-[#F8F9FA] rounded-xl border border-[#E0E0E0]">
                        <div className="w-8 h-8 rounded-full bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center font-black text-xs flex-shrink-0">
                          {s.fullName?.charAt(0)?.toUpperCase() || "S"}
                        </div>
                        <p className="text-sm text-[#202124] font-bold truncate">{s.fullName}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState icon={Users} title="No students" description="Students will appear here once enrolled." />
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
