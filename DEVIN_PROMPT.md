# Devin Prompt: Project DANILO Production Deployment

**Project:** nashczmo/Project-DANILO-Offline-AI-Powered-LMS  
**Goal:** Make the codebase fully production-ready with no blockers, robust UI/UX, and smooth deployment.

---

## CRITICAL BLOCKERS (Fix First)

### 1. Missing Inter Fonts
- **Issue:** Build fails if fonts missing in `assets/fonts/`
- **Required files:**
  - `assets/fonts/Inter-Regular.woff2`
  - `assets/fonts/Inter-Medium.woff2`
  - `assets/fonts/Inter-SemiBold.woff2`
  - `assets/fonts/Inter-Bold.woff2`
- **Fix:** Download from [rsms/inter](https://github.com/rsms/inter/releases) or use npm package. Place in `assets/fonts/`.
- **Test:** `npm run build` should complete without font errors.

### 2. Node Version Lock
- **Issue:** Vite 6+ requires Node 18+; build fails on older versions.
- **Fix:** 
  - Create `.nvmrc` with `18` or `18.17.0`
  - Update `frontend/package.json` → add: `"engines": { "node": ">=18.0.0" }`
  - Update README with Node requirement
- **Test:** `node --version` returns v18+

### 3. Missing Public Assets
- **Issue:** Build or runtime fails if missing from `frontend/public/`
- **Required files:**
  - `frontend/public/manifest.webmanifest` ✓ (exists)
  - `frontend/public/sw.js` ✓ (exists)
  - `frontend/public/offline.html` ✗ (MISSING - create)
- **Create offline.html:** Simple HTML fallback for when app is offline/unreachable
- **Test:** `frontend/public/` has all three files

### 4. Package Lock File
- **Issue:** No `package-lock.json` means non-deterministic builds.
- **Fix:** Run `npm install` in `frontend/` and commit `package-lock.json`
- **Test:** `git log --oneline package-lock.json` shows recent commit

---

## HIGH-PRIORITY UI/UX FIXES

### 1. Departments Tab - Full Refactor
**File:** `frontend/src/components/AdminPages.jsx` (lines 488-538)

**Current issues:**
- Silent failures (errors swallowed, no user feedback)
- No loading state
- Form doesn't reset properly on cancel
- Missing code/description fields (backend supports them)

**Fix:** Replace `DepartmentsView` with this structure:
```javascript
export function DepartmentsView({ token, reload }) {
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ name: "", code: "", description: "" });
  const [edit, setEdit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/admin/departments", { token });
      setDepartments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Failed to load departments");
      console.error("[DANILO] Departments load error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (edit) {
        await apiRequest(`/admin/departments/${edit.id}`, 
          { method: "PUT", token, body: form });
        setEdit(null);
      } else {
        await apiRequest("/admin/departments", 
          { method: "POST", token, body: form });
      }
      setForm({ name: "", code: "", description: "" });
      await load();
      reload();
    } catch (err) {
      setError(err?.message || "Failed to save department");
    }
  }

  function startEdit(d) {
    setEdit(d);
    setForm({ name: d.name || "", code: d.code || "", description: d.description || "" });
  }

  function cancelEdit() {
    setEdit(null);
    setForm({ name: "", code: "", description: "" });
    setError("");
  }

  async function handleDelete(id) {
    setError("");
    try {
      await apiRequest(`/admin/departments/${id}`, { method: "DELETE", token });
      await load();
      reload();
    } catch (err) {
      setError(err?.message || "Failed to delete department");
    }
  }

  return (
    <section className="space-y-5" aria-label="Department Management">
      <PageHeader title="Departments" subtitle="Organize faculty by department" />
      
      {error && (
        <div className="rounded-xl bg-danger-50 border border-danger-200 px-4 py-3">
          <p className="text-sm font-medium text-danger-600">{error}</p>
        </div>
      )}

      <div className="dn-card p-5">
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-3">
          <Field label="Department Name">
            <input className="dn-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mathematics" required />
          </Field>
          <Field label="Code">
            <input className="dn-input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. MATH" />
          </Field>
          <Field label="Description">
            <input className="dn-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional notes" />
          </Field>
          <div className="flex gap-2 sm:col-span-3">
            <button type="submit" className="dn-btn-primary">{edit ? "Save Changes" : "Create Department"}</button>
            {edit && <button type="button" className="dn-btn-secondary" onClick={cancelEdit}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className="dn-card p-5">
        <SectionHeader title="All Departments" subtitle={loading ? "Loading..." : departments.length ? `${departments.length} total` : "No departments yet"} />
        {loading ? (
          <div className="text-center py-6 text-sm text-slate-400">Loading departments...</div>
        ) : departments.length > 0 ? (
          <div className="grid gap-2">
            {departments.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 bg-white hover:bg-slate-50 transition">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">{d.name}</p>
                  {d.code && <p className="text-xs text-slate-400 mt-0.5">{d.code}</p>}
                  {d.description && <p className="text-xs text-slate-500 mt-0.5">{d.description}</p>}
                </div>
                <div className="flex gap-2 flex-shrink-0 ml-4">
                  <button className="dn-btn-secondary text-xs py-1 px-2 min-h-[28px]" onClick={() => startEdit(d)}>Edit</button>
                  <button className="dn-btn-danger text-xs py-1 px-2 min-h-[28px]" onClick={() => handleDelete(d.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty title="No departments" body="Create departments to group faculty and subjects." />
        )}
      </div>
    </section>
  );
}
```

**Key improvements:**
- ✅ Error state display in UI
- ✅ Loading indicator
- ✅ Code & description fields
- ✅ Proper form reset on cancel
- ✅ Try/catch on all API calls
- ✅ Console logging for debugging

### 2. Apply Same Pattern to Other Admin Tabs
Apply error handling + loading + validation to:
- `AdminUsersView` - user create/edit/delete
- `AdminClassesView` - class create
- `AdminSectionsView` - section create/edit
- `AdminEnrollmentsView` - enrollment operations

**Pattern:**
- Add `error` and `loading` state
- Show `error` message in red banner if present
- Show loading spinner while fetching
- Wrap all API calls in try/catch
- Reset form on cancel

### 3. Forms & Validation
- Add `required` to mandatory fields
- Add `placeholder` hints on all inputs
- Show inline validation errors (not just silent fails)
- Disable submit button while saving
- Show success toast/snackbar on save

### 4. Mobile Responsiveness
- Test all admin pages on mobile (Chrome DevTools)
- Fix any table overflow with horizontal scroll
- Ensure buttons are touch-friendly (min 44px height)
- Check form layouts stack properly on small screens

### 5. Accessibility
- Add `aria-label` to all icon buttons
- Use semantic HTML (`<section>`, `<article>`, proper headings)
- Test keyboard navigation (Tab, Enter, Escape)
- Make sure error messages announced via `role="alert"`

---

## MEDIUM-PRIORITY IMPROVEMENTS

### 1. Code Quality
- Run ESLint: `npm run lint` (add if missing)
- Run Prettier: `npx prettier --write frontend/src`
- Remove unused imports and dead code
- Add JSDoc comments to major functions

### 2. README Updates
Add sections:
- **Prerequisites:** Node 18+, npm 9+, Docker, fonts required
- **Manual Build:** Steps to build frontend standalone
- **Troubleshooting:** Common errors (missing fonts, Node version, build failures)
- **Deploy:** Instructions for Linux/Docker deployment

### 3. CI/CD Workflow
Create `.github/workflows/build.yml`:
```yaml
name: Build & Test
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend && npm install
      - run: cd frontend && npm run build
      - run: cd frontend && npm run lint (if available)
```

### 4. Testing (Optional but helpful)
Add basic test in `frontend/src/App.test.jsx`:
```javascript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeDefined();
  });
});
```

---

## FINAL ACCEPTANCE CHECKLIST

- [ ] All fonts present (`assets/fonts/Inter-*.woff2`)
- [ ] `frontend/public/offline.html` created and valid
- [ ] `.nvmrc` file created with `18`
- [ ] `package.json` has `"engines": { "node": ">=18.0.0" }`
- [ ] `package-lock.json` committed
- [ ] `npm install && npm run build` completes with no errors
- [ ] DepartmentsView fully refactored with error/loading states
- [ ] All other admin tabs have similar error handling
- [ ] Mobile layouts tested and responsive
- [ ] All forms show validation feedback
- [ ] README updated with prerequisites and troubleshooting
- [ ] `.github/workflows/build.yml` added
- [ ] Lighthouse audit score >80 on main pages
- [ ] No console errors when opening any admin tab
- [ ] Can create/edit/delete departments successfully
- [ ] App works offline after first load

---

## DELIVERY

Commit regularly as you fix issues. Each commit should have a clear message:
- "fix: add Inter fonts"
- "fix: lock Node version to 18"
- "refactor: DepartmentsView with error handling"
- "feat: add offline.html fallback page"
- etc.

Once all checks pass, open a PR to main with summary of changes.

---

**Questions?** Check the GitHub repo or ask for clarification.

Good luck!
