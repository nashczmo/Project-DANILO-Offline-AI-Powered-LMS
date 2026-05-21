import { useState, useEffect } from 'react';
import { Upload, Users, FileSpreadsheet } from 'lucide-react';
import { Card, PageHeader, Button, EmptyState } from '../../components/ui';

export default function AdminEnrollments() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);

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

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Batch Enrollments" 
        description="Upload CSV files to batch enroll users into courses and sections."
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
            <h3 className="text-lg font-bold text-danilo-text mb-2">Upload CSV File</h3>
            <p className="text-sm text-danilo-text-secondary max-w-sm mx-auto mb-6">
              Drag and drop your enrollment CSV file here, or click to browse from your computer.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="primary">Browse Files</Button>
              <Button variant="secondary">Download Template</Button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <EmptyState 
              icon={FileSpreadsheet}
              title="File Ready for Processing"
              description={`You have selected ${file.name}. Click process to begin batch enrollment.`}
              action={
                <div className="flex gap-4">
                  <Button variant="ghost" onClick={() => setFile(null)}>Cancel</Button>
                  <Button variant="primary">Process File</Button>
                </div>
              }
            />
          </div>
        )}
      </Card>

      <div className="max-w-3xl mx-auto mt-8">
        <h3 className="text-lg font-bold mb-4">Recent Batch Jobs</h3>
        <EmptyState 
          icon={Users}
          title="No recent enrollments"
          description="Batch enrollment history will appear here once processed."
        />
      </div>
    </div>
  );
}
