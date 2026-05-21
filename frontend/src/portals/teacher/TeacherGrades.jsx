import { useAppStore } from "../../store/useAppStore";
import { PageHeader, Card, Skeleton, EmptyState, Button } from "../../components/ui";
import { FileSpreadsheet, Download, BookOpen } from "lucide-react";

export default function TeacherGrades() {
  const dashboard = useAppStore((s) => s.dashboard);
  const loading = !dashboard;
  const courses = dashboard?.courses || [];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Grades & Assessments" 
        description="Manage gradebooks and student performance." 
        action={
          <Button variant="secondary" className="gap-2" disabled={loading || courses.length === 0}>
            <Download className="w-4 h-4" />
            Export Grades
          </Button>
        }
      />
      
      <Card>
        {loading ? (
          <div className="p-8 flex flex-col items-center justify-center space-y-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        ) : courses.length === 0 ? (
          <EmptyState 
            icon={BookOpen} 
            title="No Classes Yet" 
            description="You need to have classes assigned before you can manage grades."
          />
        ) : (
          <EmptyState 
            icon={FileSpreadsheet} 
            title="Gradebook is Empty" 
            description="Select a class to start entering grades or import a grading sheet."
            action={<Button className="mt-4">Import Grades</Button>}
          />
        )}
      </Card>
    </div>
  );
}
