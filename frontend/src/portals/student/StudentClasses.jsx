import { useAppStore } from "../../store/useAppStore";
import { PageHeader, Card, Button, Skeleton, EmptyState } from "../../components/ui";
import { BookOpen, Users, Clock } from "lucide-react";

export default function StudentClasses() {
  const dashboard = useAppStore((s) => s.dashboard);
  const loading = !dashboard;
  const classes = dashboard?.classes || [];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="My Classes" 
        description="Review your enrolled subjects and monitor your MELCs progression."
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {classes.map(cls => (
            <Card key={cls.id} className="flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${cls.color || "bg-blue-100 text-blue-600 border-blue-200"}`}>
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>
              
              <h3 className="dn-heading-md mb-1">{cls.subject}</h3>
              
              <div className="space-y-2 mt-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-danilo-text-secondary">
                  <Users className="w-4 h-4" />
                  <span>{cls.teacher || "TBA"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-danilo-text-secondary">
                  <Clock className="w-4 h-4" />
                  <span>{cls.schedule || "TBA"}</span>
                </div>
              </div>

              <div className="mt-auto">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-danilo-text-secondary">MELCs Progress</span>
                  <span className="text-xs font-bold text-danilo-text">{cls.melcsProgress || 0}%</span>
                </div>
                <div className="w-full bg-danilo-bg-tertiary rounded-full h-2">
                  <div 
                    className="bg-danilo-primary h-2 rounded-full" 
                    style={{ width: `${cls.melcsProgress || 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-danilo-border">
                <Button variant="secondary" className="w-full">
                  View Lessons
                </Button>
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
