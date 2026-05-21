import { useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import { PageHeader, Card, Button, Skeleton, EmptyState } from "../../components/ui";
import { BookOpen, FileText, Sparkles, Upload, FileSignature, X, Loader2 } from "lucide-react";
import { apiRequest } from "../../api.js";

export default function TeacherClasses() {
  const dashboard = useAppStore((s) => s.dashboard);
  const loading = !dashboard;
  const classes = dashboard?.courses || [];
  
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizTopic, setQuizTopic] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);

  const handleGenerateQuiz = async () => {
    if (!selectedCourse || !quizTopic) return;
    setIsGenerating(true);
    setGeneratedQuiz(null);
    try {
      const data = await apiRequest(`/teacher/courses/${selectedCourse}/quizzes/generate`, {
        method: "POST",
        body: JSON.stringify({ topic: quizTopic })
      });
      if (data.ok && data.quiz) {
        setGeneratedQuiz(data.quiz);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate quiz. The AI might be busy.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="My Classes" 
        description="Manage your assigned instructional courses and pedagogical materials." 
        action={<Button>Create Class</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
          ) : classes.length === 0 ? (
            <EmptyState 
              icon={BookOpen} 
              title="No Classes Yet" 
              description="You have not been assigned to any instructional classes." 
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classes.map((cls) => (
                <Card key={cls.id || Math.random()} className="hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-danilo-text">{cls.name || cls.subject || 'Untitled Class'}</h3>
                      <p className="text-sm text-danilo-text-secondary">{cls.code || 'NO CODE'}</p>
                    </div>
                    <span className="px-2 py-1 bg-danilo-bg-secondary text-xs font-medium rounded-md text-danilo-text-secondary">
                      {cls.students || 0} students
                    </span>
                  </div>
                  <p className="text-sm text-danilo-text-secondary flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> {cls.schedule || 'TBA'}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button variant="secondary" className="flex-1">View Details</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <Card className="bg-gradient-to-br from-danilo-primary/5 to-purple-500/5 border-danilo-primary/20 sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-danilo-primary" />
              <h3 className="text-lg font-bold text-danilo-text">Teacher AI Tools</h3>
            </div>
            <p className="text-sm text-danilo-text-secondary mb-6">
              Generate lesson materials, quizzes, and summaries instantly from your PDFs.
            </p>
            
            <div className="space-y-3">
              <Button variant="secondary" className="w-full justify-start gap-3 bg-white hover:bg-danilo-bg-secondary">
                <Upload className="w-4 h-4 text-blue-500" />
                Upload PDF for Summary
              </Button>
              <Button 
                variant="secondary" 
                className="w-full justify-start gap-3 bg-white hover:bg-danilo-bg-secondary"
                onClick={() => setShowQuizModal(true)}
              >
                <FileSignature className="w-4 h-4 text-orange-500" />
                Generate Quiz from Notes
              </Button>
              <Button variant="secondary" className="w-full justify-start gap-3 bg-white hover:bg-danilo-bg-secondary">
                <FileText className="w-4 h-4 text-green-500" />
                Draft Lesson Plan
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {showQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-danilo-primary" /> 
                AI Assessment Generator
              </h3>
              <button onClick={() => setShowQuizModal(false)} className="text-gray-500 hover:bg-gray-100 p-1 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {!generatedQuiz ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Target Class</label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                    >
                      <option value="">-- Choose Class --</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name || c.subject}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Topic or Lecture Notes</label>
                    <textarea 
                      className="w-full p-3 border rounded-md min-h-[150px]"
                      placeholder="e.g., The water cycle and its three main stages..."
                      value={quizTopic}
                      onChange={(e) => setQuizTopic(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <h4 className="font-bold text-xl">{generatedQuiz.title}</h4>
                  {generatedQuiz.questions?.map((q, idx) => (
                    <Card key={idx} className="bg-gray-50 border-none shadow-sm">
                      <p className="font-bold mb-3">{idx + 1}. {q.question}</p>
                      <div className="space-y-2 pl-4">
                        {q.choices?.map((choice, cidx) => (
                          <div key={cidx} className={`p-2 rounded ${choice === q.answerKey ? 'bg-green-100 font-medium text-green-800' : 'bg-white border'}`}>
                            {choice}
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t flex justify-end gap-3 bg-gray-50">
              <Button variant="secondary" onClick={() => setShowQuizModal(false)}>Close</Button>
              {!generatedQuiz ? (
                <Button 
                  onClick={handleGenerateQuiz} 
                  disabled={!selectedCourse || !quizTopic || isGenerating}
                  className="gap-2"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isGenerating ? 'Generating...' : 'Generate 5-Item Quiz'}
                </Button>
              ) : (
                <Button onClick={() => setGeneratedQuiz(null)}>Generate Another</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
