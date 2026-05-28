import { useState } from "react";
import { useApi } from "../../hooks/useApi";
import { apiRequest } from "../../api";
import { Card, PageHeader, Skeleton, EmptyState, Badge, Button } from "../../components/ui";
import { Users, Plus, UserCheck, UserX, RefreshCw, ChevronDown, X } from "lucide-react";

const GRADE_OPTIONS = {
  "Junior High School": ["Grade 7", "Grade 8", "Grade 9", "Grade 10"],
  "Senior High School": ["Grade 11", "Grade 12"],
};

const STRAND_OPTIONS = ["STEM", "ABM", "HUMSS", "GAS", "TVL", "Sports", "Arts & Design"];

const ROLE_BADGE = {
  admin:   { color: "error",   label: "Admin" },
  teacher: { color: "success", label: "Teacher" },
  student: { color: "primary", label: "Student" },
};

const ROLE_AVATAR = {
  admin:   "bg-[#FCE8E6] text-[#D93025]",
  teacher: "bg-[#E6F4EA] text-[#188038]",
  student: "bg-[#E8F0FE] text-[#1A73E8]",
};

export default function AdminDirectory() {
  const [roleFilter, setRoleFilter] = useState("");
  const { data, loading, error, refresh } = useApi(
    `/admin/users${roleFilter ? `?role=${roleFilter}` : ""}`,
    { immediate: true, deps: [roleFilter] }
  );
  const { data: sections } = useApi("/admin/sections", { immediate: true });
  const users = data || [];
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("error");

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.educationLevel || !formData.gradeLevel) {
      setNoticeType("error");
      setNotice("Education level and grade level are required.");
      return;
    }
    setSubmitting(true);
    setNotice("");
    try {
      await apiRequest("/admin/users", {
        method: "POST",
        body: {
          role: formData.role,
          fullName: formData.fullName,
          email: formData.email || undefined,
          username: formData.username || undefined,
          password: formData.password || undefined,
          educationLevel: formData.educationLevel,
          gradeLevel: formData.gradeLevel,
          strand: formData.strand,
          sectionName: formData.sectionName,
        },
      });
      setShowForm(false);
      setFormData({});
      refresh();
      setNoticeType("success");
      setNotice("User created successfully.");
    } catch (err) {
      setNoticeType("error");
      setNotice(err.message || "Could not create user.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await apiRequest(`/admin/users/${user.id}`, {
        method: "PUT",
        body: { isActive: !user.isActive },
      });
      refresh();
    } catch (err) {
      setNoticeType("error");
      setNotice(err.message || "Could not update user.");
    }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = prompt("Enter new password (default: danilo123):", "danilo123");
    if (!newPassword) return;
    try {
      await apiRequest(`/admin/users/${userId}/reset-password`, {
        method: "POST",
        body: { password: newPassword },
      });
      setNoticeType("success");
      setNotice("Password reset successfully.");
    } catch (err) {
      setNoticeType("error");
      setNotice(err.message || "Could not reset password.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Directory" description="Manage users across the platform." />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[68px]" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Directory" description="Manage users across the platform." />
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="text-base font-bold text-[#202124] mb-2">Unable to load users</h3>
            <p className="text-sm text-[#5F6368] max-w-sm mb-6">{error}</p>
            <Button onClick={refresh} variant="secondary">Try Again</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Directory"
        description="Manage users across the platform."
        action={
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Cancel" : "Add User"}
          </Button>
        }
      />

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          className="dn-input w-auto min-w-[140px]"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
          <option value="admin">Admins</option>
        </select>
        <span className="text-sm text-[#9AA0A6] font-bold">
          {users.length} user{users.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Notice */}
      {notice && (
        <div
          role="alert"
          className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-bold animate-fade-in ${
            noticeType === "success"
              ? "bg-[#E6F4EA] border-[#188038]/20 text-[#188038]"
              : "bg-[#FCE8E6] border-[#D93025]/20 text-[#D93025]"
          }`}
        >
          {notice}
        </div>
      )}

      {/* Add User Form */}
      {showForm && (
        <Card className="border-[#1A73E8]/20 animate-slide-down">
          <h3 className="text-base font-black text-[#202124] mb-5 flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#1A73E8]" />
            Add New User
          </h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <select
              className="dn-input"
              value={formData.role || ""}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
              aria-label="Role"
            >
              <option value="">Role *</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
            <input
              className="dn-input"
              placeholder="Full Name *"
              value={formData.fullName || ""}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              aria-label="Full name"
            />
            <input
              className="dn-input"
              placeholder="Email address"
              value={formData.email || ""}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              aria-label="Email"
            />
            <input
              className="dn-input"
              placeholder="Username (optional)"
              value={formData.username || ""}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              aria-label="Username"
            />
            <input
              className="dn-input"
              type="password"
              placeholder="Password (optional)"
              value={formData.password || ""}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              aria-label="Password"
            />
            <select
              className="dn-input"
              value={formData.educationLevel || ""}
              onChange={(e) =>
                setFormData({ ...formData, educationLevel: e.target.value, gradeLevel: "", strand: "" })
              }
              required
              aria-label="Education level"
            >
              <option value="">Education Level *</option>
              <option value="Junior High School">Junior High</option>
              <option value="Senior High School">Senior High</option>
            </select>
            <select
              className="dn-input"
              value={formData.gradeLevel || ""}
              onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
              required
              aria-label="Grade level"
            >
              <option value="">Grade Level *</option>
              {(GRADE_OPTIONS[formData.educationLevel] || []).map((grade) => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
            {formData.educationLevel === "Senior High School" && (
              <select
                className="dn-input"
                value={formData.strand || ""}
                onChange={(e) => setFormData({ ...formData, strand: e.target.value })}
                required
                aria-label="Strand"
              >
                <option value="">Strand *</option>
                {STRAND_OPTIONS.map((strand) => (
                  <option key={strand} value={strand}>{strand}</option>
                ))}
              </select>
            )}
            <select
              className="dn-input"
              value={formData.sectionName || ""}
              onChange={(e) => setFormData({ ...formData, sectionName: e.target.value })}
              aria-label="Section"
            >
              <option value="">Section (optional)</option>
              {(sections || [])
                .filter((s) => !formData.gradeLevel || s.gradeLevel === formData.gradeLevel)
                .map((section) => (
                  <option key={section.id} value={section.name}>
                    {section.name} — {section.gradeLevel}
                  </option>
                ))}
            </select>
            <div className="sm:col-span-2 lg:col-span-3 flex gap-2 pt-1">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating…" : "Create User"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setShowForm(false); setFormData({}); }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* User List */}
      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="Users will appear here once added to the system."
        />
      ) : (
        <div className="space-y-2">
          {users.map((user) => {
            const roleConf = ROLE_BADGE[user.role] || { color: "secondary", label: user.role };
            const avatarClass = ROLE_AVATAR[user.role] || "bg-[#F1F3F4] text-[#5F6368]";
            return (
              <div
                key={user.id}
                className="dn-card px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#C5D4F5] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${avatarClass}`}
                  >
                    {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#202124] truncate">{user.fullName}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge color={roleConf.color}>{roleConf.label}</Badge>
                      <span className="text-xs text-[#9AA0A6] font-bold truncate">
                        {user.email || user.username}
                      </span>
                      {user.isActive ? (
                        <Badge color="success">Active</Badge>
                      ) : (
                        <Badge color="secondary">Inactive</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleResetPassword(user.id)}
                    title="Reset password"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reset</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(user)}
                    title={user.isActive ? "Deactivate user" : "Activate user"}
                  >
                    {user.isActive
                      ? <UserX className="w-3.5 h-3.5 text-[#D93025]" />
                      : <UserCheck className="w-3.5 h-3.5 text-[#188038]" />}
                    <span className="hidden sm:inline">
                      {user.isActive ? "Deactivate" : "Activate"}
                    </span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
