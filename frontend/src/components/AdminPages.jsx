import { useEffect, useState } from "react";
import { apiRequest } from "../api";
import { DEPED_SUBJECTS, Badge, Empty, Field, GradeCascade, PageHeader, SectionHeader, downloadReport } from "./shared";

const defaultUserForm = {
  role: "student", fullName: "", username: "", password: "danilo123",
  educationLevel: "Junior High School", gradeLevel: "Grade 7", strand: "", sectionName: "", departmentId: "",
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

/* ========================================================================
   USERS (Learners & Faculty)
   ======================================================================== */

export function AdminUsersView({ token, users, reload }) {
  const [form, setForm] = useState(defaultUserForm);
  const [edit, setEdit] = useState(null);
  const [filter, setFilter] = useState("");
  const [sections, setSections] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [tab, setTab] = useState("all");

  const visible = users.filter((u) => {
    const roleMatch = !filter || u.role === filter;
    const tabMatch = tab === "all" ? true : tab === u.role;
    return roleMatch && tabMatch;
  });

  useEffect(() => {
    apiRequest("/admin/sections", { token }).then((d) => setSections(Array.isArray(d) ? d : [])).catch(() => {});
    apiRequest("/admin/departments", { token }).then((d) => setDepartments(Array.isArray(d) ? d.filter((x) => x.isActive !== false) : [])).catch(() => {});
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    const username = (form.username || makeUsername(form.fullName, form.role)).trim();
    if (!form.fullName.trim() || !username) return;
    const payload = { ...form, username };
    if (edit) {
      await apiRequest(`/admin/users/${edit.id}`, { method: "PUT", token, body: payload });
      setEdit(null);
    } else {
      await apiRequest("/admin/users", { method: "POST", token, body: payload });
    }
    setForm(defaultUserForm);
    reload();
  }

  function startEdit(u) {
    setEdit(u);
    setForm({
      role: u.role, fullName: u.fullName, username: u.username, password: "",
      educationLevel: u.educationLevel || "Junior High School",
      gradeLevel: u.gradeLevel || "Grade 7", strand: u.strand || "", sectionName: u.sectionName || "", departmentId: u.departmentId || "",
    });
  }

  return (
    <section className="space-y-5" aria-label="People Management">
      <PageHeader title="Learners & Faculty" subtitle="Manage accounts for your school community" />

      <div className="flex gap-1 bg-danilo-surface-hover p-1 rounded-lg w-fit">
        {["all", "student", "teacher", "admin"].map((r) => (
          <button key={r} onClick={() => setTab(r)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${tab === r ? "bg-danilo-surface text-danilo-text shadow-sm" : "text-danilo-text-secondary hover:text-danilo-text"}`}>
            {r === "all" ? "All" : ROLE_DISPLAY[r]}
          </button>
        ))}
      </div>

      <div className="dn-card p-5">
        <SectionHeader title={edit ? "Edit Account" : "New Account"} subtitle={edit ? `Editing ${edit.fullName}` : "Add Faculty, Learners, or School Admin accounts"} />
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-3">
          <Field label="Role">
            <select className="dn-input" value={form.role} onChange={(e) => {
              const role = e.target.value;
              setForm((prev) => ({ ...prev, role, username: edit || prev.username ? prev.username : makeUsername(prev.fullName, role) }));
            }}>
              <option value="student">Learner</option><option value="teacher">Faculty</option><option value="admin">School Admin</option>
            </select>
          </Field>
          <Field label="Full Name">
            <input className="dn-input" value={form.fullName} onChange={(e) => {
              const fullName = e.target.value;
              setForm((prev) => ({ ...prev, fullName, username: edit || prev.username ? prev.username : makeUsername(fullName, prev.role) }));
            }} required />
          </Field>
          <Field label="Username">
            <input className={`dn-input ${edit ? "bg-danilo-bg text-danilo-text-muted cursor-not-allowed" : ""}`} value={form.username} onChange={(e) => { if (!edit) setForm({ ...form, username: e.target.value }); }} readOnly={!!edit} placeholder="Auto-generated from name + section" autoCapitalize="none" />
          </Field>
          <GradeCascade value={form} onChange={setForm} />
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
              <input className="dn-input bg-danilo-bg text-danilo-text-muted" value="No sections yet — create sections first" readOnly />
            )}
          </Field>
          <Field label="Department">
            <select className="dn-input" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
              <option value="">No department</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <div className="flex items-end gap-2">
            <button className="dn-btn-primary w-full">{edit ? "Save Changes" : "Create Account"}</button>
            {edit && <button type="button" className="dn-btn-secondary" onClick={() => { setEdit(null); setForm(defaultUserForm); }}>Cancel</button>}
          </div>
        </form>
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
        {visible.length ? (
          <div className="overflow-x-auto rounded-lg border border-danilo-border">
            <table className="w-full text-left text-sm" role="table">
              <thead>
                <tr className="bg-danilo-bg">
                  <th className="px-4 py-2.5 dn-overline">Name</th>
                  <th className="px-4 py-2.5 dn-overline">Role</th>
                  <th className="px-4 py-2.5 dn-overline">Username</th>
                  <th className="px-4 py-2.5 dn-overline hidden sm:table-cell">Level</th>
                  <th className="px-4 py-2.5 dn-overline">Status</th>
                  <th className="px-4 py-2.5 dn-overline">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-danilo-border/40">
                {visible.map((u) => (
                  <tr key={u.id} className="hover:bg-danilo-bg/50 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-danilo-text">{u.fullName}</td>
                    <td className="px-4 py-2.5"><Badge tone={ROLE_BADGE_TONE[u.role] || "default"}>{u.displayRole || ROLE_DISPLAY[u.role] || u.role}</Badge></td>
                    <td className="px-4 py-2.5 font-mono text-danilo-text-secondary text-xs">{u.username}</td>
                    <td className="px-4 py-2.5 text-danilo-text-muted text-xs hidden sm:table-cell">{u.educationLevel || ""} {u.gradeLevel || ""} {u.strand || ""}</td>
                    <td className="px-4 py-2.5">{u.isActive !== false ? <Badge tone="green">Active</Badge> : <Badge tone="red">Inactive</Badge>}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1.5">
                        <button className="dn-btn-secondary text-xs py-1 px-2 min-h-[28px]" onClick={() => startEdit(u)}>Edit</button>
                        <button className="dn-btn-danger text-xs py-1 px-2 min-h-[28px]" onClick={async () => { await apiRequest(`/admin/users/${u.id}`, { method: "DELETE", token }); reload(); }}>Deactivate</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No accounts" body="Create Learner and Faculty accounts to begin enrollment." />
        )}
      </div>
    </section>
  );
}

/* ========================================================================
   SUBJECTS
   ======================================================================== */

const defaultCourseForm = {
  code: "", title: "", subject: "", educationLevel: "Junior High School",
  gradeLevel: "Grade 7", strand: "", quarter: "Q1", teacherId: "", departmentId: "", description: "",
};

export function AdminClassesView({ token, users, courses, reload }) {
  const teachers = users.filter((u) => u.role === "teacher" && u.isActive !== false);
  const [form, setForm] = useState(defaultCourseForm);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    apiRequest("/admin/departments", { token }).then((d) => setDepartments(Array.isArray(d) ? d.filter((x) => x.isActive !== false) : [])).catch(() => {});
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    await apiRequest("/admin/courses", { method: "POST", token, body: form });
    setForm(defaultCourseForm);
    reload();
  }

  return (
    <section className="space-y-5" aria-label="Subject Management">
      <PageHeader title="Subjects" subtitle="Set up subjects and assign faculty" />
      <div className="dn-card p-5">
        <SectionHeader title="Create Subject" subtitle="Configure a new subject for a quarter" />
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-3">
          <Field label="Code"><input className="dn-input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required /></Field>
          <Field label="Title"><input className="dn-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field>
          <Field label="Subject">
            <select className="dn-input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required>
              <option value="">Select subject...</option>
              {DEPED_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <GradeCascade value={form} onChange={setForm} />
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
          <div className="flex items-end"><button className="dn-btn-primary w-full">Create Subject</button></div>
        </form>
      </div>

      <div className="dn-card p-5">
        <SectionHeader title="All Subjects" subtitle={`${courses.length} subject${courses.length === 1 ? "" : "s"} configured`} />
        {courses.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <div key={c.id} className="rounded-xl border border-danilo-border bg-danilo-bg/50 p-4 hover:bg-danilo-surface hover:shadow-sm transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Badge tone="blue">{c.code}</Badge>
                  <Badge>{c.quarter}</Badge>
                </div>
                <h3 className="font-semibold text-danilo-text tracking-tight">{c.title}</h3>
                <p className="text-sm text-danilo-text-secondary mt-0.5">{c.subject}</p>
                <p className="text-xs text-danilo-text-muted mt-2">{c.teacherName || "Unassigned"} &middot; {c.studentTotal ?? 0} learners &middot; {c.moduleTotal ?? 0} modules</p>
                {c.departmentName && <p className="text-xs text-danilo-text-muted mt-1">Department: {c.departmentName}</p>}
              </div>
            ))}
          </div>
        ) : (
          <Empty title="No subjects" body="Create a subject, assign faculty, then enroll learners." />
        )}
      </div>
    </section>
  );
}

/* ========================================================================
   SECTIONS
   ======================================================================== */

const defaultSectionForm = { name: "", educationLevel: "Junior High School", gradeLevel: "Grade 7", strand: "", schoolYear: "2026-2027", adviserId: "" };

export function AdminSectionsView({ token, users, reload }) {
  const teachers = users.filter((u) => u.role === "teacher" && u.isActive !== false);
  const learners = users.filter((u) => u.role === "student" && u.isActive !== false);
  const [sections, setSections] = useState([]);
  const [form, setForm] = useState(defaultSectionForm);
  const [edit, setEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assign, setAssign] = useState({});

  async function loadSections() {
    setLoading(true);
    try { const data = await apiRequest("/admin/sections", { token }); setSections(Array.isArray(data) ? data : []); } catch (_) { setSections([]); } finally { setLoading(false); }
  }

  useEffect(() => { loadSections(); }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form, adviserId: form.adviserId ? Number(form.adviserId) : null };
    if (edit) { await apiRequest(`/admin/sections/${edit.id}`, { method: "PUT", token, body: payload }); setEdit(null); }
    else { await apiRequest("/admin/sections", { method: "POST", token, body: payload }); }
    setForm(defaultSectionForm);
    await loadSections();
    reload();
  }

  function startEdit(section) {
    setEdit(section);
    setForm({ name: section.name || "", educationLevel: section.educationLevel || "Junior High School", gradeLevel: section.gradeLevel || "Grade 7", strand: section.strand || "", schoolYear: section.schoolYear || "2026-2027", adviserId: section.adviserId || "" });
  }

  async function deactivate(id) { await apiRequest(`/admin/sections/${id}`, { method: "DELETE", token }); await loadSections(); reload(); }

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
      <PageHeader title="Sections" subtitle="Create advisory sections and assign learners" />
      <div className="dn-card p-5">
        <SectionHeader title={edit ? "Edit Section" : "New Section"} subtitle="Organize learners into advisory groups" />
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-3">
          <Field label="Section Name"><input className="dn-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Grade 7 - Mabini" required /></Field>
          <GradeCascade value={form} onChange={setForm} />
          <Field label="School Year"><input className="dn-input" value={form.schoolYear} onChange={(e) => setForm({ ...form, schoolYear: e.target.value })} required /></Field>
          <Field label="Adviser">
            <select className="dn-input" value={form.adviserId} onChange={(e) => setForm({ ...form, adviserId: e.target.value })}>
              <option value="">Unassigned</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
            </select>
          </Field>
          <div className="flex items-end gap-2">
            <button className="dn-btn-primary w-full">{edit ? "Save Changes" : "Create Section"}</button>
            {edit && <button type="button" className="dn-btn-secondary" onClick={() => { setEdit(null); setForm(defaultSectionForm); }}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className="dn-card p-5">
        <SectionHeader title="Active Sections" subtitle={sections.length ? `${sections.length} sections` : "No sections yet"} />
        {loading ? <div className="text-center py-6 text-sm text-danilo-text-muted">Loading...</div> : sections.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((s) => (
              <article key={s.id} className="rounded-xl border border-danilo-border bg-danilo-bg/50 p-4 hover:bg-danilo-surface hover:shadow-sm transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Badge tone="blue">{s.gradeLevel}</Badge>
                  {s.strand && <Badge>{s.strand}</Badge>}
                </div>
                <h3 className="font-semibold text-danilo-text tracking-tight">{s.name}</h3>
                <p className="text-xs text-danilo-text-muted mt-1">{s.educationLevel} &middot; SY {s.schoolYear}</p>
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
                    <button type="button" className="dn-btn-danger text-xs py-1 px-2 min-h-[30px]" onClick={() => deactivate(s.id)}>Deactivate</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty title="No sections" body="Create sections before assigning learners to advisory groups." />
        )}
      </div>
    </section>
  );
}

/* ========================================================================
   ENROLLMENTS
   ======================================================================== */

export function AdminEnrollmentsView({ token, users, courses, reload }) {
  const learners = users.filter((u) => u.role === "student" && u.isActive !== false);
  const [courseId, setCourseId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { const data = await apiRequest("/admin/enrollments", { token }); setRows(Array.isArray(data) ? data : []); } catch (_) { setRows([]); } finally { setLoading(false); }
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
        {loading ? <div className="text-center py-6 text-sm text-danilo-text-muted">Loading...</div> : rows.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-danilo-border">
            <table className="w-full text-left text-sm">
              <thead><tr className="bg-danilo-bg"><th className="px-4 py-2.5 dn-overline">Learner</th><th className="px-4 py-2.5 dn-overline">Subject</th><th className="px-4 py-2.5 dn-overline">Section</th><th className="px-4 py-2.5 dn-overline">Actions</th></tr></thead>
              <tbody className="divide-y divide-danilo-border/40">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-danilo-bg/50 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-danilo-text">{r.studentName || r.fullName}</td>
                    <td className="px-4 py-2.5 text-danilo-text-secondary">{r.courseTitle || r.courseCode || r.courseId}</td>
                    <td className="px-4 py-2.5 text-danilo-text-secondary text-xs">{r.sectionName || "—"}</td>
                    <td className="px-4 py-2.5"><button className="dn-btn-danger text-xs py-1 px-2 min-h-[28px]" onClick={() => remove(r.id)}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty title="No enrollments" body="Enroll learners into subjects to begin tracking progress." />}
      </div>
    </section>
  );
}

/* ========================================================================
   ASSIGNMENTS
   ======================================================================== */

export function AdminAssignmentsView({ assignments }) {
  return (
    <section aria-label="Assessments">
      <PageHeader title="Assessments" subtitle="Overview of all assignments and quizzes" />
      {assignments.length === 0 ? (
        <Empty title="No assessments" body="Assessments will appear once faculty creates them." />
      ) : (
        <div className="dn-card p-5">
          <div className="overflow-x-auto rounded-lg border border-danilo-border">
            <table className="w-full text-left text-sm">
              <thead><tr className="bg-danilo-bg"><th className="px-4 py-2.5 dn-overline">Title</th><th className="px-4 py-2.5 dn-overline">Subject</th><th className="px-4 py-2.5 dn-overline">Type</th><th className="px-4 py-2.5 dn-overline">Points</th><th className="px-4 py-2.5 dn-overline">Due</th></tr></thead>
              <tbody className="divide-y divide-danilo-border/40">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-danilo-bg/50 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-danilo-text">{a.title}</td>
                    <td className="px-4 py-2.5 text-danilo-text-secondary">{a.courseTitle || a.subject || "—"}</td>
                    <td className="px-4 py-2.5"><Badge>{a.type || "Assignment"}</Badge></td>
                    <td className="px-4 py-2.5 text-danilo-text-secondary">{a.points ?? "—"}</td>
                    <td className="px-4 py-2.5 text-danilo-text-muted text-xs">{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

/* ========================================================================
   DEPARTMENTS
   ======================================================================== */

export function DepartmentsView({ token, reload }) {
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ name: "" });
  const [edit, setEdit] = useState(null);

  async function load() {
    try { const data = await apiRequest("/admin/departments", { token }); setDepartments(Array.isArray(data) ? data : []); } catch (_) { setDepartments([]); }
  }

  useEffect(() => { load(); }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (edit) { await apiRequest(`/admin/departments/${edit.id}`, { method: "PUT", token, body: form }); setEdit(null); }
    else { await apiRequest("/admin/departments", { method: "POST", token, body: form }); }
    setForm({ name: "" });
    await load(); reload();
  }

  return (
    <section className="space-y-5" aria-label="Department Management">
      <PageHeader title="Departments" subtitle="Organize faculty by department" />
      <div className="dn-card p-5">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Field label="Department Name" className="flex-1">
            <input className="dn-input" value={form.name} onChange={(e) => setForm({ name: e.target.value })} required />
          </Field>
          <div className="flex items-end">
            <button className="dn-btn-primary">{edit ? "Save" : "Create"}</button>
          </div>
        </form>
      </div>
      <div className="dn-card p-5">
        <SectionHeader title="Departments" subtitle={departments.length ? `${departments.length} total` : "No departments yet"} />
        {departments.length > 0 ? (
          <div className="grid gap-2">
            {departments.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border border-danilo-border px-4 py-3 bg-danilo-surface">
                <span className="text-sm font-medium text-danilo-text">{d.name}</span>
                <div className="flex gap-2">
                  <button className="dn-btn-secondary text-xs py-1 px-2 min-h-[28px]" onClick={() => { setEdit(d); setForm({ name: d.name }); }}>Edit</button>
                  <button className="dn-btn-danger text-xs py-1 px-2 min-h-[28px]" onClick={async () => { await apiRequest(`/admin/departments/${d.id}`, { method: "DELETE", token }); await load(); reload(); }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        ) : <Empty title="No departments" body="Create departments to group faculty and subjects." />}
      </div>
    </section>
  );
}

/* ========================================================================
   REPORTS
   ======================================================================== */

export function ReportsView({ token, dashboard }) {
  return (
    <section aria-label="Reports">
      <PageHeader title="Reports" subtitle="Download school data exports" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <button onClick={() => downloadReport("/admin/reports/users", "learners-faculty.csv", token)} className="dn-card p-4 text-left hover:shadow-md transition">
          <div className="w-10 h-10 rounded-xl bg-danilo-primary-subtle flex items-center justify-center mb-3 text-danilo-primary">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
          </div>
          <h3 className="text-sm font-semibold text-danilo-text">Learners & Faculty</h3>
          <p className="text-xs text-danilo-text-secondary mt-0.5">CSV export of all accounts</p>
        </button>
        <button onClick={() => downloadReport("/admin/reports/grades", "grades.csv", token)} className="dn-card p-4 text-left hover:shadow-md transition">
          <div className="w-10 h-10 rounded-xl bg-danilo-success-subtle flex items-center justify-center mb-3 text-danilo-success">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
          </div>
          <h3 className="text-sm font-semibold text-danilo-text">Grades</h3>
          <p className="text-xs text-danilo-text-secondary mt-0.5">CSV export of all grade records</p>
        </button>
        <button onClick={() => downloadReport("/admin/reports/courses", "subjects.csv", token)} className="dn-card p-4 text-left hover:shadow-md transition">
          <div className="w-10 h-10 rounded-xl bg-danilo-bg flex items-center justify-center mb-3 text-danilo-text-secondary">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
          </div>
          <h3 className="text-sm font-semibold text-danilo-text">Subjects</h3>
          <p className="text-xs text-danilo-text-secondary mt-0.5">CSV export of subject catalog</p>
        </button>
      </div>
    </section>
  );
}

/* ========================================================================
   SYSTEM STATUS
   ======================================================================== */

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
      addToast?.(e.message || "Failed to load system status", "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadLogs() {
    try { const data = await apiRequest("/admin/logs", { token }); setLogs(Array.isArray(data) ? data : []); } catch (_) { setLogs([]); }
  }

  useEffect(() => { load(); loadLogs(); const id = setInterval(load, 30000); return () => clearInterval(id); }, [token]);

  if (loading && !status) {
    return (
      <section aria-label="System Status">
        <PageHeader title="System Status" subtitle="Monitoring DANILO server health" />
        <div className="dn-card p-8 text-center text-sm text-danilo-text-muted">Loading system status...</div>
      </section>
    );
  }

  const cards = [
    { label: "CPU Usage", value: status?.cpu != null ? `${status.cpu}%` : "—", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5M16.5 21v-1.5M7.5 21v-1.5M18 10.5h1.5M3.75 10.5h1.5M18 7.5h1.5M3.75 7.5h1.5M12 18v-1.5m0-13.5V6" /></svg>, tone: "primary" },
    { label: "Memory", value: status?.memory != null ? `${status.memory}%` : "—", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" /></svg>, tone: "primary" },
    { label: "Disk", value: status?.disk != null ? `${status.disk}%` : "—", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>, tone: "primary" },
    { label: "Uptime", value: status?.uptime || "—", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, tone: "success" },
  ];

  return (
    <section className="space-y-5" aria-label="System Status">
      <PageHeader title="System Status" subtitle="Monitor DANILO server and AI model health">
        <button onClick={load} className="dn-btn-secondary text-xs">Refresh</button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => <SummaryCard key={c.label} label={c.label} value={c.value} icon={c.icon} tone={c.tone} />)}
      </div>

      {status?.aiStatus && (
        <div className="dn-card p-4">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${status.aiStatus.ready ? "bg-danilo-success" : "bg-danilo-error"}`} />
            <div>
              <p className="text-sm font-medium text-danilo-text">AI Model: {status.aiStatus.model || "DANILO"}</p>
              <p className="text-xs text-danilo-text-secondary mt-0.5">{status.aiStatus.ready ? "Ready for offline inference" : status.aiStatus.message || "Not available"}</p>
            </div>
          </div>
        </div>
      )}

      <div className="dn-card p-5">
        <SectionHeader title="Recent Logs" subtitle="Latest system events" />
        {logs.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-danilo-border max-h-[400px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-danilo-bg"><tr><th className="px-4 py-2 dn-overline">Time</th><th className="px-4 py-2 dn-overline">Level</th><th className="px-4 py-2 dn-overline">Message</th></tr></thead>
              <tbody className="divide-y divide-danilo-border/40">
                {logs.map((l, i) => (
                  <tr key={i} className="hover:bg-danilo-bg/50">
                    <td className="px-4 py-2 text-danilo-text-secondary whitespace-nowrap">{l.time ? new Date(l.time).toLocaleString() : "—"}</td>
                    <td className="px-4 py-2"><Badge tone={l.level === "ERROR" ? "red" : l.level === "WARN" ? "yellow" : "green"}>{l.level}</Badge></td>
                    <td className="px-4 py-2 text-danilo-text">{l.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty title="No logs" body="System logs will appear here." />}
      </div>
    </section>
  );
}

/* ========================================================================
   ANNOUNCEMENTS
   ======================================================================== */

export function AdminAnnouncementsView({ token, reload }) {
  const [form, setForm] = useState({ title: "", body: "" });
  const [items, setItems] = useState([]);

  async function load() {
    try { const data = await apiRequest("/admin/announcements", { token }); setItems(Array.isArray(data) ? data : []); } catch (_) { setItems([]); }
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
          <Field label="Body"><textarea className="dn-input" rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required /></Field>
          <div className="flex justify-end"><button className="dn-btn-primary">Post Announcement</button></div>
        </form>
      </div>
      <div className="space-y-3">
        {items.length === 0 && <Empty title="No announcements" body="Posted announcements will appear here." />}
        {items.map((item) => (
          <div key={item.id} className="dn-card p-4">
            <p className="text-sm font-semibold text-danilo-text">{item.title}</p>
            <p className="text-sm text-danilo-text-secondary mt-1 whitespace-pre-wrap">{item.body}</p>
            <p className="text-xs text-danilo-text-muted mt-2">{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TeacherAnnouncementsView({ token, courses, reload }) {
  const [form, setForm] = useState({ courseId: "", title: "", body: "" });
  const [items, setItems] = useState([]);

  async function load() {
    try { const data = await apiRequest("/teacher/announcements", { token }); setItems(Array.isArray(data) ? data : []); } catch (_) { setItems([]); }
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
          <Field label="Body"><textarea className="dn-input" rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required /></Field>
          <div className="flex justify-end"><button className="dn-btn-primary">Post Announcement</button></div>
        </form>
      </div>
      <div className="space-y-3">
        {items.length === 0 && <Empty title="No announcements" body="Posted announcements will appear here." />}
        {items.map((item) => (
          <div key={item.id} className="dn-card p-4">
            <p className="text-sm font-semibold text-danilo-text">{item.title}</p>
            <p className="text-xs text-danilo-text-secondary mb-1">{item.courseTitle || item.courseCode || ""}</p>
            <p className="text-sm text-danilo-text-secondary mt-1 whitespace-pre-wrap">{item.body}</p>
            <p className="text-xs text-danilo-text-muted mt-2">{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
