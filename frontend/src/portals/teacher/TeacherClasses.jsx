import { useAppStore } from "../../store/useAppStore";
import { PageHeader, Card, Button, Skeleton, EmptyState } from "../../components/ui";
import { BookOpen, FileText, Sparkles, Upload, FileSignature } from "lucide-react";

export default function TeacherClasses() {
  const dashboard = useAppStore((s) => s.dashboard);
  const loading = !dashboard;
  const classes = dashboard?.courses || [];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="My Classes" 
        description="Manage your assigned courses and materials." 
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
              description="You have not been assigned to any classes." 
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
              <Button variant="secondary" className="w-full justify-start gap-3 bg-white hover:bg-danilo-bg-secondary">
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
    </div>
  );
}
