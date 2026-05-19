import { useEffect, useState } from "react";
import { apiRequest } from "../api";
import { formatDateOnly, formatDateTimeFull } from "../lib/utils";
import {
  DEPED_SUBJECTS,
  Badge,
  Empty,
  Field,
  GradeCascade,
  PageHeader,
  SectionHeader,
  PaginatedTable,
  Modal,
  downloadReport,
} from "./shared";
import ConfirmDialog from "./ui/ConfirmDialog";
import { cn } from "../lib/utils";
import {
  Users,
  BookOpen,
  Building,
  ClipboardList,
  BarChart3,
  Megaphone,
  Trash2,
  Pencil,
  Plus,
  Download,
  Loader2,
  Activity,
  HardDrive,
  Clock,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Server,
  Wifi,
  Database,
} from "lucide-react";

const defaultUserForm = {
  role: "student",
  fullName: "",
  username: "",
  password: "danilo123",
  educationLevel: "Junior High School",
  gradeLevel: "Grade 7",
  strand: "",
  sectionName: "",
  departmentId: "",
};

const ROLE_DISPLAY = { student: "Learner", teacher: "Faculty", admin: "School Admin" };
const ROLE_BADGE_TONE = { admin: "blue", teacher: "yellow", student: "green" };

function makeUsername(fullName, role, sectionName) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return "";
  const initials = parts.map((p) => p[0].toUpperCase()).join("");
  if (role === "teacher") return `FAC-${initials}`;
  if (role === "admin") return `ADM-${initials}`;
  const sec = String(sectionName || "LRN").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return `${sec}-${initials}`;
}

/* =======================================================================
   Skeleton helpers
   ======================================================================= */

function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-8 flex-1 dn-shimmer" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-2">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-10 flex-1 dn-shimmer" />
          ))}
        </div>
      ))}
    </div>
  );
}

function CardGridSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="dn-card p-4 space-y-3">
          <div className="h-4 w-20 dn-shimmer" />
          <div className="h-3 w-full dn-shimmer" />
          <div className="h-3 w-2/3 dn-shimmer" />
        </div>
      ))}
    </div>
  );
}

/* =======================================================================
   USERS
   ======================================================================= */

export function AdminUsersView({ token, users, reload }) {
  const [form, setForm] = useState(defaultUserForm);
  const [edit, setEdit] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [filter, setFilter] = useState("");
  const [sections, setSections] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [tab, setTab] = useState("all");
  const [saving, setSaving] = useState(false);

  const visible = users.filter((u) => {
    const roleMatch = !filter || u.role === filter;
    const tabMatch = tab === "all" ? true : tab === u.role;
    return roleMatch && tabMatch;
  });

  useEffect(() => {
    apiRequest("/admin/sections", { token })
      .then((d) => setSections(Array.isArray(d) ? d : []))
      .catch(() => {});
    apiRequest("/admin/departments", { token })
      .then((d) => setDepartments(Array.isArray(d) ? d.filter((x) => x.isActive !== false) : []))
      .catch(() => {});
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    const username = (form.username || makeUsername(form.fullName, form.role)).trim();
    if (!form.fullName.trim() || !username) return;
    const payload = { ...form, username };
    setSaving(true);
    try {
      if (edit) {
        await apiRequest(`/admin/users/${edit.id}`, { method: "PUT", token, body: payload });
        setEdit(null);
      } else {
        await apiRequest("/admin/users", { method: "POST", token, body: payload });
      }
      setForm(defaultUserForm);
      setModalOpen(false);
      reload();
    } finally {
      setSaving(false);
    }
  }

  function startEdit(u) {
    setEdit(u);
    setForm({
      role: u.role,
      fullName: u.fullName,
      username: u.username,
      password: "",
      educationLevel: u.educationLevel || "Junior High School",
      gradeLevel: u.gradeLevel || "Grade 7",
      strand: u.strand || "",
      sectionName: u.sectionName || "",
      departmentId: u.departmentId || "",
    });
    setModalOpen(true);
  }

  function openCreate() {
    setEdit(null);
    setForm(defaultUserForm);
    setModalOpen(true);
  }

  async function deactivateUser() {
    if (!confirmTarget) return;
    await apiRequest(`/admin/users/${confirmTarget.id}`, { method: "DELETE", token });
    setConfirmOpen(false);
    setConfirmTarget(null);
    reload();
  }

  const columns = [
    { key: "fullName", label: "Name" },
    { key: "role", label: "Role", render: (u) => <Badge tone={ROLE_BADGE_TONE[u.role] || "default"}>{u.displayRole || ROLE_DISPLAY[u.role] || u.role}</Badge> },
    { key: "username", label: "Username", render: (u) => <span className="font-mono text-xs text-danilo-text-secondary">{u.username}</span> },
    { key: "level", label: "Level", render: (u) => <span className="text-xs text-danilo-text-muted hidden sm:inline">{u.educationLevel || ""} {u.gradeLevel || ""} {u.strand || ""}</span> },
    { key: "status", label: "Status", render: (u) => (u.isActive !== false ? <Badge tone="green">Active</Badge> : <Badge tone="red">Inactive</Badge>) },
    {
      key: "actions",
      label: "Actions",
      render: (u) => (
        <div className="flex gap-1.5">
          <button className="dn-btn-secondary text-xs py-1 px-2 min-h-[28px]" onClick={() => startEdit(u)}>
            <Pencil className="w-3 h-3" /> Edit
          </button>
          <button
            className="dn-btn-danger text-xs py-1 px-2 min-h-[28px]"
            onClick={() => { setConfirmTarget(u); setConfirmOpen(true); }}
          >
            <Trash2 className="w-3 h-3" /> Deactivate
          </button>
        </div>
      ),
    },
  ];

  return (
    <section className="space-y-5" aria-label="People Management">
      <PageHeader title="Learners & Faculty" subtitle="Manage accounts for your school community">
        <button onClick={openCreate} className="dn-btn-primary dn-btn-sm">
          <Plus className="w-3.5 h-3.5" /> New Account
        </button>
      </PageHeader>

      <div className="dn-tabs w-fit">
        {["all", "student", "teacher", "admin"].map((r) => (
          <button key={r} onClick={() => setTab(r)} className={cn("dn-tab", tab === r && "active")}>
            {r === "all" ? "All" : ROLE_DISPLAY[r]}
          </button>
        ))}
      </div>

      <div className="dn-card p-5">
        <SectionHeader title="Accounts" subtitle={users.length ? `${users.length} total accounts` : "No accounts yet"}>
          <select className="dn-input w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="student">Learners</option>
            <option value="teacher">Faculty</option>
            <option value="admin">School Admins</option>
          </select>
        </SectionHeader>
        <PaginatedTable
          columns={columns}
          rows={visible}
          keyField="id"
          pageSize={10}
          searchFields={["fullName", "username"]}
          emptyTitle="No accounts"
          emptyBody="Create Learner and Faculty accounts to begin enrollment."
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEdit(null); setForm(defaultUserForm); }}
        title={edit ? "Edit Account" : "New Account"}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button className="dn-btn-secondary" onClick={() => { setModalOpen(false); setEdit(null); }}>Cancel</button>
            <button className="dn-btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : edit ? "Save Changes" : "Create Account"}
            </button>
          </div>
        }
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} className="grid gap-3 sm:grid-cols-2">
          <Field label="Role">
            <select className="dn-input" value={form.role} onChange={(e) => {
              const role = e.target.value;
              setForm((prev) => ({ ...prev, role, username: edit || prev.username ? prev.username : makeUsername(prev.fullName, role) }));
            }}>
              <option value="student">Learner</option>
              <option value="teacher">Faculty</option>
              <option value="admin">School Admin</option>
            </select>
          </Field>
          <Field label="Full Name">
            <input className="dn-input" value={form.fullName} onChange={(e) => {
              const fullName = e.target.value;
              setForm((prev) => ({ ...prev, fullName, username: edit || prev.username ? prev.username : makeUsername(fullName, prev.role) }));
            }} required />
          </Field>
          <Field label="Username">
            <input className={cn("dn-input", edit && "bg-danilo-bg-secondary text-danilo-text-muted cursor-not-allowed")} value={form.username} onChange={(e) => { if (!edit) setForm({ ...form, username: e.target.value }); }} readOnly={!!edit} placeholder="Auto-generated from name + section" autoCapitalize="none" />
          </Field>
          {!edit && (
            <Field label="Password">
              <input className="dn-input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Field>
          )}
          <div className="sm:col-span-2">
            <GradeCascade value={form} onChange={setForm} />
          </div>
          <Field label="Section">
            {sections.length > 0 ? (
              <select className="dn-input" value={form.sectionName} onChange={(e) => {
                const sectionName = e.target.value;
                setForm((prev) => ({ ...prev, sectionName, username: edit ? prev.username : makeUsername(prev.fullName, prev.role, sectionName) }));
              }}>
                <option value="">No section</option>
                {sections.map((s) => <option key={s.id} value={s.name}>{s.name} — {s.gradeLevel}</option>)}
              </select>
            ) : (
              <input className="dn-input bg-danilo-bg-secondary text-danilo-text-muted" value="No sections yet — create sections first" readOnly />
            )}
          </Field>
          <Field label="Department">
            <select className="dn-input" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
              <option value="">No department</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Deactivate Account"
        message={`Are you sure you want to deactivate ${confirmTarget?.fullName ?? "this account"}?`}
        onConfirm={deactivateUser}
        onCancel={() => { setConfirmOpen(false); setConfirmTarget(null); }}
        confirmLabel="Deactivate"
        variant="danger"
      />
    </section>
  );
}

/* =======================================================================
   SUBJECTS
   ======================================================================= */

const defaultCourseForm = {
  code: "",
  title: "",
  subject: "",
  educationLevel: "Junior High School",
  gradeLevel: "Grade 7",
  strand: "",
  quarter: "Q1",
  teacherId: "",
  departmentId: "",
  description: "",
};

export function AdminClassesView({ token, users, courses, reload }) {
  const teachers = users.filter((u) => u.role === "teacher" && u.isActive !== false);
  const [form, setForm] = useState(defaultCourseForm);
  const [departments, setDepartments] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiRequest("/admin/departments", { token })
      .then((d) => setDepartments(Array.isArray(d) ? d.filter((x) => x.isActive !== false) : []))
      .catch(() => {});
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest("/admin/courses", { method: "POST", token, body: form });
      setForm(defaultCourseForm);
      setModalOpen(false);
      reload();
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    { key: "code", label: "Code", render: (c) => <Badge tone="blue">{c.code}</Badge> },
    { key: "title", label: "Title", render: (c) => <span className="font-medium text-danilo-text">{c.title}</span> },
    { key: "subject", label: "Subject" },
    { key: "quarter", label: "Quarter", render: (c) => <Badge>{c.quarter}</Badge> },
    { key: "teacher", label: "Faculty", render: (c) => c.teacherName || "Unassigned" },
    { key: "learners", label: "Learners", render: (c) => c.studentTotal ?? 0 },
  ];

  return (
    <section className="space-y-5" aria-label="Subject Management">
      <PageHeader title="Subjects" subtitle="Set up subjects and assign faculty">
        <button onClick={() => setModalOpen(true)} className="dn-btn-primary dn-btn-sm">
          <Plus className="w-3.5 h-3.5" /> Create Subject
        </button>
      </PageHeader>

      <div className="dn-card p-5">
        <SectionHeader title="All Subjects" subtitle={`${courses.length} subject${courses.length === 1 ? "" : "s"} configured`} />
        {courses.length ? (
          <PaginatedTable
            columns={columns}
            rows={courses}
            keyField="id"
            pageSize={10}
            searchFields={["code", "title", "subject"]}
            emptyTitle="No subjects"
            emptyBody="Create a subject, assign faculty, then enroll learners."
          />
        ) : (
          <Empty title="No subjects" body="Create a subject, assign faculty, then enroll learners." />
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setForm(defaultCourseForm); }}
        title="Create Subject"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button className="dn-btn-secondary" onClick={() => { setModalOpen(false); }}>Cancel</button>
            <button className="dn-btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Subject"}
            </button>
          </div>
        }
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} className="grid gap-3 sm:grid-cols-2">
          <Field label="Code"><input className="dn-input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required /></Field>
          <Field label="Title"><input className="dn-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field>
          <Field label="Subject">
            <select className="dn-input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required>
              <option value="">Select subject...</option>
              {DEPED_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <GradeCascade value={form} onChange={setForm} />
          </div>
          <Field label="Quarter">
            <select className="dn-input" value={form.quarter} onChange={(e) => setForm({ ...form, quarter: e.target.value })}>
              <option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option>
            </select>
          </Field>
          <Field label="Faculty">
            <select className="dn-input" value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })}>
              <option value="">Unassigned</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
            </select>
          </Field>
          <Field label="Department">
            <select className="dn-input" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
              <option value="">No department</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <input className="dn-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
        </form>
      </Modal>
    </section>
  );
}

/* =======================================================================
   SECTIONS
   ======================================================================= */

const defaultSectionForm = { name: "", educationLevel: "Junior High School", gradeLevel: "Grade 7", strand: "", schoolYear: "2026-2027", adviserId: "" };

export function AdminSectionsView({ token, users, reload }) {
  const teachers = users.filter((u) => u.role === "teacher" && u.isActive !== false);
  const learners = users.filter((u) => u.role === "student" && u.isActive !== false);
  const [sections, setSections] = useState([]);
  const [form, setForm] = useState(defaultSectionForm);
  const [edit, setEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assign, setAssign] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  async function loadSections() {
    setLoading(true);
    try {
      const data = await apiRequest("/admin/sections", { token });
      setSections(Array.isArray(data) ? data : []);
    } catch (_) {
      setSections([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadSections(); }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form, adviserId: form.adviserId ? Number(form.adviserId) : null };
    setSaving(true);
    try {
      if (edit) {
        await apiRequest(`/admin/sections/${edit.id}`, { method: "PUT", token, body: payload });
        setEdit(null);
      } else {
        await apiRequest("/admin/sections", { method: "POST", token, body: payload });
      }
      setForm(defaultSectionForm);
      setModalOpen(false);
      await loadSections();
      reload();
    } finally {
      setSaving(false);
    }
  }

  function startEdit(section) {
    setEdit(section);
    setForm({
      name: section.name || "",
      educationLevel: section.educationLevel || "Junior High School",
      gradeLevel: section.gradeLevel || "Grade 7",
      strand: section.strand || "",
      schoolYear: section.schoolYear || "2026-2027",
      adviserId: section.adviserId || "",
    });
    setModalOpen(true);
  }

  async function deactivate(id) {
    await apiRequest(`/admin/sections/${id}`, { method: "DELETE", token });
    await loadSections();
    reload();
  }

  async function assignStudent(sectionId) {
    const studentId = assign[sectionId];
    if (!studentId) return;
    await apiRequest(`/admin/sections/${sectionId}/assign-students`, { method: "POST", token, body: { studentIds: [Number(studentId)] } });
    setAssign({ ...assign, [sectionId]: "" });
    await loadSections();
    reload();
  }

  return (
    <section className="space-y-5" aria-label="Section Management">
      <PageHeader title="Sections" subtitle="Create advisory sections and assign learners">
        <button onClick={() => { setEdit(null); setForm(defaultSectionForm); setModalOpen(true); }} className="dn-btn-primary dn-btn-sm">
          <Plus className="w-3.5 h-3.5" /> New Section
        </button>
      </PageHeader>

      <div className="dn-card p-5">
        <SectionHeader title="Active Sections" subtitle={sections.length ? `${sections.length} sections` : "No sections yet"} />
        {loading ? (
          <CardGridSkeleton count={6} />
        ) : sections.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((s) => (
              <article key={s.id} className="dn-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge tone="blue">{s.gradeLevel}</Badge>
                  {s.strand && <Badge>{s.strand}</Badge>}
                </div>
                <h3 className="font-semibold text-danilo-text tracking-tight">{s.name}</h3>
                <p className="text-xs text-danilo-text-muted mt-1">{s.educationLevel} · SY {s.schoolYear}</p>
                <p className="text-xs text-danilo-text-muted mt-1">Adviser: {s.adviserName || "Unassigned"}</p>
                <p className="text-xs text-danilo-text-muted mt-1">{s.studentCount ?? 0} learners</p>
                <div className="mt-3 grid gap-2">
                  <div className="flex gap-2">
                    <select className="dn-input text-xs" value={assign[s.id] || ""} onChange={(e) => setAssign({ ...assign, [s.id]: e.target.value })}>
                      <option value="">Assign learner...</option>
                      {learners.map((l) => <option key={l.id} value={l.id}>{l.fullName}</option>)}
                    </select>
                    <button type="button" className="dn-btn-secondary text-xs px-2 py-1 min-h-[34px]" onClick={() => assignStudent(s.id)}>Add</button>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="dn-btn-secondary text-xs py-1 px-2 min-h-[30px]" onClick={() => startEdit(s)}>Edit</button>
                    <button
                      type="button"
                      className="dn-btn-danger text-xs py-1 px-2 min-h-[30px]"
                      onClick={() => { setConfirmTarget(s); setConfirmOpen(true); }}
                    >
                      Deactivate
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty title="No sections" body="Create sections before assigning learners to advisory groups." />
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEdit(null); setForm(defaultSectionForm); }}
        title={edit ? "Edit Section" : "New Section"}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button className="dn-btn-secondary" onClick={() => { setModalOpen(false); setEdit(null); }}>Cancel</button>
            <button className="dn-btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : edit ? "Save Changes" : "Create Section"}
            </button>
          </div>
        }
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} className="grid gap-3 sm:grid-cols-2">
          <Field label="Section Name"><input className="dn-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Grade 7 - Mabini" required /></Field>
          <GradeCascade value={form} onChange={setForm} />
          <Field label="School Year"><input className="dn-input" value={form.schoolYear} onChange={(e) => setForm({ ...form, schoolYear: e.target.value })} required /></Field>
          <Field label="Adviser">
            <select className="dn-input" value={form.adviserId} onChange={(e) => setForm({ ...form, adviserId: e.target.value })}>
              <option value="">Unassigned</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
            </select>
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Deactivate Section"
        message={`Deactivate ${confirmTarget?.name ?? "this section"}? Learners will remain enrolled but the section will be hidden.`}
        onConfirm={() => { deactivate(confirmTarget?.id); setConfirmOpen(false); }}
        onCancel={() => { setConfirmOpen(false); setConfirmTarget(null); }}
        confirmLabel="Deactivate"
        variant="danger"
      />
    </section>
  );
}

/* =======================================================================
   ENROLLMENTS
   ======================================================================= */

export function AdminEnrollmentsView({ token, users, courses, reload }) {
  const learners = users.filter((u) => u.role === "student" && u.isActive !== false);
  const [courseId, setCourseId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiRequest("/admin/enrollments", { token });
      setRows(Array.isArray(data) ? data : []);
    } catch (_) {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [token]);

  async function enroll(e) {
    e.preventDefault();
    if (!courseId || !studentId) return;
    await apiRequest("/admin/enrollments", { method: "POST", token, body: { courseId: Number(courseId), studentId: Number(studentId) } });
    setCourseId(""); setStudentId("");
    await load(); reload();
  }

  async function remove(id) {
    await apiRequest(`/admin/enrollments/${id}`, { method: "DELETE", token });
    await load(); reload();
  }

  const columns = [
    { key: "studentName", label: "Learner", render: (r) => <span className="font-medium text-danilo-text">{r.studentName || r.fullName}</span> },
    { key: "courseTitle", label: "Subject", render: (r) => r.courseTitle || r.courseCode || r.courseId },
    { key: "sectionName", label: "Section", render: (r) => r.sectionName || "—" },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <button className="dn-btn-danger text-xs py-1 px-2 min-h-[28px]" onClick={() => { setConfirmTarget(r); setConfirmOpen(true); }}>
          <Trash2 className="w-3 h-3" /> Remove
        </button>
      ),
    },
  ];

  return (
    <section className="space-y-5" aria-label="Enrollment Management">
      <PageHeader title="Enrollments" subtitle="Assign learners to subjects" />
      <div className="dn-card p-5">
        <form onSubmit={enroll} className="grid gap-3 sm:grid-cols-3">
          <Field label="Subject">
            <select className="dn-input" value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
              <option value="">Select subject...</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.title}</option>)}
            </select>
          </Field>
          <Field label="Learner">
            <select className="dn-input" value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
              <option value="">Select learner...</option>
              {learners.map((u) => <option key={u.id} value={u.id}>{u.fullName} ({u.username})</option>)}
            </select>
          </Field>
          <div className="flex items-end"><button className="dn-btn-primary w-full">Enroll Learner</button></div>
        </form>
      </div>
      <div className="dn-card p-5">
        <SectionHeader title="Enrolled Learners" subtitle={rows.length ? `${rows.length} enrollments` : "No enrollments yet"} />
        {loading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : (
          <PaginatedTable
            columns={columns}
            rows={rows}
            keyField="id"
            pageSize={10}
            searchFields={["studentName", "fullName", "courseTitle", "courseCode"]}
            emptyTitle="No enrollments"
            emptyBody="Enroll learners into subjects to begin tracking progress."
          />
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Remove Enrollment"
        message={`Remove ${confirmTarget?.studentName ?? confirmTarget?.fullName ?? "this learner"} from the subject?`}
        onConfirm={() => { remove(confirmTarget?.id); setConfirmOpen(false); }}
        onCancel={() => { setConfirmOpen(false); setConfirmTarget(null); }}
        confirmLabel="Remove"
        variant="danger"
      />
    </section>
  );
}

/* =======================================================================
   ASSIGNMENTS
   ======================================================================= */

export function AdminAssignmentsView({ assignments }) {
  const columns = [
    { key: "title", label: "Title", render: (a) => <span className="font-medium text-danilo-text">{a.title}</span> },
    { key: "subject", label: "Subject", render: (a) => a.courseTitle || a.subject || "—" },
    { key: "type", label: "Type", render: (a) => <Badge>{a.type || "Assignment"}</Badge> },
    { key: "points", label: "Points", render: (a) => a.points ?? "—" },
    { key: "dueDate", label: "Due", render: (a) => formatDateOnly(a.dueDate || a.dueAt) },
  ];

  return (
    <section aria-label="Assessments">
      <PageHeader title="Assessments" subtitle="Overview of all assignments and quizzes" />
      {assignments.length === 0 ? (
        <Empty title="No assessments" body="Assessments will appear once faculty creates them." />
      ) : (
        <div className="dn-card p-5">
          <PaginatedTable
            columns={columns}
            rows={assignments}
            keyField="id"
            pageSize={10}
            searchFields={["title", "subject", "courseTitle"]}
            emptyTitle="No assessments"
            emptyBody="Assessments will appear once faculty creates them."
          />
        </div>
      )}
    </section>
  );
}

/* =======================================================================
   DEPARTMENTS
   ======================================================================= */

export function DepartmentsView({ token, reload }) {
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ name: "" });
  const [edit, setEdit] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await apiRequest("/admin/departments", { token });
      setDepartments(Array.isArray(data) ? data : []);
    } catch (_) {
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (edit) {
        await apiRequest(`/admin/departments/${edit.id}`, { method: "PUT", token, body: form });
        setEdit(null);
      } else {
        await apiRequest("/admin/departments", { method: "POST", token, body: form });
      }
      setForm({ name: "" });
      setModalOpen(false);
      await load(); reload();
    } finally {
      setSaving(false);
    }
  }

  function startEdit(d) {
    setEdit(d);
    setForm({ name: d.name });
    setModalOpen(true);
  }

  return (
    <section className="space-y-5" aria-label="Department Management">
      <PageHeader title="Departments" subtitle="Organize faculty by department">
        <button onClick={() => { setEdit(null); setForm({ name: "" }); setModalOpen(true); }} className="dn-btn-primary dn-btn-sm">
          <Plus className="w-3.5 h-3.5" /> New Department
        </button>
      </PageHeader>

      <div className="dn-card p-5">
        <SectionHeader title="Departments" subtitle={departments.length ? `${departments.length} total` : "No departments yet"} />
        {loading ? (
          <CardGridSkeleton count={4} />
        ) : departments.length > 0 ? (
          <div className="grid gap-2">
            {departments.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border border-danilo-border px-4 py-3 bg-danilo-bg-secondary">
                <span className="text-sm font-medium text-danilo-text">{d.name}</span>
                <div className="flex gap-2">
                  <button className="dn-btn-secondary text-xs py-1 px-2 min-h-[28px]" onClick={() => startEdit(d)}>
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  <button
                    className="dn-btn-danger text-xs py-1 px-2 min-h-[28px]"
                    onClick={() => { setConfirmTarget(d); setConfirmOpen(true); }}
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty title="No departments" body="Create departments to group faculty and subjects." />
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEdit(null); setForm({ name: "" }); }}
        title={edit ? "Edit Department" : "New Department"}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button className="dn-btn-secondary" onClick={() => { setModalOpen(false); setEdit(null); }}>Cancel</button>
            <button className="dn-btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : edit ? "Save" : "Create"}
            </button>
          </div>
        }
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }}>
          <Field label="Department Name">
            <input className="dn-input" value={form.name} onChange={(e) => setForm({ name: e.target.value })} required />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Department"
        message={`Delete ${confirmTarget?.name ?? "this department"}? This cannot be undone.`}
        onConfirm={async () => {
          await apiRequest(`/admin/departments/${confirmTarget.id}`, { method: "DELETE", token });
          await load(); reload();
          setConfirmOpen(false);
        }}
        onCancel={() => { setConfirmOpen(false); setConfirmTarget(null); }}
        confirmLabel="Delete"
        variant="danger"
      />
    </section>
  );
}

/* =======================================================================
   REPORTS
   ======================================================================= */

export function ReportsView({ token, dashboard }) {
  const [reportType, setReportType] = useState("users");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [generating, setGenerating] = useState(false);

  const reportMap = {
    users: { path: "/admin/reports/users", filename: "learners-faculty.csv", label: "Learners & Faculty", icon: Users },
    grades: { path: "/admin/reports/grades", filename: "grades.csv", label: "Grades", icon: BarChart3 },
    courses: { path: "/admin/reports/courses", filename: "subjects.csv", label: "Subjects", icon: BookOpen },
  };

  async function generate() {
    const r = reportMap[reportType];
    if (!r) return;
    setGenerating(true);
    try {
      await downloadReport(r.path, r.filename, token);
    } catch (_) {
      /* handled by downloadReport throwing */
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section className="space-y-5" aria-label="Reports">
      <PageHeader title="Reports" subtitle="Generate and download school data exports" />

      <div className="dn-card p-5">
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Report Type">
            <select className="dn-input" value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="users">Learners & Faculty</option>
              <option value="grades">Grades</option>
              <option value="courses">Subjects</option>
            </select>
          </Field>
          <Field label="From">
            <input type="date" className="dn-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </Field>
          <Field label="To">
            <input type="date" className="dn-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </Field>
          <div className="flex items-end">
            <button onClick={generate} disabled={generating} className="dn-btn-primary w-full">
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Download className="w-4 h-4" /> Generate & Download
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(reportMap).map(([key, r]) => {
          const Icon = r.icon;
          return (
            <button
              key={key}
              onClick={() => { setReportType(key); }}
              className={cn(
                "dn-card p-4 text-left transition",
                reportType === key ? "ring-2 ring-danilo-primary border-danilo-primary" : "hover:shadow-md"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
                reportType === key ? "bg-danilo-primary-subtle text-danilo-primary" : "bg-danilo-bg-tertiary text-danilo-text-secondary"
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-danilo-text">{r.label}</h3>
              <p className="text-xs text-danilo-text-secondary mt-0.5">CSV export</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* =======================================================================
   SYSTEM STATUS
   ======================================================================= */

function StatusCard({ label, value, icon, tone = "primary" }) {
  const toneMap = {
    primary: "text-danilo-primary bg-danilo-primary-subtle",
    success: "text-danilo-success bg-danilo-success-subtle",
    danger: "text-danilo-error bg-danilo-error-subtle",
    warning: "text-danilo-warning bg-danilo-warning-subtle",
  };
  return (
    <div className="dn-card p-4 flex items-center gap-3">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", toneMap[tone] || toneMap.primary)}>
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold text-danilo-text tracking-tight">{value ?? "—"}</p>
        <p className="text-[11px] font-medium uppercase tracking-wider text-danilo-text-muted">{label}</p>
      </div>
    </div>
  );
}

export function SystemView({ token, addToast }) {
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await apiRequest("/admin/system", { token });
      setStatus(data);
    } catch (e) {
      addToast?.(e.message || "Failed to load system status", "danger");
    } finally {
      setLoading(false);
    }
  }

  async function loadLogs() {
    try {
      const data = await apiRequest("/admin/logs", { token });
      setLogs(Array.isArray(data) ? data : []);
    } catch (_) {
      setLogs([]);
    }
  }

  useEffect(() => {
    load();
    loadLogs();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [token]);

  if (loading && !status) {
    return (
      <section aria-label="System Status">
        <PageHeader title="System Status" subtitle="Monitoring DANILO server health" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <div className="dn-card p-4 space-y-2"><div className="h-8 w-16 dn-shimmer" /><div className="h-2 w-20 dn-shimmer" /></div>
          <div className="dn-card p-4 space-y-2"><div className="h-8 w-16 dn-shimmer" /><div className="h-2 w-20 dn-shimmer" /></div>
          <div className="dn-card p-4 space-y-2"><div className="h-8 w-16 dn-shimmer" /><div className="h-2 w-20 dn-shimmer" /></div>
          <div className="dn-card p-4 space-y-2"><div className="h-8 w-16 dn-shimmer" /><div className="h-2 w-20 dn-shimmer" /></div>
        </div>
        <div className="dn-card p-8 text-center text-sm text-danilo-text-muted">Loading system status...</div>
      </section>
    );
  }

  const cards = [
    { label: "CPU", value: status?.cpu != null ? `${status.cpu}%` : "—", icon: <Cpu className="w-5 h-5" />, tone: status?.cpu > 80 ? "warning" : "primary" },
    { label: "Memory", value: status?.memory != null ? `${status.memory}%` : "—", icon: <Activity className="w-5 h-5" />, tone: status?.memory > 80 ? "warning" : "primary" },
    { label: "Disk", value: status?.disk != null ? `${status.disk}%` : "—", icon: <HardDrive className="w-5 h-5" />, tone: status?.disk > 80 ? "warning" : "primary" },
    { label: "Uptime", value: status?.uptime || "—", icon: <Clock className="w-5 h-5" />, tone: "success" },
  ];

  return (
    <section className="space-y-5" aria-label="System Status">
      <PageHeader title="System Status" subtitle="Monitor DANILO server and AI model health">
        <button onClick={load} className="dn-btn-secondary text-xs">
          <Activity className="w-3.5 h-3.5" /> Refresh
        </button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => <StatusCard key={c.label} {...c} />)}
      </div>

      {status?.aiStatus && (
        <div className="dn-card p-4">
          <div className="flex items-center gap-3">
            <div className={cn("w-2 h-2 rounded-full", status.aiStatus.ready ? "bg-danilo-success" : "bg-danilo-error")} />
            <div>
              <p className="text-sm font-medium text-danilo-text">AI Model: {status.aiStatus.model || "DANILO"}</p>
              <p className="text-xs text-danilo-text-secondary mt-0.5">
                {status.aiStatus.ready ? "Ready for offline inference" : status.aiStatus.message || "Not available"}
              </p>
            </div>
            <div className="ml-auto">
              {status.aiStatus.ready ? (
                <Badge tone="green"><CheckCircle2 className="w-3 h-3" /> Online</Badge>
              ) : (
                <Badge tone="red"><AlertTriangle className="w-3 h-3" /> Offline</Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Environment info */}
      <div className="dn-card p-5">
        <SectionHeader title="Environment" subtitle="Runtime and build information" />
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg border border-danilo-border px-4 py-2.5 bg-danilo-bg-secondary">
            <span className="text-xs text-danilo-text-muted">Database</span>
            <Badge tone="green">Connected</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-danilo-border px-4 py-2.5 bg-danilo-bg-secondary">
            <span className="text-xs text-danilo-text-muted">Network</span>
            <Badge tone="green"><Wifi className="w-3 h-3" /> Online</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-danilo-border px-4 py-2.5 bg-danilo-bg-secondary">
            <span className="text-xs text-danilo-text-muted">Server</span>
            <Badge tone="green"><Server className="w-3 h-3" /> Running</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-danilo-border px-4 py-2.5 bg-danilo-bg-secondary">
            <span className="text-xs text-danilo-text-muted">Storage</span>
            <Badge tone="primary"><Database className="w-3 h-3" /> Active</Badge>
          </div>
        </div>
      </div>

      <div className="dn-card p-5">
        <SectionHeader title="Recent Logs" subtitle="Latest system events" />
        {logs.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-danilo-border max-h-[400px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-danilo-bg-secondary">
                <tr>
                  <th className="px-4 py-2 dn-overline">Time</th>
                  <th className="px-4 py-2 dn-overline">Level</th>
                  <th className="px-4 py-2 dn-overline">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-danilo-border/30">
                {logs.map((l, i) => (
                  <tr key={i} className="hover:bg-danilo-bg-secondary/50 transition-colors">
                    <td className="px-4 py-2 text-danilo-text-secondary whitespace-nowrap">{formatDateTimeFull(l.time)}</td>
                    <td className="px-4 py-2"><Badge tone={l.level === "ERROR" ? "red" : l.level === "WARN" ? "yellow" : "green"}>{l.level}</Badge></td>
                    <td className="px-4 py-2 text-danilo-text">{l.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No logs" body="System logs will appear here." />
        )}
      </div>
    </section>
  );
}

/* =======================================================================
   ANNOUNCEMENTS
   ======================================================================= */

export function AdminAnnouncementsView({ token, reload }) {
  const [form, setForm] = useState({ title: "", body: "" });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await apiRequest("/admin/announcements", { token });
      setItems(Array.isArray(data) ? data : []);
    } catch (_) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [token]);

  async function submit(e) {
    e.preventDefault();
    await apiRequest("/admin/announcements", { method: "POST", token, body: form });
    setForm({ title: "", body: "" });
    await load(); reload();
  }

  return (
    <section className="space-y-5" aria-label="Announcements">
      <PageHeader title="Announcements" subtitle="Post school-wide announcements" />
      <div className="dn-card p-5">
        <form onSubmit={submit} className="grid gap-3">
          <Field label="Title"><input className="dn-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field>
          <Field label="Body"><textarea className="dn-textarea" rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required /></Field>
          <div className="flex justify-end"><button className="dn-btn-primary dn-btn-sm"><Megaphone className="w-3.5 h-3.5" /> Post Announcement</button></div>
        </form>
      </div>
      <div className="space-y-3">
        {loading ? (
          <CardGridSkeleton count={3} />
        ) : items.length === 0 ? (
          <Empty title="No announcements" body="Posted announcements will appear here." />
        ) : (
          items.map((item) => (
            <div key={item.id} className="dn-card p-4">
              <p className="text-sm font-semibold text-danilo-text">{item.title}</p>
              <p className="text-sm text-danilo-text-secondary mt-1 whitespace-pre-wrap">{item.body}</p>
              <p className="text-xs text-danilo-text-muted mt-2">{formatDateTimeFull(item.createdAt, "")}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export function TeacherAnnouncementsView({ token, courses, reload }) {
  const [form, setForm] = useState({ courseId: "", title: "", body: "" });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await apiRequest("/teacher/announcements", { token });
      setItems(Array.isArray(data) ? data : []);
    } catch (_) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [token]);

  async function submit(e) {
    e.preventDefault();
    await apiRequest("/teacher/announcements", { method: "POST", token, body: form });
    setForm({ courseId: "", title: "", body: "" });
    await load(); reload();
  }

  return (
    <section className="space-y-5" aria-label="Announcements">
      <PageHeader title="Announcements" subtitle="Post subject announcements for learners" />
      <div className="dn-card p-5">
        <form onSubmit={submit} className="grid gap-3">
          <Field label="Subject">
            <select className="dn-input" value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} required>
              <option value="">Select subject...</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.title}</option>)}
            </select>
          </Field>
          <Field label="Title"><input className="dn-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field>
          <Field label="Body"><textarea className="dn-textarea" rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required /></Field>
          <div className="flex justify-end"><button className="dn-btn-primary dn-btn-sm"><Megaphone className="w-3.5 h-3.5" /> Post Announcement</button></div>
        </form>
      </div>
      <div className="space-y-3">
        {loading ? (
          <CardGridSkeleton count={3} />
        ) : items.length === 0 ? (
          <Empty title="No announcements" body="Posted announcements will appear here." />
        ) : (
          items.map((item) => (
            <div key={item.id} className="dn-card p-4">
              <p className="text-sm font-semibold text-danilo-text">{item.title}</p>
              <p className="text-xs text-danilo-text-secondary mb-1">{item.courseTitle || item.courseCode || ""}</p>
              <p className="text-sm text-danilo-text-secondary mt-1 whitespace-pre-wrap">{item.body}</p>
              <p className="text-xs text-danilo-text-muted mt-2">{formatDateTimeFull(item.createdAt, "")}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
