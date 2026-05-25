import { useState } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";
import { useApi } from "../../hooks/useApi";
import { apiRequest, apiUrl } from "../../api";
import { Card, PageHeader, Skeleton, EmptyState, Badge, Button } from "../../components/ui";
import { BookOpen, Users, Clock, ArrowLeft, FileText, ClipboardList, HelpCircle, MessageSquare, Download } from "lucide-react";

function ClassList() {
  const dashboard = useAppStore((s) => s.dashboard);
  const navigate = useNavigate();
  const loading = !dashboard;
  const courses = dashboard?.courses || [];

  return (
    <div className="space-y-6">
      <PageHeader title="My Classes" description="Browse your enrolled subjects and course materials." />
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {courses.map((cls) => (
            <Card
              key={cls.id}
              className="flex flex-col cursor-pointer"
              hover
              onClick={() => navigate(`/student/classes/${cls.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <BookOpen className="w-5 h-5" />
                </div>
                <Badge color="primary">{cls.quarter}</Badge>
              </div>
              <h3 className="dn-heading-md mb-1">{cls.subject}</h3>
              <p className="text-sm text-danilo-text-secondary mb-4">{cls.title}</p>
              <div className="space-y-2 mt-auto">
                <div className="flex items-center gap-2 text-sm text-danilo-text-secondary">
                  <Users className="w-4 h-4" />
                  <span>{cls.teacherName || "TBA"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-danilo-text-secondary">
                  <Clock className="w-4 h-4" />
                  <span>{cls.gradeLevel} {cls.strand ? `(${cls.strand})` : ""}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No classes yet"
          description="You are not currently enrolled in any academic courses. Please consult your academic adviser."
        />
      )}
    </div>
  );
}

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

  const loading = courseLoading || classworkLoading || peopleLoading || streamLoading;

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

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/student/classes")}
        className="inline-flex items-center gap-1.5 text-sm text-danilo-text-secondary hover:text-danilo-text transition-colors mb-2"
      >
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
                <span className="text-sm text-danilo-text-secondary">{course?.teacherName || "TBA"}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="dn-tabs">
        {["stream", "classwork", "people"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`dn-tab ${activeTab === tab ? "active" : ""}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {pdfError && (
        <div className="p-3 rounded-xl bg-danilo-error-subtle border border-danilo-error/20 text-sm text-danilo-error font-medium">
          {pdfError}
        </div>
      )}

      {activeTab === "stream" && (
        <div className="space-y-4">
          {streamLoading ? (
            <Skeleton className="h-32" />
          ) : stream?.length > 0 ? (
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
                      <span className="dn-caption">{item.postType}</span>
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

      {activeTab === "classwork" && (
        <div className="space-y-6">
          <Card>
            <h3 className="dn-title mb-4">Modules</h3>
            {classworkLoading ? (
              <Skeleton className="h-24" />
            ) : classwork?.modules?.length > 0 ? (
              <div className="space-y-3">
                {classwork.modules.map((mod) => (
                  <div key={mod.id} className="p-4 bg-danilo-bg-secondary rounded-xl border border-danilo-border">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-danilo-text text-sm">{mod.title}</h4>
                        <p className="dn-caption">Week {mod.week} {mod.quarter}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Button variant="secondary" size="sm" onClick={() => openModulePdf(mod)}>
                        <Download className="w-3.5 h-3.5" />
                        Open PDF
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={FileText} title="No modules" description="Lesson modules will appear here once published." />
            )}
          </Card>

          <Card>
            <h3 className="dn-title mb-4">Assignments</h3>
            {classworkLoading ? (
              <Skeleton className="h-24" />
            ) : classwork?.assignments?.length > 0 ? (
              <div className="space-y-3">
                {classwork.assignments.map((a) => (
                  <div key={a.id} className="p-4 bg-danilo-bg-secondary rounded-xl border border-danilo-border flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-danilo-warning-subtle text-danilo-warning flex items-center justify-center">
                        <ClipboardList className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-danilo-text text-sm">{a.title}</h4>
                        <p className="dn-caption">{a.points} points</p>
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

          <Card>
            <h3 className="dn-title mb-4">Quizzes</h3>
            {classworkLoading ? (
              <Skeleton className="h-24" />
            ) : classwork?.quizzes?.length > 0 ? (
              <div className="space-y-3">
                {classwork.quizzes.map((q) => (
                  <div key={q.id} className="p-4 bg-danilo-bg-secondary rounded-xl border border-danilo-border">
                    <div className="flex justify-between items-center gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-danilo-purple-subtle text-danilo-purple flex items-center justify-center">
                          <HelpCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-danilo-text text-sm">{q.title}</h4>
                          <p className="dn-caption">{q.questions?.length || 0} questions</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge color={q.attempt ? "success" : "secondary"}>
                          {q.attempt ? `Scored ${q.attempt.score}%` : "Not taken"}
                        </Badge>
                        {!q.attempt && (
                          <Button size="sm" variant="secondary" onClick={() => { setActiveQuiz(activeQuiz === q.id ? null : q.id); setQuizResult(null); setQuizError(""); }}>
                            Take Quiz
                          </Button>
                        )}
                      </div>
                    </div>
                    {activeQuiz === q.id && !q.attempt && (
                      <div className="mt-4 pt-4 border-t border-danilo-border space-y-4">
                        <p className="text-sm text-danilo-text-secondary">{q.instructions}</p>
                        {q.questions?.map((question, index) => {
                          const choices = parseChoices(question.choicesJson);
                          return (
                            <div key={question.id} className="space-y-2">
                              <p className="text-sm font-medium text-danilo-text">{index + 1}. {question.questionText}</p>
                              {choices.length > 0 ? (
                                <div className="space-y-2">
                                  {choices.map((choice) => (
                                    <label key={choice} className="flex items-center gap-2 text-sm text-danilo-text-secondary">
                                      <input
                                        type="radio"
                                        name={`quiz-${q.id}-${question.id}`}
                                        value={choice}
                                        checked={(answers[q.id]?.[question.id] || "") === choice}
                                        onChange={(e) => setAnswers((prev) => ({
                                          ...prev,
                                          [q.id]: { ...(prev[q.id] || {}), [question.id]: e.target.value },
                                        }))}
                                      />
                                      {choice}
                                    </label>
                                  ))}
                                </div>
                              ) : (
                                <input
                                  className="dn-input"
                                  placeholder="Your answer"
                                  value={answers[q.id]?.[question.id] || ""}
                                  onChange={(e) => setAnswers((prev) => ({
                                    ...prev,
                                    [q.id]: { ...(prev[q.id] || {}), [question.id]: e.target.value },
                                  }))}
                                />
                              )}
                            </div>
                          );
                        })}
                        {quizError && <p className="text-sm text-danilo-error">{quizError}</p>}
                        {quizResult && (
                          <div className="p-3 bg-danilo-success-subtle border border-danilo-success/10 rounded-xl text-sm text-danilo-success font-medium">
                            Submitted. Score: {quizResult.score}% ({quizResult.earnedPoints}/{quizResult.totalPoints})
                          </div>
                        )}
                        <Button size="sm" onClick={() => submitQuiz(q)} disabled={submittingQuiz}>
                          {submittingQuiz ? "Submitting..." : "Submit Quiz"}
                        </Button>
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

      {activeTab === "people" && (
        <Card>
          <h3 className="dn-title mb-4">Class Roster</h3>
          {peopleLoading ? (
            <Skeleton className="h-24" />
          ) : (
            <div className="space-y-4">
              {people?.teacher && (
                <div className="p-4 bg-danilo-primary-subtle rounded-xl border border-danilo-primary/10">
                  <p className="text-xs font-semibold uppercase tracking-wider text-danilo-primary mb-2">Teacher</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-danilo-primary text-white flex items-center justify-center font-bold text-sm">
                      {people.teacher.fullName?.charAt(0) || "T"}
                    </div>
                    <div>
                      <p className="font-semibold text-danilo-text text-sm">{people.teacher.fullName}</p>
                      <p className="dn-caption">{people.teacher.email}</p>
                    </div>
                  </div>
                </div>
              )}
              {people?.students?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-danilo-text-muted mb-2">
                    Students ({people.students.length})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {people.students.map((s) => (
                      <div key={s.id} className="flex items-center gap-3 p-3 bg-danilo-bg-secondary rounded-xl border border-danilo-border">
                        <div className="w-8 h-8 rounded-full bg-danilo-bg-tertiary text-danilo-text-secondary flex items-center justify-center font-bold text-xs">
                          {s.fullName?.charAt(0) || "S"}
                        </div>
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

export default function StudentClasses() {
  return (
    <Routes>
      <Route path="/" element={<ClassList />} />
      <Route path=":courseId/*" element={<ClassDetail />} />
    </Routes>
  );
}
