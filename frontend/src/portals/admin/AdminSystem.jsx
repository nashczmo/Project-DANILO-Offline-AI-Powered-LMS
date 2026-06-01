import { useEffect, useState } from "react";
import { useApi } from "../../hooks/useApi";
import { apiRequest } from "../../api";
import { Card, PageHeader, Skeleton, EmptyState, Badge, Button } from "../../components/ui";
import { Settings, Cpu, Wifi, BookOpen, Plus, Trash2, Server, Activity, Pencil, X, MemoryStick, HardDrive, Thermometer, Clock } from "lucide-react";


export default function AdminSystem() {
  const { data: systemStatus, loading, error, refresh } = useApi("/admin/system", { immediate: true });
  const { data: activity, refresh: refreshActivity } = useApi("/admin/activity", { immediate: true });
  const { data: sections, refresh: refreshSections } = useApi("/admin/sections", { immediate: true });
  const { data: metadata } = useApi("/metadata", { immediate: true });
  const GRADE_OPTIONS = metadata?.gradeLevels || {};
  const STRAND_OPTIONS = metadata?.strands || [];
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
    if (!formData.gradeLevel?.trim()) {
      setNoticeType("error");
      setNotice("Grade level is required.");
      return;
    }
    
    let sectionName = formData.name;
    if (!editingSectionId) {
      const prefix = formData.educationLevel === "Senior High School" 
        ? `${formData.strand} ${formData.gradeLevel.replace('Grade ', '')}` 
        : formData.gradeLevel;
        
      const existingSame = (sections || []).filter(s => s.name.startsWith(prefix));
      let highestCharCode = 64; 
      existingSame.forEach(s => {
        const suffix = s.name.slice(prefix.length).trim();
        if (suffix.length === 1 && suffix.charCodeAt(0) > highestCharCode) {
          highestCharCode = suffix.charCodeAt(0);
        }
      });
      const nextLetter = String.fromCharCode(highestCharCode + 1);
      sectionName = `${prefix}${nextLetter}`;
    } else if (!sectionName?.trim()) {
      setNoticeType("error");
      setNotice("Section name is required.");
      return;
    }
    
    setSubmitting(true);
    setNotice("");
    try {
      await apiRequest(
        editingSectionId ? `/admin/sections/${editingSectionId}` : "/admin/sections",
        {
          method: editingSectionId ? "PUT" : "POST",
          body: {
            name: sectionName,
            gradeLevel: formData.gradeLevel,
            educationLevel: formData.educationLevel || "Junior High School",
            strand: formData.strand || undefined,
            schoolYear: formData.schoolYear || "2026-2027",
          },
        }
      );
      setShowSectionForm(false);
      setEditingSectionId(null);
      setFormData({});
      refreshSections();
      setNoticeType("success");
      setNotice(editingSectionId ? "Section updated successfully." : "Section created successfully.");
    } catch (err) {
      setNoticeType("error");
      setNotice(err.message || "Could not save section.");
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
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="System Management" description="Manage platform settings and sections." />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="System Management" description="Manage platform settings and sections." />
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="text-base font-bold text-[#202124] mb-2">Unable to load system data</h3>
            <p className="text-sm text-[#5F6368] max-w-sm mb-6">{error}</p>
            <Button onClick={refresh} variant="secondary">Try Again</Button>
          </div>
        </Card>
      </div>
    );
  }

  const healthRows = [
    {
      label: "Backend",
      value: systemStatus ? "Healthy" : "Reconnecting",
      color: systemStatus ? "success" : "warning",
      icon: Server,
    },
    {
      label: "Database",
      value: systemStatus?.database === "connected" ? "Healthy" : "Unhealthy",
      color: systemStatus?.database === "connected" ? "success" : "error",
      icon: Settings,
    },
    {
      label: "Gateway / Frontend",
      value: "Healthy",
      color: "success",
      icon: Wifi,
    },
    {
      label: "Ollama AI",
      value:
        systemStatus?.ollama === "online"
          ? "Online"
          : systemStatus?.ollama === "degraded"
          ? "Degraded"
          : "Offline",
      color:
        systemStatus?.ollama === "online"
          ? "success"
          : systemStatus?.ollama === "degraded"
          ? "warning"
          : "error",
      icon: Cpu,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="System Management"
        description="Monitor platform health, manage sections, and view live activity."
      />

      {/* Notice */}
      {notice && (
        <div
          role="alert"
          className={`px-4 py-3 rounded-xl border text-sm font-bold animate-fade-in ${
            noticeType === "success"
              ? "bg-[#E6F4EA] border-[#188038]/20 text-[#188038]"
              : "bg-[#FCE8E6] border-[#D93025]/20 text-[#D93025]"
          }`}
        >
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── System Status ── */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <Settings className="w-5 h-5 text-[#1A73E8]" />
            <h3 className="text-base font-black text-[#202124]">System Status</h3>
          </div>
          <div className="space-y-2">
            {/* Info rows */}
            {[
              { label: "Portal URL", icon: Server, value: systemStatus?.portalUrl || "N/A", badge: null },
              { label: "WiFi SSID",  icon: Wifi,   value: systemStatus?.wifiSsid || "N/A",  badge: null },
              { label: "AI Model",   icon: Cpu,    value: systemStatus?.activeModel || "N/A", badge: null },
              { label: "Mode",       icon: Settings, value: systemStatus?.mode || "N/A",    badge: "primary" },
              { label: "AI Runtime", icon: Cpu,    value: systemStatus?.aiRuntime || "N/A", badge: systemStatus?.ollama === "online" ? "success" : "warning" },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between py-3 px-4 bg-[#F8F9FA] rounded-xl border border-[#E0E0E0]"
              >
                <div className="flex items-center gap-3">
                  <row.icon className="w-4 h-4 text-[#9AA0A6]" />
                  <span className="text-sm font-bold text-[#202124]">{row.label}</span>
                </div>
                {row.badge ? (
                  <Badge color={row.badge}>{row.value}</Badge>
                ) : (
                  <span className="text-sm font-mono font-bold text-[#5F6368] text-right max-w-[140px] truncate">
                    {row.value}
                  </span>
                )}
              </div>
            ))}
            {/* Health rows */}
            {healthRows.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between py-3 px-4 bg-[#F8F9FA] rounded-xl border border-[#E0E0E0]"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-[#9AA0A6]" />
                  <span className="text-sm font-bold text-[#202124]">{item.label}</span>
                </div>
                <Badge color={item.color}>{item.value}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Server Analytics ── */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <Activity className="w-5 h-5 text-[#1A73E8]" />
            <h3 className="text-base font-black text-[#202124]">Server Analytics</h3>
          </div>
          <div className="space-y-2">
            {[
              { label: "CPU Usage", icon: Cpu, value: systemStatus?.hardware?.cpuPercent != null ? `${systemStatus.hardware.cpuPercent}%` : "N/A", badge: null },
              { label: "Memory", icon: MemoryStick, value: systemStatus?.hardware?.ramUsedMb != null ? `${systemStatus.hardware.ramUsedMb} MB / ${systemStatus.hardware.ramTotalMb} MB (${systemStatus.hardware.ramPercent}%)` : "N/A", badge: null },
              { label: "Storage", icon: HardDrive, value: systemStatus?.hardware?.diskUsedGb != null ? `${systemStatus.hardware.diskUsedGb} GB / ${systemStatus.hardware.diskTotalGb} GB (${systemStatus.hardware.diskPercent}%)` : "N/A", badge: null },
              { label: "GPU", icon: Server, value: systemStatus?.hardware?.gpuName && systemStatus.hardware.gpuName !== "none" ? `${systemStatus.hardware.gpuName} (${systemStatus.hardware.gpuVramMb}MB)` : "No dedicated GPU", badge: null },
              { label: "Temperature", icon: Thermometer, value: systemStatus?.hardware?.temperatureCelsius != null ? `${systemStatus.hardware.temperatureCelsius}°C` : "N/A", badge: null },
              { label: "Uptime", icon: Clock, value: systemStatus?.uptime || "N/A", badge: null },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between py-3 px-4 bg-[#F8F9FA] rounded-xl border border-[#E0E0E0]"
              >
                <div className="flex items-center gap-3">
                  <row.icon className="w-4 h-4 text-[#9AA0A6]" />
                  <span className="text-sm font-bold text-[#202124]">{row.label}</span>
                </div>
                {row.badge ? (
                  <Badge color={row.badge}>{row.value}</Badge>
                ) : (
                  <span className="text-sm font-mono font-bold text-[#5F6368] text-right max-w-[200px] truncate" title={row.value}>
                    {row.value}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* ── Sections ── */}
        <Card>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#1A73E8]" />
              <h3 className="text-base font-black text-[#202124]">Sections</h3>
            </div>
            <Button
              size="sm"
              variant={showSectionForm ? "secondary" : "primary"}
              onClick={() => {
                setEditingSectionId(null);
                setFormData({ educationLevel: "Junior High School" });
                setShowSectionForm(!showSectionForm);
              }}
            >
              {showSectionForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {showSectionForm ? "Cancel" : "Add Section"}
            </Button>
          </div>

          {showSectionForm && (
            <form onSubmit={handleSaveSection} className="space-y-3 mb-5 p-4 bg-[#E8F0FE]/40 rounded-xl border border-[#1A73E8]/15 animate-slide-down">
              <h4 className="text-sm font-black text-[#202124]">
                {editingSectionId ? "Edit Section" : "New Section"}
              </h4>
              {editingSectionId && (
                <input
                  className="dn-input"
                  placeholder="Section name *"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              )}
              <select
                className="dn-input"
                value={formData.educationLevel || "Junior High School"}
                onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value, gradeLevel: "", strand: "" })}
                required
              >
                <option value="Junior High School">Junior High</option>
                <option value="Senior High School">Senior High</option>
              </select>
              <select
                className="dn-input"
                value={formData.gradeLevel || ""}
                onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                required
              >
                <option value="">Grade Level *</option>
                {(GRADE_OPTIONS[formData.educationLevel || "Junior High School"] || []).map((grade) => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
              {formData.educationLevel === "Senior High School" && (
                <select
                  className="dn-input"
                  value={formData.strand || ""}
                  onChange={(e) => setFormData({ ...formData, strand: e.target.value })}
                  required
                >
                  <option value="">Strand *</option>
                  {STRAND_OPTIONS.map((strand) => (
                    <option key={strand} value={strand}>{strand}</option>
                  ))}
                </select>
              )}
              <input
                className="dn-input"
                placeholder="School year (e.g. 2026-2027)"
                value={formData.schoolYear || ""}
                onChange={(e) => setFormData({ ...formData, schoolYear: e.target.value })}
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? "Saving…" : editingSectionId ? "Save Changes" : "Create Section"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => { setShowSectionForm(false); setEditingSectionId(null); }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {(sections || []).length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No sections yet"
              description="Sections will appear here once created."
            />
          ) : (
            <div className="space-y-2">
              {(sections || []).map((sec) => (
                <div
                  key={sec.id}
                  className="flex items-center justify-between py-3 px-4 bg-[#F8F9FA] rounded-xl border border-[#E0E0E0]"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#202124]">{sec.name}</p>
                    <p className="text-xs text-[#9AA0A6] font-bold mt-0.5">
                      {[sec.gradeLevel, sec.educationLevel, sec.schoolYear].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge color="primary">{sec.studentCount} students</Badge>
                    <Button variant="ghost" size="sm" onClick={() => handleEditSection(sec)} title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteSection(sec.id)} title="Deactivate">
                      <Trash2 className="w-3.5 h-3.5 text-[#D93025]" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Live Activity ── */}
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <Activity className="w-5 h-5 text-[#1A73E8]" />
          <h3 className="text-base font-black text-[#202124]">Live Activity</h3>
          <span className="text-xs font-bold text-[#9AA0A6] ml-auto">Auto-refreshes every 15s</span>
        </div>
        {(activity || []).length === 0 ? (
          <EmptyState
            icon={Server}
            title="No activity yet"
            description="Logins and classroom changes will appear here."
          />
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="dn-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Actor</th>
                  <th className="hidden sm:table-cell">Details</th>
                  <th className="text-right">Time</th>
                </tr>
              </thead>
              <tbody>
                {(activity || []).slice(0, 15).map((item) => (
                  <tr key={item.id}>
                    <td className="font-bold text-[#202124] capitalize">
                      {item.action?.replaceAll("_", " ")}
                    </td>
                    <td className="text-[#5F6368]">{item.actorName}</td>
                    <td className="hidden sm:table-cell text-[#9AA0A6]">{item.details}</td>
                    <td className="text-right text-[#9AA0A6] text-xs font-bold whitespace-nowrap">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
