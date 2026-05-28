import { useState, useRef } from "react";
import { useApi } from "../../hooks/useApi";
import { apiRequest, apiUrl } from "../../api";
import { useAppStore } from "../../store/useAppStore";
import { Card, PageHeader, Button, Badge } from "../../components/ui";
import { UploadCloud, FileText, CheckCircle, Save, Sparkles, Loader2, X } from "lucide-react";

export default function TeacherAIQuizzes() {
  const token = useAppStore((s) => s.token);
  const { data: courses, loading: coursesLoading } = useApi("/teacher/courses", { immediate: true });
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [file, setFile] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("error");
  
  const fileInputRef = useRef(null);
  const activeCourses = courses || [];

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleGenerate = async () => {
    if (!selectedCourseId || !file) return;
    setGenerating(true);
    setNotice("");
    setGeneratedQuiz(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(apiUrl(`/teacher/courses/${selectedCourseId}/quizzes/generate-from-file`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to generate quiz.");
      
      setGeneratedQuiz(data.quiz);
    } catch (err) {
      setNoticeType("error");
      setNotice(err.message || "An error occurred during AI generation.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveQuiz = async () => {
    if (!generatedQuiz || !selectedCourseId) return;
    setSaving(true);
    setNotice("");
    
    try {
      // Map frontend structure to backend schema for /teacher/courses/{course_id}/quizzes
      const questions = generatedQuiz.questions.map(q => ({
        questionText: q.question,
        choicesJson: q.choices ? JSON.stringify(q.choices) : null,
        answerKey: Array.isArray(q.answerKey) ? JSON.stringify(q.answerKey) : String(q.answerKey),
        points: q.points || 1
      }));

      await apiRequest(`/teacher/courses/${selectedCourseId}/quizzes`, {
        method: "POST",
        body: {
          title: generatedQuiz.title || "AI Generated Quiz",
          instructions: "Please answer all questions based on the uploaded material.",
          isPublished: true,
          questions
        }
      });
      setNoticeType("success");
      setNotice("Quiz successfully saved and published to the class.");
      setGeneratedQuiz(null);
      setFile(null);
    } catch (err) {
      setNoticeType("error");
      setNotice(err.message || "Could not save the quiz.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="AI Quiz Generator"
        description="Upload your lesson material (PDF, DOCX) and let DANILO generate a quiz instantly."
      />

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

      <Card>
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="w-5 h-5 text-[#1A73E8]" />
          <h3 className="text-base font-black text-[#202124]">Upload Material</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-black text-[#202124] mb-2">Select Class</label>
            <select
              className="dn-input max-w-md"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              disabled={generating || saving}
            >
              <option value="" disabled>Choose a class…</option>
              {activeCourses.map((c) => (
                <option key={c.id} value={c.id}>{c.subject} — {c.gradeLevel}</option>
              ))}
            </select>
          </div>

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
              <div className="flex items-center gap-3 p-3 bg-[#E8F0FE] rounded-lg border border-[#1A73E8]/20 w-fit">
                <FileText className="w-5 h-5 text-[#1A73E8]" />
                <span className="text-sm font-bold text-[#1A73E8]">{file.name}</span>
                <button onClick={() => setFile(null)} className="ml-2 text-[#1A73E8] hover:text-[#1557B0]">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={generating || saving}>
                <UploadCloud className="w-4 h-4" />
                Choose File (PDF, DOCX, TXT)
              </Button>
            )}
          </div>

          <div className="pt-2">
            <Button onClick={handleGenerate} disabled={!selectedCourseId || !file || generating || saving}>
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
            <Button onClick={handleSaveQuiz} disabled={saving}>
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Publish to Class"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
