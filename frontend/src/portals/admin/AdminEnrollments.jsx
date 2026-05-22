import { useState, useEffect } from 'react';
import { useRef } from 'react';
import { Upload, Users, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Card, PageHeader, Button, EmptyState } from '../../components/ui';
import { apiUpload } from '../../api.js';

export default function AdminEnrollments() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleProcessFile = async () => {
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await apiUpload('/admin/enrollments', { formData });
      if (res.ok) {
        alert("Batch enrollment processed successfully!");
        setFile(null);
      }
    } catch (err) {
      alert("Enrollment processing failed: " + err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Batch Enrollments" 
        description="Upload CSV files to batch enroll users into academic courses and sections."
      />

      <Card className="max-w-3xl mx-auto">
        {!file ? (
          <div 
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
              isDragging ? 'border-danilo-primary bg-blue-50' : 'border-danilo-border hover:bg-danilo-bg-secondary'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-danilo-border mx-auto mb-4">
              <Upload className="w-8 h-8 text-danilo-primary" />
            </div>
            <h3 className="dn-title mb-2">Upload CSV File</h3>
            <p className="text-sm text-danilo-text-secondary max-w-sm mx-auto mb-6">
              Drag and drop your enrollment CSV file here, or click to browse from your computer.
            </p>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".csv" 
              className="hidden" 
            />
            <div className="flex justify-center gap-4">
              <Button variant="primary" onClick={() => fileInputRef.current?.click()}>Browse Files</Button>
              <Button variant="secondary" onClick={() => alert("CSV headers required: CourseCode, Username")}>Download Template</Button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <EmptyState 
              icon={FileSpreadsheet}
              title="File Ready for Processing"
              description={`You have selected ${file.name}. Click process to initiate batch enrollment.`}
              action={
                <div className="flex gap-4">
                  <Button variant="ghost" onClick={() => { setFile(null); if(fileInputRef.current) fileInputRef.current.value = ""; }} disabled={isUploading}>Cancel</Button>
                  <Button variant="primary" onClick={handleProcessFile} disabled={isUploading} className="gap-2">
                    {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isUploading ? "Processing..." : "Process File"}
                  </Button>
                </div>
              }
            />
          </div>
        )}
      </Card>

      <div className="max-w-3xl mx-auto mt-8">
        <h3 className="dn-title mb-4">Recent Batch Jobs</h3>
        <EmptyState 
          icon={Users}
          title="No recent enrollments"
          description="Batch enrollment history will be documented here upon completion."
        />
      </div>
    </div>
  );
}
