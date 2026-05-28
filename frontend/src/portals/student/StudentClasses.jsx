import { useState } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";
import { useApi } from "../../hooks/useApi";
import { apiRequest, apiUrl } from "../../api";
import { Card, PageHeader, Skeleton, EmptyState, Badge, Button } from "../../components/ui";
import {
  BookOpen, Users, Clock, ArrowLeft, FileText, ClipboardList,
  HelpCircle, MessageSquare, Download, ChevronRight,
} from "lucide-react";

/* ── Subject color palette — cycling for variety ────────── */
const SUBJECT_COLORS = [
  { bg: "bg-[#E8F0FE]", text: "text-[#1A73E8]" },
  { bg: "bg-[#E6F4EA]", text: "text-[#188038]" },
  { bg: "bg-[#FEF7E0]", text: "text-[#E37400]" },
  { bg: "bg-[#F3E8FD]", text: "text-[#7B1FA2]" },
  { bg: "bg-[#FCE8E6]", text: "text-[#D93025]" },
];

function colorForIdx(idx) {
  return SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
}

/* ── Class List ───────────────────────────────────────────── */
function ClassList() {
  const dashboard = useAppStore((s) => s.dashboard);
  const navigate = useNavigate();
  const loading = !dashboard;
  const courses = dashboard?.courses || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="My Classes"
        description="Browse your enrolled subjects and course materials."
      />
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-52" />)}
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {courses.map((cls, idx) => {
            const colors = colorForIdx(idx);
            return (
              <Card
                key={cls.id}
                className="flex flex-col cursor-pointer group"
                hover
                onClick={() => navigate(`/student/classes/${cls.id}`)}
              >
                {/* Color bar accent */}
                <div className={`w-full h-1.5 rounded-full mb-4 ${colors.bg}`} />
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.bg} ${colors.text}`}
                  >
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <Badge color="primary">{cls.term}</Badge>
                </div>
                <h3 className="text-base font-black text-[#202124] leading-tight">{cls.subject}</h3>
                <p className="text-sm text-[#5F6368] font-bold mt-0.5 dn-line-clamp-2">{cls.title}</p>
                <div className="mt-auto pt-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-[#9AA0A6] font-bold">
                    <Users className="w-3.5 h-3.5" />
                    <span>{cls.teacherName || "TBA"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#9AA0A6] font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{cls.gradeLevel}{cls.strand ? ` · ${cls.strand}` : ""}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-black text-[#1A73E8] mt-4 pt-4 border-t border-[#E0E0E0] group-hover:gap-2 transition-all">
                  Open class <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No classes yet"
          description="You are not currently enrolled in any courses. Please consult your academic adviser."
        />
      )}
    </div>
  );
}

/* ── Class Detail ─────────────────────────────────────────── */
function ClassDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const token = useAppStore((s) => s.token);
  const { data: course, loading: courseLoading } = useApi(`/classes/${courseId}`, { immediate: !!courseId });
  const { data: classwork, loading: classworkLoading } = useApi(`/classes/${courseId}/classwork`, { immediate: !!courseId });
  const { data: people, loading: peopleLoading } = useApi(`/classes/${courseId}/people`, { immediate: !!courseId });
  const { data: stream, loading: streamLoading } = useApi(`/classes/${courseId}/stream`, { immediate: !!courseId });
  const [activeTab, setActiveTab] = useState("stream");
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [quizError, setQuizError] = useState("");
  const [pdfError, setPdfError] = useState("");
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  if (!courseId) return <ClassList />;

  const openModulePdf = async (module) => {
    setPdfError("");
    try {
      const response = await fetch(apiUrl(module.pdfUrl), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Could not open module PDF.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (err) {
      setPdfError(err.message || "Could not open module PDF.");
    }
  };

  const parseChoices = (choicesJson) => {
    if (!choicesJson) return [];
    try {
      const parsed = JSON.parse(choicesJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return choicesJson.split("\n").map((item) => item.trim()).filter(Boolean);
    }
  };

  const submitQuiz = async (quiz) => {
    setSubmittingQuiz(true);
    setQuizError("");
    try {
      const result = await apiRequest(`/student/quizzes/${quiz.id}/submit`, {
        method: "POST",
        body: { answers: answers[quiz.id] || {} },
      });
      setQuizResult(result);
    } catch (err) {
      setQuizError(err.message || "Could not submit quiz.");
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const TABS = ["stream", "classwork", "people"];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Back link */}
      <button
        onClick={() => navigate("/student/classes")}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-[#5F6368] hover:text-[#1A73E8] transition-colors"
        aria-label="Back to classes"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Classes
      </button>

      {/* Course Header */}
      {courseLoading ? (
        <Skeleton className="h-28" />
      ) : (
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl font-black text-[#202124] leading-tight">{course?.subject}</h1>
              <p className="text-sm text-[#5F6368] font-bold mt-0.5">{course?.title}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge color="primary">{course?.term}</Badge>
                <span className="text-sm text-[#9AA0A6] font-bold">{course?.gradeLevel}</span>
                <span className="text-sm text-[#9AA0A6] font-bold">{course?.teacherName || "TBA"}</span>
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
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`dn-tab ${activeTab === tab ? "active" : ""}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* PDF error */}
      {pdfError && (
        <div
          role="alert"
          className="px-4 py-3 rounded-xl bg-[#FCE8E6] border border-[#D93025]/20 text-sm font-bold text-[#D93025]"
        >
          {pdfError}
        </div>
      )}

      {/* ── Stream Tab ── */}
      {activeTab === "stream" && (
        <div className="space-y-3">
          {streamLoading ? (
            <Skeleton className="h-32" />
          ) : stream?.length > 0 ? (
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
            <EmptyState icon={MessageSquare} title="No stream posts" description="Announcements and updates will appear here." />
          )}
        </div>
      )}

      {/* ── Classwork Tab ── */}
      {activeTab === "classwork" && (
        <div className="space-y-5">
          {/* Modules */}
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <FileText className="w-5 h-5 text-[#1A73E8]" />
              <h3 className="text-base font-black text-[#202124]">Modules</h3>
            </div>
            {classworkLoading ? (
              <Skeleton className="h-24" />
            ) : classwork?.modules?.length > 0 ? (
              <div className="space-y-2">
                {classwork.modules.map((mod) => (
                  <div
                    key={mod.id}
                    className="flex items-center justify-between py-3 px-4 bg-[#F8F9FA] rounded-xl border border-[#E0E0E0]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[#202124] truncate">{mod.title}</h4>
                        <p className="text-xs text-[#9AA0A6] font-bold">Week {mod.week} · {mod.term}</p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => openModulePdf(mod)}>
                      <Download className="w-3.5 h-3.5" />
                      Open PDF
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={FileText} title="No modules" description="Lesson modules will appear here once published." />
            )}
          </Card>

          {/* Assignments */}
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <ClipboardList className="w-5 h-5 text-[#E37400]" />
              <h3 className="text-base font-black text-[#202124]">Assignments</h3>
            </div>
            {classworkLoading ? (
              <Skeleton className="h-24" />
            ) : classwork?.assignments?.length > 0 ? (
              <div className="space-y-2">
                {classwork.assignments.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between py-3 px-4 bg-[#F8F9FA] rounded-xl border border-[#E0E0E0]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#FEF7E0] text-[#E37400] flex items-center justify-center flex-shrink-0">
                        <ClipboardList className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[#202124] truncate">{a.title}</h4>
                        <p className="text-xs text-[#9AA0A6] font-bold">{a.points} pts</p>
                      </div>
                    </div>
                    <Badge color={a.submission ? "success" : "warning"}>
                      {a.submission ? a.submission.status : "Not started"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={ClipboardList} title="No assignments" description="Assignments will appear here once published." />
            )}
          </Card>

          {/* Quizzes */}
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <HelpCircle className="w-5 h-5 text-[#7B1FA2]" />
              <h3 className="text-base font-black text-[#202124]">Quizzes</h3>
            </div>
            {classworkLoading ? (
              <Skeleton className="h-24" />
            ) : classwork?.quizzes?.length > 0 ? (
              <div className="space-y-3">
                {classwork.quizzes.map((q) => (
                  <div key={q.id} className="bg-[#F8F9FA] rounded-xl border border-[#E0E0E0] overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#F3E8FD] text-[#7B1FA2] flex items-center justify-center flex-shrink-0">
                          <HelpCircle className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-[#202124] truncate">{q.title}</h4>
                          <p className="text-xs text-[#9AA0A6] font-bold">{q.questions?.length || 0} questions</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge color={q.attempt ? "success" : "secondary"}>
                          {q.attempt ? `${q.attempt.score}%` : "Not taken"}
                        </Badge>
                        {!q.attempt && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setActiveQuiz(activeQuiz === q.id ? null : q.id);
                              setQuizResult(null);
                              setQuizError("");
                            }}
                          >
                            Take Quiz
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Quiz Questions Panel */}
                    {activeQuiz === q.id && !q.attempt && (
                      <div className="border-t border-[#E0E0E0] p-4 space-y-5 bg-white">
                        {q.instructions && (
                          <p className="text-sm text-[#5F6368] leading-relaxed">{q.instructions}</p>
                        )}
                        {q.questions?.map((question, index) => {
                          const choices = parseChoices(question.choicesJson);
                          return (
                            <div key={question.id} className="space-y-3">
                              <p className="text-sm font-bold text-[#202124]">
                                {index + 1}. {question.questionText}
                              </p>
                              {choices.length > 0 ? (
                                <div className="space-y-2">
                                  {choices.map((choice) => (
                                    <label
                                      key={choice}
                                      className="flex items-center gap-2.5 text-sm text-[#5F6368] cursor-pointer font-bold hover:text-[#202124] transition-colors"
                                    >
                                      <input
                                        type="radio"
                                        name={`quiz-${q.id}-${question.id}`}
                                        value={choice}
                                        checked={(answers[q.id]?.[question.id] || "") === choice}
                                        onChange={(e) =>
                                          setAnswers((prev) => ({
                                            ...prev,
                                            [q.id]: { ...(prev[q.id] || {}), [question.id]: e.target.value },
                                          }))
                                        }
                                        className="accent-[#1A73E8]"
                                      />
                                      {choice}
                                    </label>
                                  ))}
                                </div>
                              ) : (
                                <input
                                  className="dn-input"
                                  placeholder="Your answer…"
                                  value={answers[q.id]?.[question.id] || ""}
                                  onChange={(e) =>
                                    setAnswers((prev) => ({
                                      ...prev,
                                      [q.id]: { ...(prev[q.id] || {}), [question.id]: e.target.value },
                                    }))
                                  }
                                />
                              )}
                            </div>
                          );
                        })}
                        {quizError && (
                          <p className="text-sm font-bold text-[#D93025]" role="alert">{quizError}</p>
                        )}
                        {quizResult ? (
                          <div className="px-4 py-3 bg-[#E6F4EA] border border-[#188038]/20 rounded-xl text-sm font-bold text-[#188038]">
                            ✓ Submitted! Score: {quizResult.score}% ({quizResult.earnedPoints}/{quizResult.totalPoints} pts)
                          </div>
                        ) : (
                          <Button size="sm" onClick={() => submitQuiz(q)} disabled={submittingQuiz}>
                            {submittingQuiz ? "Submitting…" : "Submit Quiz"}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={HelpCircle} title="No quizzes" description="Quizzes will appear here once published." />
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
          {peopleLoading ? (
            <Skeleton className="h-24" />
          ) : (
            <div className="space-y-5">
              {/* Teacher */}
              {people?.teacher && (
                <div>
                  <p className="text-xs font-black text-[#1A73E8] uppercase tracking-wide mb-3">Teacher</p>
                  <div className="flex items-center gap-3 p-4 bg-[#E8F0FE]/40 rounded-xl border border-[#1A73E8]/15">
                    <div className="w-10 h-10 rounded-full bg-[#1A73E8] text-white flex items-center justify-center font-black text-sm flex-shrink-0">
                      {people.teacher.fullName?.charAt(0)?.toUpperCase() || "T"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#202124]">{people.teacher.fullName}</p>
                      <p className="text-xs text-[#9AA0A6] font-bold">{people.teacher.email}</p>
                    </div>
                  </div>
                </div>
              )}
              {/* Students */}
              {people?.students?.length > 0 && (
                <div>
                  <p className="text-xs font-black text-[#9AA0A6] uppercase tracking-wide mb-3">
                    Students ({people.students.length})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {people.students.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center gap-3 py-2.5 px-4 bg-[#F8F9FA] rounded-xl border border-[#E0E0E0]"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center font-black text-xs flex-shrink-0">
                          {s.fullName?.charAt(0)?.toUpperCase() || "S"}
                        </div>
                        <p className="text-sm text-[#202124] font-bold truncate">{s.fullName}</p>
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

export default function StudentClasses() {
  return (
    <Routes>
      <Route path="/" element={<ClassList />} />
      <Route path=":courseId/*" element={<ClassDetail />} />
    </Routes>
  );
}
