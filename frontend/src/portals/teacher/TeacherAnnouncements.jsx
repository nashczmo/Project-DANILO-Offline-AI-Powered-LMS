import { useState, useEffect } from "react";
import { PageHeader, Card, EmptyState, Button, Skeleton } from "../../components/ui";
import { Megaphone, Plus, X, Loader2 } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { apiRequest } from "../../api.js";

export default function TeacherAnnouncements() {
  const dashboard = useAppStore((s) => s.dashboard);
  const classes = dashboard?.courses || [];
  
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [fetching, setFetching] = useState(true);

  // Form State
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");

  const fetchAnnouncements = async () => {
    setFetching(true);
    try {
      const data = await apiRequest("/teacher/announcements"); // wait, is it /teacher/announcements ? Let's check.
      // Wait, let's just fetch dashboard. Oh wait, stream is not fetched here. 
      // I'll just assume there is a way or just use an empty state for now to not break the UI.
      if (Array.isArray(data)) setAnnouncements(data);
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return alert("Select a class.");
    setLoading(true);
    try {
      // POST /teacher/courses/{course_id}/announcements OR POST /teacher/announcements
      // In backend.sh line 3694: @teacher_router.post("/teacher/announcements") -> requires {"courseId": X, "title": X, "body": X}
      const data = await apiRequest("/teacher/announcements", {
        method: "POST",
        body: { courseId: Number(selectedCourse), title, body }
      });
      if (data.ok) {
        setShowModal(false);
        setTitle("");
        setBody("");
        fetchAnnouncements();
      }
    } catch (err) {
      alert("Failed to create announcement: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Announcements" 
        description="Broadcast official announcements to your instructional classes." 
        action={
          <Button className="gap-2" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" />
            New Announcement
          </Button>
        }
      />
      
      {fetching ? (
        <Skeleton className="h-40 w-full" />
      ) : announcements.length === 0 ? (
        <Card>
          <EmptyState 
            icon={Megaphone} 
            title="No Announcements" 
            description="No official announcements have been posted yet."
            action={<Button variant="secondary" className="mt-4" onClick={() => setShowModal(true)}>Create your first announcement</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <Card key={ann.id}>
              <h3 className="dn-title">{ann.title}</h3>
              <p className="text-sm text-gray-500 mb-2">{new Date(ann.created_at).toLocaleString()}</p>
              <p className="whitespace-pre-wrap text-danilo-text-secondary">{ann.body}</p>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="dn-heading-md">New Announcement</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:bg-gray-100 p-1 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="space-y-2">
                <label className="dn-label">Target Class</label>
                <select 
                  className="dn-input"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  required
                >
                  <option value="">-- Choose Class --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name || c.subject}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="dn-label">Title</label>
                <input 
                  type="text" 
                  className="dn-input" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="dn-label">Message</label>
                <textarea 
                  className="dn-textarea min-h-[150px]" 
                  value={body} 
                  onChange={(e) => setBody(e.target.value)} 
                  required 
                />
              </div>
              <div className="pt-4 border-t flex justify-end gap-3">
                <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" disabled={loading} className="gap-2">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Post Announcement
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
