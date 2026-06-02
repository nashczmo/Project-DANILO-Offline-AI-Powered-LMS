import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";
import { useApi } from "../../hooks/useApi";
import { apiRequest, apiUrl } from "../../api";
import { Card, PageHeader, Skeleton, EmptyState, Badge, Button, MathText } from "../../components/ui";
import {
  BookOpen, Users, Clock, ArrowLeft, FileText, ClipboardList,
  HelpCircle, MessageSquare, Download, ChevronRight, TrendingUp, ChevronUp, ChevronDown, PieChart, Activity, GraduationCap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Utilities ────────────────────────────────────────────── */
function getScoreColor(score, maxScore) {
  if (!maxScore) return "text-[#202124]";
  const pct = (score / maxScore) * 100;
  if (pct >= 85) return "text-[#188038]";
  if (pct >= 70) return "text-[#1A73E8]";
  if (pct >= 60) return "text-[#E37400]";
  return "text-[#D93025]";
}

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

/* ── Grade Trend Chart ────────────────────────────────────── */
function GradeTrendChart({ dataPoints }) {
  if (!dataPoints || dataPoints.length === 0) return null;
  const w = 400;
  const h = 120;
  const padX = 30;
  const padY = 20;
  
  const minVal = Math.min(60, ...dataPoints.map(d => d.value)) - 5;
  const maxVal = 100;
  
  const getX = (i) => padX + (i * ((w - padX * 2) / Math.max(1, dataPoints.length - 1)));
  const getY = (val) => h - padY - ((val - minVal) / (maxVal - minVal)) * (h - padY * 2);
  
  const pathData = dataPoints.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.value)}`).join(' ');

  return (
    <div className="w-full overflow-x-auto bg-[#F8F9FA] rounded-2xl p-4 border border-[#E0E0E0]">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-[#1A73E8]" />
        <h4 className="text-sm font-black text-[#202124]">Performance Trend</h4>
      </div>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="overflow-visible">
        {[75, 85, 95].map(tick => (
          <g key={tick}>
            <line x1={padX} y1={getY(tick)} x2={w - padX} y2={getY(tick)} stroke="#E0E0E0" strokeDasharray="4 4" />
            <text x={padX - 5} y={getY(tick) + 3} fontSize="10" fill="#9AA0A6" textAnchor="end" fontWeight="bold">{tick}</text>
          </g>
        ))}
        <motion.path d={pathData} fill="none" stroke="#1A73E8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeInOut" }} />
        {dataPoints.map((d, i) => (
          <g key={i}>
            <motion.circle cx={getX(i)} cy={getY(d.value)} r="4" fill="#fff" stroke="#1A73E8" strokeWidth="2" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1 + i * 0.1 }} />
            <text x={getX(i)} y={h} fontSize="10" fill="#5F6368" textAnchor="middle" fontWeight="bold">{d.label}</text>
            <text x={getX(i)} y={getY(d.value) - 10} fontSize="10" fill="#1A73E8" textAnchor="middle" fontWeight="black">{d.value.toFixed(1)}</text>
          </g>
        ))}
      </svg>
    </div>
  );
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
                <div className={`w-full h-1.5 rounded-full mb-4 ${colors.bg}`} />
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.bg} ${colors.text}`}>
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <Badge color="primary">{cls.term}</Badge>
                </div>
                <h3 className="text-base font-black text-[#202124] leading-tight"><MathText text={cls.subject} /></h3>
                <p className="text-sm text-[#5F6368] font-bold mt-0.5 dn-line-clamp-2"><MathText text={cls.title} /></p>
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
  const [searchParams] = useSearchParams();
  const token = useAppStore((s) => s.token);
  
  const { data: course, loading: courseLoading } = useApi(`/classes/${courseId}`, { immediate: !!courseId });
  const { data: classwork, loading: classworkLoading } = useApi(`/classes/${courseId}/classwork`, { immediate: !!courseId });
  const { data: people, loading: peopleLoading } = useApi(`/classes/${courseId}/people`, { immediate: !!courseId });
  const { data: stream, loading: streamLoading } = useApi(`/classes/${courseId}/stream`, { immediate: !!courseId });
  const { data: gradesData } = useApi("/student/grades", { immediate: !!courseId });
  
  const initialTab = searchParams.get("tab") || "stream";
  const [activeTab, setActiveTab] = useState(initialTab);
  
  useEffect(() => {
    if (searchParams.get("tab")) setActiveTab(searchParams.get("tab"));
  }, [searchParams]);

  const [activeQuiz, setActiveQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [quizError, setQuizError] = useState("");
  const [pdfError, setPdfError] = useState("");
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [expandedAssessments, setExpandedAssessments] = useState({});

  if (!courseId) return <ClassList />;

  const toggleAssessment = (id) => {
    setExpandedAssessments(prev => ({ ...prev, [id]: !prev[id] }));
  };

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

  const TABS = ["stream", "classwork", "people", "grades"];

  return (
    <div className="space-y-5 animate-fade-in">
      <button
        onClick={() => navigate("/student/classes")}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-[#5F6368] hover:text-[#1A73E8] transition-colors"
        aria-label="Back to classes"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Classes
      </button>

      {courseLoading ? (
        <Skeleton className="h-28" />
      ) : (
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl font-black text-[#202124] leading-tight"><MathText text={course?.subject} /></h1>
              <p className="text-sm text-[#5F6368] font-bold mt-0.5"><MathText text={course?.title} /></p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge color="primary">{course?.term}</Badge>
                <span className="text-sm text-[#9AA0A6] font-bold">{course?.gradeLevel}</span>
                <span className="text-sm text-[#9AA0A6] font-bold">{course?.teacherName || "Not Assigned"}</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
        </Card>
      )}

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

      {pdfError && (
        <div role="alert" className="px-4 py-3 rounded-xl bg-[#FCE8E6] border border-[#D93025]/20 text-sm font-bold text-[#D93025]">
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
                  <div key={mod.id} className="flex items-center justify-between py-3 px-4 bg-[#F8F9FA] rounded-xl border border-[#E0E0E0]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[#202124] truncate"><MathText text={mod.title} /></h4>
                        <p className="text-xs text-[#9AA0A6] font-bold">Week {mod.week} · {mod.term}</p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => openModulePdf(mod)}>
                      <Download className="w-3.5 h-3.5" /> Open PDF
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={FileText} title="No modules" description="Lesson modules will appear here once published." />
            )}
          </Card>

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
                  <div key={a.id} className="flex items-center justify-between py-3 px-4 bg-[#F8F9FA] rounded-xl border border-[#E0E0E0]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#FEF7E0] text-[#E37400] flex items-center justify-center flex-shrink-0">
                        <ClipboardList className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[#202124] truncate"><MathText text={a.title} /></h4>
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
                          <h4 className="text-sm font-bold text-[#202124] truncate"><MathText text={q.title} /></h4>
                          <p className="text-xs text-[#9AA0A6] font-bold">{q.questions?.length || 0} questions</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge color={q.attempt ? "success" : "secondary"}>
                          {q.attempt ? `${q.attempt.score}%` : "Not taken"}
                        </Badge>
                        {!q.attempt && (
                          <Button size="sm" variant="secondary" onClick={() => { setActiveQuiz(activeQuiz === q.id ? null : q.id); setQuizResult(null); setQuizError(""); }}>
                            Take Quiz
                          </Button>
                        )}
                      </div>
                    </div>

                    {activeQuiz === q.id && !q.attempt && (
                      <div className="border-t border-[#E0E0E0] p-4 space-y-5 bg-white">
                        {q.instructions && <p className="text-sm text-[#5F6368] leading-relaxed"><MathText text={q.instructions} /></p>}
                        {q.questions?.map((question, index) => {
                          const choices = parseChoices(question.choicesJson);
                          return (
                            <div key={question.id} className="space-y-3">
                              <p className="text-sm font-bold text-[#202124]">{index + 1}. <MathText text={question.questionText} /></p>
                              {choices.length > 0 ? (
                                <div className="space-y-2">
                                  {choices.map((choice) => (
                                    <label key={choice} className="flex items-center gap-2.5 text-sm text-[#5F6368] cursor-pointer font-bold hover:text-[#202124] transition-colors">
                                      <input type="radio" name={`quiz-${q.id}-${question.id}`} value={choice} checked={(answers[q.id]?.[question.id] || "") === choice} onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: { ...(prev[q.id] || {}), [question.id]: e.target.value } }))} className="accent-[#1A73E8]" />
                                      <MathText text={choice} />
                                    </label>
                                  ))}
                                </div>
                              ) : (
                                <input className="dn-input" placeholder="Your answer…" value={answers[q.id]?.[question.id] || ""} onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: { ...(prev[q.id] || {}), [question.id]: e.target.value } }))} />
                              )}
                            </div>
                          );
                        })}
                        {quizError && <p className="text-sm font-bold text-[#D93025]" role="alert">{quizError}</p>}
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
              {people?.students?.length > 0 && (
                <div>
                  <p className="text-xs font-black text-[#9AA0A6] uppercase tracking-wide mb-3">Students ({people.students.length})</p>
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
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* ── Grades Tab (Drill-Down View) ── */}
      {activeTab === "grades" && (() => {
        // Find subject data from grades API
        const sGrades = gradesData || [];
        const mySubjectGradesAllTerms = sGrades.filter(g => g.courseId === courseId);
        const mySubjectGrade = mySubjectGradesAllTerms[mySubjectGradesAllTerms.length - 1];
        
        if (!gradesData || classworkLoading) return <Skeleton className="h-64" />;
        
        const finalGradeVal = mySubjectGrade?.finalGrade || null;

        const trendData = mySubjectGradesAllTerms.map(g => ({
          label: g.term,
          value: g.finalGrade
        }));

        const dynamicAssignments = [];
        if (classwork?.assignments) {
          classwork.assignments.forEach(a => {
            if (!a.submission || a.submission.status !== "graded") return;
            
            const partsMap = {};
            a.questions?.forEach(q => {
              const secName = q.sectionName || "General Section";
              if (!partsMap[secName]) {
                partsMap[secName] = { name: secName, score: 0, max: 0 };
              }
              partsMap[secName].max += (q.points || 1);
              
              let isCorrect = false;
              if (a.submission?.answersJson) {
                try {
                  const answers = typeof a.submission.answersJson === 'string' ? JSON.parse(a.submission.answersJson) : a.submission.answersJson;
                  const given = String(answers[q.id] || answers[String(q.id)] || "").trim().toLowerCase();
                  const expected = String(q.answerKey || "").trim().toLowerCase();
                  if (expected && given === expected) isCorrect = true;
                } catch (e) {}
              }
              if (isCorrect) partsMap[secName].score += (q.points || 1);
            });
            
            dynamicAssignments.push({
              id: a.id,
              title: a.title,
              type: "Assignment",
              date: a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "Submitted",
              score: a.submission.score || 0,
              max: a.points || 0,
              parts: Object.values(partsMap)
            });
          });
        }
        
        if (classwork?.quizzes) {
          classwork.quizzes.forEach(q => {
            if (!q.attempt) return;
            
            const partsMap = {};
            q.questions?.forEach(quest => {
              const secName = "Quiz Questions";
              if (!partsMap[secName]) {
                partsMap[secName] = { name: secName, score: 0, max: 0 };
              }
              partsMap[secName].max += (quest.points || 1);
              
              let isCorrect = false;
              if (q.attempt?.answersJson) {
                try {
                  const answers = typeof q.attempt.answersJson === 'string' ? JSON.parse(q.attempt.answersJson) : q.attempt.answersJson;
                  const given = String(answers[quest.id] || answers[String(quest.id)] || "").trim().toLowerCase();
                  const expected = String(quest.answerKey || "").trim().toLowerCase();
                  if (expected && given === expected) isCorrect = true;
                } catch (e) {}
              }
              if (isCorrect) partsMap[secName].score += (quest.points || 1);
            });
            
            dynamicAssignments.push({
              id: `q-${q.id}`,
              title: q.title,
              type: "Quiz",
              date: "Submitted",
              score: q.attempt.score || 0,
              max: q.questions?.reduce((acc, quest) => acc + (quest.points || 1), 0) || 100,
              parts: Object.values(partsMap)
            });
          });
        }

        const components = mySubjectGrade?.components || [];

        return (
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-8">
              <GradeTrendChart dataPoints={trendData} />

              <div className="space-y-4">
                <h3 className="text-base font-black text-[#202124] border-b border-[#E0E0E0] pb-2">Assessment Breakdown</h3>
                {dynamicAssignments.map(a => (
                  <div key={a.id} className="border border-[#E0E0E0] rounded-2xl overflow-hidden bg-white">
                    <button
                      onClick={() => toggleAssessment(a.id)}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#F8F9FA] transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-black text-[#202124]"><MathText text={a.title} /></p>
                          <p className="text-xs font-bold text-[#9AA0A6] mt-0.5">{a.type} · {a.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-black text-[#188038]">{a.score} / {a.max}</p>
                          <p className="text-xs font-bold text-[#9AA0A6]">{Math.round((a.score/a.max)*100)}%</p>
                        </div>
                        {expandedAssessments[a.id] ? <ChevronUp className="w-5 h-5 text-[#9AA0A6]" /> : <ChevronDown className="w-5 h-5 text-[#9AA0A6]" />}
                      </div>
                    </button>
                    
                    <AnimatePresence>
                      {expandedAssessments[a.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden bg-[#F8F9FA] border-t border-[#E0E0E0]"
                        >
                          <div className="p-5 space-y-3">
                            <p className="text-xs font-black text-[#5F6368] uppercase tracking-wide mb-3">Score by Section</p>
                            {a.parts.map((p, i) => (
                              <div key={i} className="flex items-center justify-between bg-white p-3 rounded-xl border border-[#E0E0E0]">
                                <span className="text-sm font-bold text-[#202124]">{p.name}</span>
                                <Badge color={p.score >= p.max * 0.75 ? "success" : "warning"}>
                                  {p.score} / {p.max} pts
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full md:w-72 flex-shrink-0">
              <div className="bg-[#F8F9FA] rounded-2xl p-5 border border-[#E0E0E0] sticky top-24">
                <div className="flex items-center gap-2 mb-5">
                  <PieChart className="w-5 h-5 text-[#1A73E8]" />
                  <h3 className="text-sm font-black text-[#202124]">Current Standing</h3>
                </div>

                <div className="space-y-4">
                  {components.map((comp, idx) => {
                    const mappedIcon = comp.component.includes("Written") ? FileText : comp.component.includes("Performance") ? Activity : GraduationCap;
                    const IconCmp = mappedIcon;
                    return (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-[#E0E0E0]">
                        <div className="flex items-center gap-2 mb-2">
                          <IconCmp className="w-4 h-4 text-[#9AA0A6]" />
                          <span className="text-xs font-black text-[#5F6368] uppercase tracking-wide">{comp.component}</span>
                        </div>
                        <div className="flex items-end justify-between">
                          <div>
                            <span className={`text-2xl font-black ${getScoreColor(comp.score, comp.maxScore)}`}>{comp.score}</span>
                            <span className="text-sm font-bold text-[#9AA0A6]"> / {comp.maxScore}</span>
                          </div>
                          <Badge color="secondary">{Math.round(comp.weight * 100)}% Wgt</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-5 border-t border-[#E0E0E0]">
                  <p className="text-xs font-black text-[#9AA0A6] uppercase tracking-wide mb-1">Final Grade</p>
                  <p className={`text-4xl font-black ${getScoreColor(finalGradeVal, 100)}`}>
                    {finalGradeVal ? finalGradeVal.toFixed(2) : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
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
