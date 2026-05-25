import { useState } from "react";
import { useApi } from "../../hooks/useApi";
import { apiRequest } from "../../api";
import { Card, PageHeader, Skeleton, EmptyState, Badge, Button } from "../../components/ui";
import { Users, Plus, UserCheck, UserX, RefreshCw } from "lucide-react";

export default function AdminDirectory() {
  const [roleFilter, setRoleFilter] = useState("");
  const { data, loading, error, refresh } = useApi(`/admin/users${roleFilter ? `?role=${roleFilter}` : ""}`, { immediate: true, deps: [roleFilter] });
  const users = data || [];
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("error");

  const handleCreate = async (e) => {
    e.preventDefault();
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
      await apiRequest(`/admin/users/${userId}/reset-password`, { method: "POST", body: { password: newPassword } });
      setNoticeType("success");
      setNotice("Password reset successfully.");
    } catch (err) {
      setNoticeType("error");
      setNotice(err.message || "Could not reset password.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Directory" description="Manage users across the platform." />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Directory" description="Manage users across the platform." />
        <Card>
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <h3 className="text-lg font-semibold text-danilo-text mb-2">Unable to load users</h3>
            <p className="text-sm text-danilo-text-secondary max-w-sm mb-6">{error}</p>
            <Button onClick={refresh} variant="secondary">Try Again</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Directory"
        description="Manage users across the platform."
        action={<Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4" /> Add User</Button>}
      />

      <div className="flex items-center gap-2">
        <select className="dn-input w-auto" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {notice && (
        <div className={`p-3 rounded-xl border text-sm font-medium ${
          noticeType === "success"
            ? "bg-danilo-success-subtle border-danilo-success/20 text-danilo-success"
            : "bg-danilo-error-subtle border-danilo-error/20 text-danilo-error"
        }`}>
          {notice}
        </div>
      )}

      {showForm && (
        <Card>
          <h3 className="dn-title mb-4">Add User</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <select className="dn-input" value={formData.role || ""} onChange={(e) => setFormData({ ...formData, role: e.target.value })} required>
              <option value="">Role</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
            <input className="dn-input" placeholder="Full Name" value={formData.fullName || ""} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required />
            <input className="dn-input" placeholder="Email" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            <input className="dn-input" placeholder="Username (optional)" value={formData.username || ""} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
            <input className="dn-input" placeholder="Password (optional)" value={formData.password || ""} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
            <input className="dn-input" placeholder="Education Level" value={formData.educationLevel || ""} onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })} />
            <input className="dn-input" placeholder="Grade Level" value={formData.gradeLevel || ""} onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })} />
            <input className="dn-input" placeholder="Strand" value={formData.strand || ""} onChange={(e) => setFormData({ ...formData, strand: e.target.value })} />
            <input className="dn-input" placeholder="Section Name" value={formData.sectionName || ""} onChange={(e) => setFormData({ ...formData, sectionName: e.target.value })} />
            <div className="sm:col-span-2 lg:col-span-3 flex gap-2">
              <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Creating..." : "Create User"}</Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {users.length === 0 ? (
        <EmptyState icon={Users} title="No users" description="Users will appear here once added to the system." />
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <Card key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                  user.role === "admin" ? "bg-danilo-error-subtle text-danilo-error" :
                  user.role === "teacher" ? "bg-danilo-secondary-subtle text-danilo-secondary" :
                  "bg-blue-50 text-blue-600"
                }`}>
                  {user.fullName?.charAt(0) || "U"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-danilo-text">{user.fullName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge color={user.role === "admin" ? "error" : user.role === "teacher" ? "secondary" : "primary"}>{user.displayRole || user.role}</Badge>
                    <span className="dn-caption">{user.email || user.username}</span>
                    {user.isActive ? <Badge color="success">Active</Badge> : <Badge color="secondary">Inactive</Badge>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleResetPassword(user.id)}><RefreshCw className="w-3.5 h-3.5" /> Reset</Button>
                <Button variant="ghost" size="sm" onClick={() => handleToggleActive(user)}>
                  {user.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                  {user.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
