import { useState, useRef } from "react";
import { useAppStore } from "../../store/useAppStore";
import { PageHeader, Card, Skeleton, EmptyState, Button } from "../../components/ui";
import { FileSpreadsheet, Download, BookOpen, Upload, Loader2 } from "lucide-react";
import { apiUpload } from "../../api.js";

export default function TeacherGrades() {
  const dashboard = useAppStore((s) => s.dashboard);
  const loading = !dashboard;
  const courses = dashboard?.courses || [];
  
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!selectedCourse) {
      alert("Please select a target class before importing.");
      return;
    }
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const data = await apiUpload(`/teacher/courses/${selectedCourse}/grades`, { formData });
      if (data.ok) {
        alert("Grades successfully imported.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to import grades: " + err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImportClick = () => {
    if (courses.length === 0) return alert("You have no classes.");
    if (!selectedCourse) setSelectedCourse(courses[0].id);
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Grades & Assessments" 
        description="Manage academic gradebooks and evaluate student performance." 
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
            description="Academic classes must be assigned prior to managing gradebooks."
          />
        ) : (
          <div className="space-y-6 p-4">
            <div className="flex items-center gap-4 border-b pb-4">
              <label className="dn-label whitespace-nowrap">Select Class:</label>
              <select 
                className="dn-input max-w-md"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                <option value="">-- Choose Class --</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name || c.subject}</option>
                ))}
              </select>
            </div>
            <EmptyState 
              icon={FileSpreadsheet} 
              title="Gradebook is Ready" 
              description="Upload an official CSV grading sheet to bulk-import student grades."
              action={
                <div className="mt-4 flex flex-col items-center">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv,.xlsx" className="hidden" />
                  <Button onClick={handleImportClick} disabled={isUploading || !selectedCourse} className="gap-2">
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {isUploading ? "Importing..." : "Import Grades via CSV"}
                  </Button>
                </div>
              }
            />
          </div>
        )}
      </Card>
    </div>
  );
}
