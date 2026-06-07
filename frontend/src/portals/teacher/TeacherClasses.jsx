import { useState, useRef } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import { useApi } from "../../hooks/useApi";
import { apiRequest, apiUrl } from "../../api";
import { useAppStore } from "../../store/useAppStore";
import { Card, PageHeader, Skeleton, EmptyState, Badge, Button } from "../../components/ui";
import {
  BookOpen, Users, ArrowLeft, FileText, ClipboardList,
  MessageSquare, Plus, X, ChevronRight, UploadCloud, CheckCircle, Save, Sparkles, Loader2
} from "lucide-react";
import TeacherAssignmentGrader from "./TeacherAssignmentGrader";

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
          strand: formData.strand || "",
          term: formData.term || "Term 1",
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
            <select className="dn-input" value={formData.educationLevel || "Junior High School"} onChange={(e) => {
              const val = e.target.value;
              setFormData({ ...formData, educationLevel: val, strand: val !== "Senior High School" ? "" : formData.strand });
            }}>
              <option value="Elementary">Elementary</option>
              <option value="Junior High School">Junior High</option>
              <option value="Senior High School">Senior High</option>
              <option value="College">College</option>
            </select>
            {(formData.educationLevel === "Senior High School") && (
              <select className="dn-input" value={formData.strand || ""} onChange={(e) => setFormData({ ...formData, strand: e.target.value })}>
                <option value="">Select Strand...</option>
                <option value="STEM">STEM</option>
                <option value="ABM">ABM</option>
                <option value="HUMSS">HUMSS</option>
                <option value="GAS">GAS</option>
                <option value="TVL">TVL</option>
                <option value="Arts and Design">Arts and Design</option>
                <option value="Sports">Sports</option>
              </select>
            )}
            <input className="dn-input" placeholder="Grade level (e.g. Grade 7)" value={formData.gradeLevel || ""} onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })} />
            <select className="dn-input" value={formData.term || "Term 1"} onChange={(e) => setFormData({ ...formData, term: e.target.value })}>
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
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
                  <Badge color="primary">{cls.term}</Badge>
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
  const token = useAppStore((s) => s.token);
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
  
  // Assignment Builder State
  const [assignmentType, setAssignmentType] = useState("written_response");
  const [builderQuestions, setBuilderQuestions] = useState([]);
  const [builderAttachments, setBuilderAttachments] = useState([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const builderAttachmentRef = useRef(null);

  // AI Quiz Generator State
  const [file, setFile] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [questionCount, setQuestionCount] = useState("10");
  const [difficulty, setDifficulty] = useState("medium");
  const [questionTypes, setQuestionTypes] = useState("multiple_choice,short_answer");
  const fileInputRef = useRef(null);

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

  const handleUploadAttachment = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !courseId) return;
    setUploadingAttachment(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(apiUrl(`/teacher/courses/${courseId}/assignments/upload`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");
      setBuilderAttachments((prev) => [...prev, { filename: data.filename, url: data.url }]);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setUploadingAttachment(false);
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
          assignmentType,
          questions: builderQuestions,
          attachments: builderAttachments,
        },
      });
      setShowAssignmentForm(false);
      setFormData({});
      setBuilderQuestions([]);
      setBuilderAttachments([]);
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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!courseId || !file) return;
    setGenerating(true);
    setFormError("");
    setGeneratedQuiz(null);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("questionCount", questionCount);
    fd.append("difficulty", difficulty);
    fd.append("questionTypes", questionTypes);

    try {
      const res = await fetch(apiUrl(`/teacher/courses/${courseId}/quizzes/generate-from-file`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to generate quiz.");
      
      setGeneratedQuiz(data.quiz);
    } catch (err) {
      setFormError(err.message || "An error occurred during AI generation.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveQuiz = async () => {
    if (!generatedQuiz || !courseId) return;
    setSavingQuiz(true);
    setFormError("");
    
    try {
      const questions = generatedQuiz.questions.map(q => ({
        questionText: q.question,
        type: q.type || "multiple_choice",
        choices: q.choices || [],
        answerKey: q.answerKey,
        points: q.points || 1
      }));

      await apiRequest(`/teacher/courses/${courseId}/quizzes`, {
        method: "POST",
        body: {
          title: generatedQuiz.title || "AI Generated Quiz",
          instructions: "Please answer all questions based on the uploaded material.",
          isPublished: true,
          questions
        }
      });
      setFormError("");
      setGeneratedQuiz(null);
      setFile(null);
      setActiveTab("classwork"); // Redirect to classwork
      refreshClasswork();
      refreshStream();
    } catch (err) {
      setFormError(err.message || "Could not save the quiz.");
    } finally {
      setSavingQuiz(false);
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
                <Badge color="primary">{course?.term}</Badge>
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
        {["stream", "classwork", "people", "ai quizzes"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`dn-tab ${activeTab === tab ? "active" : ""}`}>
            {tab === "ai quizzes" ? "AI Quizzes" : tab.charAt(0).toUpperCase() + tab.slice(1)}
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
                      <p className="text-xs text-[#9AA0A6] font-bold">Week {mod.week} · {mod.term}</p>
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
                <form onSubmit={handleCreateAssignment} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input className="dn-input" placeholder="Assignment title *" value={formData.assignmentTitle || ""} onChange={(e) => setFormData({ ...formData, assignmentTitle: e.target.value })} required />
                    <select className="dn-input" value={assignmentType} onChange={(e) => setAssignmentType(e.target.value)}>
                      <option value="written_response">Written Response</option>
                      <option value="file_submission">File Submission</option>
                      <option value="quiz">Quiz</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>
                  <textarea className="dn-textarea" placeholder="Instructions *" value={formData.assignmentInstructions || ""} onChange={(e) => setFormData({ ...formData, assignmentInstructions: e.target.value })} required rows={3} />
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-[#202124]">Attachments</h4>
                    <div className="flex flex-wrap gap-2">
                      {builderAttachments.map((att, i) => (
                        <Badge key={i} color="secondary" className="flex items-center gap-1">
                          {att.filename}
                          <button type="button" onClick={() => setBuilderAttachments(prev => prev.filter((_, idx) => idx !== i))}><X className="w-3 h-3" /></button>
                        </Badge>
                      ))}
                    </div>
                    <input type="file" ref={builderAttachmentRef} className="hidden" onChange={handleUploadAttachment} />
                    <Button type="button" variant="secondary" size="sm" disabled={uploadingAttachment} onClick={() => builderAttachmentRef.current?.click()}>
                      <UploadCloud className="w-4 h-4" /> {uploadingAttachment ? "Uploading..." : "Attach File"}
                    </Button>
                  </div>

                  {(assignmentType === "quiz" || assignmentType === "mixed") && (
                    <div className="space-y-3 p-4 bg-white rounded-lg border border-[#E0E0E0]">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-[#202124]">Questions ({builderQuestions.length})</h4>
                        <Button type="button" size="sm" variant="secondary" onClick={() => setBuilderQuestions(prev => [...prev, { type: "multiple_choice", sectionName: "", questionText: "", choices: ["", ""], answerKey: "", points: 1 }])}>
                          <Plus className="w-3 h-3" /> Add Question
                        </Button>
                      </div>
                      {builderQuestions.map((q, idx) => (
                        <div key={idx} className="p-3 bg-[#F8F9FA] rounded-md border border-[#E0E0E0] space-y-2 relative">
                          <button type="button" onClick={() => setBuilderQuestions(prev => prev.filter((_, i) => i !== idx))} className="absolute top-2 right-2 text-[#5F6368] hover:text-[#D93025]"><X className="w-4 h-4" /></button>
                          <select className="dn-input text-sm" value={q.type} onChange={(e) => setBuilderQuestions(prev => prev.map((item, i) => i === idx ? { ...item, type: e.target.value } : item))}>
                            <option value="multiple_choice">Multiple Choice</option>
                            <option value="short_answer">Short Answer</option>
                            <option value="identification">Identification</option>
                            <option value="true_false">True/False</option>
                            <option value="checkbox">Checkbox</option>
                          </select>
                          <input className="dn-input text-sm" placeholder="Section Name (e.g. Section 1: Theory) [Optional]" value={q.sectionName || ""} onChange={(e) => setBuilderQuestions(prev => prev.map((item, i) => i === idx ? { ...item, sectionName: e.target.value } : item))} />
                          <input className="dn-input text-sm" placeholder="Question text" value={q.questionText} onChange={(e) => setBuilderQuestions(prev => prev.map((item, i) => i === idx ? { ...item, questionText: e.target.value } : item))} />
                          {(q.type === "multiple_choice" || q.type === "checkbox" || q.type === "true_false") && (
                            <div className="space-y-1 pl-4 border-l-2 border-[#1A73E8]">
                              {q.choices.map((c, cIdx) => (
                                <input key={cIdx} className="dn-input text-sm py-1" placeholder={`Option ${cIdx + 1}`} value={c} onChange={(e) => setBuilderQuestions(prev => prev.map((item, i) => i === idx ? { ...item, choices: item.choices.map((ch, ci) => ci === cIdx ? e.target.value : ch) } : item))} />
                              ))}
                              {q.type !== "true_false" && (
                                <button type="button" className="text-xs text-[#1A73E8] font-bold" onClick={() => setBuilderQuestions(prev => prev.map((item, i) => i === idx ? { ...item, choices: [...item.choices, ""] } : item))}>+ Add Option</button>
                              )}
                            </div>
                          )}
                          <input className="dn-input text-sm" placeholder="Correct Answer (Exact text or comma-separated for checkbox)" value={q.answerKey} onChange={(e) => setBuilderQuestions(prev => prev.map((item, i) => i === idx ? { ...item, answerKey: e.target.value } : item))} />
                          <input className="dn-input text-sm w-32" type="number" placeholder="Points" value={q.points} onChange={(e) => setBuilderQuestions(prev => prev.map((item, i) => i === idx ? { ...item, points: parseFloat(e.target.value) || 1 } : item))} />
                        </div>
                      ))}
                    </div>
                  )}
                  <input className="dn-input" type="number" placeholder={`Total points (default: ${builderQuestions.length ? builderQuestions.reduce((a,b)=>a+b.points, 0) : 100})`} value={formData.assignmentPoints || ""} onChange={(e) => setFormData({ ...formData, assignmentPoints: e.target.value })} />
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
                  <div key={a.id} onClick={() => navigate(`/teacher/classes/${courseId}/assignments/${a.id}`)} className="flex items-center justify-between py-3 px-4 bg-[#F8F9FA] rounded-xl border border-[#E0E0E0] cursor-pointer hover:border-[#1A73E8]/30 transition-colors">
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

      {/* ── AI Quizzes Tab ── */}
      {activeTab === "ai quizzes" && (
        <div className="space-y-6 animate-fade-in">
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-5 h-5 text-[#1A73E8]" />
              <h3 className="text-base font-black text-[#202124]">Upload Material</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-black text-[#202124] mb-2">Lesson Material</label>
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.txt"
                />
                {file ? (
                  <div className="flex items-center gap-3 p-3 bg-[#E8F0FE] rounded-lg border border-[#1A73E8]/20 w-fit mb-4">
                    <FileText className="w-5 h-5 text-[#1A73E8]" />
                    <span className="text-sm font-bold text-[#1A73E8]">{file.name}</span>
                    <button onClick={() => setFile(null)} className="ml-2 text-[#1A73E8] hover:text-[#1557B0]">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="mb-4">
                    <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={generating || savingQuiz}>
                      <UploadCloud className="w-4 h-4" />
                      Choose File (PDF, DOCX, TXT)
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold text-[#5F6368] mb-1">Number of Questions</label>
                  <select className="dn-input" value={questionCount} onChange={(e) => setQuestionCount(e.target.value)}>
                    <option value="5">5 Questions</option>
                    <option value="10">10 Questions</option>
                    <option value="15">15 Questions</option>
                    <option value="20">20 Questions</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#5F6368] mb-1">Difficulty</label>
                  <select className="dn-input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#5F6368] mb-1">Question Types</label>
                  <select className="dn-input" value={questionTypes} onChange={(e) => setQuestionTypes(e.target.value)}>
                    <option value="multiple_choice">Multiple Choice Only</option>
                    <option value="multiple_choice,true_false">MCQ + True/False</option>
                    <option value="multiple_choice,short_answer">MCQ + Short Answer</option>
                    <option value="multiple_choice,checkbox,identification">Mixed Varied</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <Button onClick={handleGenerateQuiz} disabled={!file || generating || savingQuiz}>
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {generating ? "DANILO is analyzing..." : "Generate Quiz"}
                </Button>
              </div>
            </div>
          </Card>

          {generatedQuiz && (
            <Card className="animate-fade-in border-[#1A73E8]/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-[#202124]">{generatedQuiz.title}</h3>
                <Badge color="success">Ready for Review</Badge>
              </div>

              <div className="space-y-6">
                {generatedQuiz.questions?.map((q, i) => (
                  <div key={i} className="p-4 bg-[#F8F9FA] rounded-xl border border-[#E0E0E0]">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <p className="text-base font-bold text-[#202124]">
                        {i + 1}. {q.question}
                      </p>
                      <Badge>{q.type || "Question"}</Badge>
                    </div>
                    
                    {q.choices && q.choices.length > 0 && (
                      <div className="pl-4 space-y-2 mb-3 border-l-2 border-[#E0E0E0]">
                        {q.choices.map((choice, cIdx) => (
                          <p key={cIdx} className="text-sm text-[#5F6368]">{choice}</p>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-3 pt-3 border-t border-[#E0E0E0]/50 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#188038]" />
                      <span className="text-sm font-bold text-[#188038]">
                        Answer: {Array.isArray(q.answerKey) ? q.answerKey.join(", ") : q.answerKey}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={handleSaveQuiz} disabled={savingQuiz}>
                  <Save className="w-4 h-4" />
                  {savingQuiz ? "Saving..." : "Publish to Class"}
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default function TeacherClasses() {
  return (
    <Routes>
      <Route path="/" element={<ClassList />} />
      <Route path=":courseId/assignments/:assignmentId" element={<TeacherAssignmentGrader />} />
      <Route path=":courseId/*" element={<ClassDetail />} />
    </Routes>
  );
}
