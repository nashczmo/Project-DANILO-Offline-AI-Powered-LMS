import { PageHeader, Card, EmptyState, Button } from "../../components/ui";
import { Megaphone, Plus } from "lucide-react";

export default function TeacherAnnouncements() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Announcements" 
        description="Broadcast official announcements to your instructional classes." 
        action={
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Announcement
          </Button>
        }
      />
      
      <Card>
        <EmptyState 
          icon={Megaphone} 
          title="No Announcements" 
          description="No official announcements have been posted yet."
          action={<Button variant="secondary" className="mt-4">Create your first announcement</Button>}
        />
      </Card>
    </div>
  );
}
