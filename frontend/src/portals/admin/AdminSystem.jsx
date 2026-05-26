import { useEffect, useState } from "react";
import { useApi } from "../../hooks/useApi";
import { apiRequest } from "../../api";
import { Card, PageHeader, Skeleton, EmptyState, Badge, Button } from "../../components/ui";
import { Settings, Cpu, Wifi, BookOpen, Plus, Trash2, Server } from "lucide-react";

export default function AdminSystem() {
  const { data: systemStatus, loading, error, refresh } = useApi("/admin/system", { immediate: true });
  const { data: activity, refresh: refreshActivity } = useApi("/admin/activity", { immediate: true });
  const { data: sections, refresh: refreshSections } = useApi("/admin/sections", { immediate: true });
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("error");

  useEffect(() => {
    const timer = setInterval(() => {
      refresh();
      refreshActivity();
    }, 15000);
    return () => clearInterval(timer);
  }, [refresh, refreshActivity]);

  const handleSaveSection = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.gradeLevel?.trim()) {
      setNoticeType("error");
      setNotice("Section name and grade level are required.");
      return;
    }
    setSubmitting(true);
    setNotice("");
    try {
      await apiRequest(editingSectionId ? `/admin/sections/${editingSectionId}` : "/admin/sections", {
        method: editingSectionId ? "PUT" : "POST",
        body: {
          name: formData.name,
          gradeLevel: formData.gradeLevel,
          educationLevel: formData.educationLevel || "Junior High School",
          strand: formData.strand || undefined,
          schoolYear: formData.schoolYear || "2026-2027",
        },
      });
      setShowSectionForm(false);
      setEditingSectionId(null);
      setFormData({});
      refreshSections();
      setNoticeType("success");
      setNotice(editingSectionId ? "Section updated successfully." : "Section created successfully.");
    } catch (err) {
      setNoticeType("error");
      setNotice(err.message || "Could not create section.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSection = (section) => {
    setEditingSectionId(section.id);
    setFormData({
      name: section.name,
      gradeLevel: section.gradeLevel,
      educationLevel: section.educationLevel,
      strand: section.strand || "",
      schoolYear: section.schoolYear || "",
    });
    setShowSectionForm(true);
  };

  const handleDeleteSection = async (id) => {
    if (!confirm("Are you sure you want to deactivate this section?")) return;
    try {
      await apiRequest(`/admin/sections/${id}`, { method: "DELETE" });
      refreshSections();
      setNoticeType("success");
      setNotice("Section deactivated.");
    } catch (err) {
      setNoticeType("error");
      setNotice(err.message || "Could not deactivate section.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="System Management" description="Manage platform settings and sections." />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="System Management" description="Manage platform settings and sections." />
        <Card>
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <h3 className="text-lg font-semibold text-danilo-text mb-2">Unable to load system data</h3>
            <p className="text-sm text-danilo-text-secondary max-w-sm mb-6">{error}</p>
            <Button onClick={refresh} variant="secondary">Try Again</Button>
          </div>
        </Card>
      </div>
    );
  }

  const healthRows = [
    { label: "Backend", value: systemStatus ? "healthy" : "reconnecting", color: systemStatus ? "success" : "warning" },
    { label: "Database", value: systemStatus?.database === "connected" ? "healthy" : "unhealthy", color: systemStatus?.database === "connected" ? "success" : "error" },
    { label: "Gateway / Frontend", value: "healthy", color: "success" },
    { label: "Ollama", value: systemStatus?.ollama === "online" ? "healthy" : systemStatus?.ollama === "degraded" ? "reconnecting" : "unhealthy", color: systemStatus?.ollama === "online" ? "success" : systemStatus?.ollama === "degraded" ? "warning" : "error" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="System Management" description="Manage platform settings and sections." />

      {notice && (
        <div className={`p-3 rounded-xl border text-sm font-medium ${
          noticeType === "success"
            ? "bg-danilo-success-subtle border-danilo-success/20 text-danilo-success"
            : "bg-danilo-error-subtle border-danilo-error/20 text-danilo-error"
        }`}>
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="dn-title mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-danilo-bg-secondary rounded-xl border border-danilo-border">
              <div className="flex items-center gap-3">
                <Server className="w-4 h-4 text-danilo-text-secondary" />
                <span className="text-sm text-danilo-text">Portal URL</span>
              </div>
              <span className="text-sm font-medium text-danilo-text font-mono">{systemStatus?.portalUrl || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-danilo-bg-secondary rounded-xl border border-danilo-border">
              <div className="flex items-center gap-3">
                <Wifi className="w-4 h-4 text-danilo-text-secondary" />
                <span className="text-sm text-danilo-text">WiFi SSID</span>
              </div>
              <span className="text-sm font-medium text-danilo-text font-mono">{systemStatus?.wifiSsid || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-danilo-bg-secondary rounded-xl border border-danilo-border">
              <div className="flex items-center gap-3">
                <Cpu className="w-4 h-4 text-danilo-text-secondary" />
                <span className="text-sm text-danilo-text">AI Runtime</span>
              </div>
              <Badge color={systemStatus?.ollama === "online" ? "success" : "warning"}>{systemStatus?.aiRuntime || "N/A"}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-danilo-bg-secondary rounded-xl border border-danilo-border">
              <div className="flex items-center gap-3">
                <Cpu className="w-4 h-4 text-danilo-text-secondary" />
                <span className="text-sm text-danilo-text">AI Model</span>
              </div>
              <span className="text-sm font-medium text-danilo-text font-mono">{systemStatus?.activeModel || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-danilo-bg-secondary rounded-xl border border-danilo-border">
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4 text-danilo-text-secondary" />
                <span className="text-sm text-danilo-text">Mode</span>
              </div>
              <Badge color="primary">{systemStatus?.mode || "N/A"}</Badge>
            </div>
            {healthRows.map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-danilo-bg-secondary rounded-xl border border-danilo-border">
                <span className="text-sm text-danilo-text">{item.label}</span>
                <Badge color={item.color}>{item.value}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="dn-title">Sections</h3>
            <Button size="sm" onClick={() => { setEditingSectionId(null); setFormData({}); setShowSectionForm(!showSectionForm); }}><Plus className="w-4 h-4" /> Section</Button>
          </div>

          {showSectionForm && (
            <form onSubmit={handleSaveSection} className="space-y-3 mb-4">
              <input className="dn-input" placeholder="Section Name" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              <input className="dn-input" placeholder="Grade Level (e.g. Grade 7)" value={formData.gradeLevel || ""} onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })} required />
              <input className="dn-input" placeholder="Education Level" value={formData.educationLevel || ""} onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })} />
              <input className="dn-input" placeholder="Strand (optional)" value={formData.strand || ""} onChange={(e) => setFormData({ ...formData, strand: e.target.value })} />
              <input className="dn-input" placeholder="School Year" value={formData.schoolYear || ""} onChange={(e) => setFormData({ ...formData, schoolYear: e.target.value })} />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Saving..." : editingSectionId ? "Save" : "Create"}</Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => { setShowSectionForm(false); setEditingSectionId(null); }}>Cancel</Button>
              </div>
            </form>
          )}

          {(sections || []).length === 0 ? (
            <EmptyState icon={BookOpen} title="No sections" description="Sections will appear here once created." />
          ) : (
            <div className="space-y-2">
              {(sections || []).map((sec) => (
                <div key={sec.id} className="flex items-center justify-between p-3 bg-danilo-bg-secondary rounded-xl border border-danilo-border">
                  <div>
                    <p className="text-sm font-medium text-danilo-text">{sec.name}</p>
                    <p className="dn-caption">{sec.gradeLevel} {sec.educationLevel} {sec.schoolYear}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color="primary">{sec.studentCount} students</Badge>
                    <Button variant="ghost" size="sm" onClick={() => handleEditSection(sec)}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteSection(sec.id)}><Trash2 className="w-3.5 h-3.5 text-danilo-error" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <h3 className="dn-title mb-4">Live Activity</h3>
        {(activity || []).length === 0 ? (
          <EmptyState icon={Server} title="No activity yet" description="Logins and classroom changes will appear here." />
        ) : (
          <div className="space-y-2">
            {(activity || []).slice(0, 12).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-danilo-bg-secondary rounded-xl border border-danilo-border">
                <div>
                  <p className="text-sm font-medium text-danilo-text">{item.action?.replaceAll("_", " ")}</p>
                  <p className="dn-caption">{item.actorName} {item.details}</p>
                </div>
                <span className="dn-caption">{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
