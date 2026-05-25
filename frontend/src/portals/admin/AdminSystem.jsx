import { useState } from "react";
import { useApi } from "../../hooks/useApi";
import { apiRequest } from "../../api";
import { Card, PageHeader, Skeleton, EmptyState, Badge, Button } from "../../components/ui";
import { Settings, Cpu, Wifi, BookOpen, Plus, Trash2, Server } from "lucide-react";

export default function AdminSystem() {
  const { data: overview, loading, error, refresh } = useApi("/admin/overview", { immediate: true });
  const { data: sections, refresh: refreshSections } = useApi("/admin/sections", { immediate: true });
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("error");

  const handleCreateSection = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setNotice("");
    try {
      await apiRequest("/admin/sections", {
        method: "POST",
        body: {
          name: formData.name,
          gradeLevel: formData.gradeLevel,
          educationLevel: formData.educationLevel || "Junior High School",
          strand: formData.strand || undefined,
          schoolYear: formData.schoolYear || "2026-2027",
        },
      });
      setShowSectionForm(false);
      setFormData({});
      refreshSections();
      setNoticeType("success");
      setNotice("Section created successfully.");
    } catch (err) {
      setNoticeType("error");
      setNotice(err.message || "Could not create section.");
    } finally {
      setSubmitting(false);
    }
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

  const system = overview?.system || {};

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
              <span className="text-sm font-medium text-danilo-text font-mono">{system.portalUrl || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-danilo-bg-secondary rounded-xl border border-danilo-border">
              <div className="flex items-center gap-3">
                <Wifi className="w-4 h-4 text-danilo-text-secondary" />
                <span className="text-sm text-danilo-text">WiFi SSID</span>
              </div>
              <span className="text-sm font-medium text-danilo-text font-mono">{system.wifiSsid || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-danilo-bg-secondary rounded-xl border border-danilo-border">
              <div className="flex items-center gap-3">
                <Cpu className="w-4 h-4 text-danilo-text-secondary" />
                <span className="text-sm text-danilo-text">AI Runtime</span>
              </div>
              <Badge color="success">{system.aiRuntime || "N/A"}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-danilo-bg-secondary rounded-xl border border-danilo-border">
              <div className="flex items-center gap-3">
                <Cpu className="w-4 h-4 text-danilo-text-secondary" />
                <span className="text-sm text-danilo-text">AI Model</span>
              </div>
              <span className="text-sm font-medium text-danilo-text font-mono">{system.aiModel || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-danilo-bg-secondary rounded-xl border border-danilo-border">
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4 text-danilo-text-secondary" />
                <span className="text-sm text-danilo-text">Mode</span>
              </div>
              <Badge color="primary">{system.mode || "N/A"}</Badge>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="dn-title">Sections</h3>
            <Button size="sm" onClick={() => setShowSectionForm(!showSectionForm)}><Plus className="w-4 h-4" /> Section</Button>
          </div>

          {showSectionForm && (
            <form onSubmit={handleCreateSection} className="space-y-3 mb-4">
              <input className="dn-input" placeholder="Section Name" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              <input className="dn-input" placeholder="Grade Level (e.g. Grade 7)" value={formData.gradeLevel || ""} onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })} required />
              <input className="dn-input" placeholder="Education Level" value={formData.educationLevel || ""} onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })} />
              <input className="dn-input" placeholder="Strand (optional)" value={formData.strand || ""} onChange={(e) => setFormData({ ...formData, strand: e.target.value })} />
              <input className="dn-input" placeholder="School Year" value={formData.schoolYear || ""} onChange={(e) => setFormData({ ...formData, schoolYear: e.target.value })} />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Creating..." : "Create"}</Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowSectionForm(false)}>Cancel</Button>
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
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteSection(sec.id)}><Trash2 className="w-3.5 h-3.5 text-danilo-error" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
