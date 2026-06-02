import { useState, useMemo } from "react";
import { useApi } from "../../hooks/useApi";
import { apiRequest } from "../../api";
import { Card, PageHeader, Skeleton, EmptyState, Button, Badge } from "../../components/ui";
import { FileText, GraduationCap, Plus, Save } from "lucide-react";

export default function TeacherGrades() {
  const { data: courses, loading: coursesLoading } = useApi("/teacher/courses", { immediate: true });
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const {
    data: gradebook,
    loading: gradebookLoading,
    refresh: refreshGradebook,
  } = useApi(
    selectedCourseId ? `/teacher/courses/${selectedCourseId}/gradebook` : null,
    { immediate: !!selectedCourseId }
  );
  
  const [selectedComponent, setSelectedComponent] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newAssignment, setNewAssignment] = useState({ term: "Term 1", component: "", maxScore: 100, weight: 1 });
  
  const [studentGrades, setStudentGrades] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("error");

  const activeCourses = courses || [];

  const uniqueAssignments = useMemo(() => {
    if (!gradebook?.entries) return [];
    const map = new Map();
    gradebook.entries.forEach(e => {
      const key = `${e.term}-${e.component}`;
      if (!map.has(key)) {
        map.set(key, { term: e.term, component: e.component, maxScore: e.maxScore, weight: e.weight });
      }
    });
    return Array.from(map.values());
  }, [gradebook]);

  const handleSelectComponent = (val) => {
    if (val === "NEW") {
      setIsCreating(true);
      setSelectedComponent("");
      setStudentGrades({});
    } else {
      setIsCreating(false);
      setSelectedComponent(val);
      
      // Pre-fill existing grades
      const current = uniqueAssignments.find(a => `${a.term}-${a.component}` === val);
      if (current && gradebook) {
        const gradesMap = {};
        gradebook.students.forEach(s => {
          const entry = gradebook.entries.find(e => e.studentId === s.id && e.term === current.term && e.component === current.component);
          gradesMap[s.id] = {
            score: entry ? entry.score : "",
            remarks: entry ? entry.remarks : "",
            gradeId: entry ? entry.id : null,
          };
        });
        setStudentGrades(gradesMap);
      }
    }
  };

  const handleSaveGrades = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setNotice("");
    
    let targetAssignment = isCreating ? newAssignment : uniqueAssignments.find(a => `${a.term}-${a.component}` === selectedComponent);
    if (!targetAssignment || !targetAssignment.component.trim()) {
      setNoticeType("error");
      setNotice("Please define the assignment details.");
      setSubmitting(false);
      return;
    }

    try {
      const promises = gradebook.students.map(async (student) => {
        const gradeData = studentGrades[student.id];
        if (!gradeData || gradeData.score === "" || gradeData.score === null) return null; // skip empty
        
        const payload = {
          studentId: student.id,
          term: targetAssignment.term,
          component: targetAssignment.component,
          score: parseFloat(gradeData.score) || 0,
          maxScore: parseFloat(targetAssignment.maxScore) || 100,
          weight: parseFloat(targetAssignment.weight) || 1,
          remarks: gradeData.remarks || "",
        };

        if (gradeData.gradeId) {
          return apiRequest(`/teacher/grades/${gradeData.gradeId}`, { method: "PUT", body: payload });
        } else {
          return apiRequest(`/teacher/courses/${selectedCourseId}/grades`, { method: "POST", body: payload });
        }
      });
      
      await Promise.all(promises.filter(p => p !== null));
      
      setNoticeType("success");
      setNotice("Grades successfully recorded!");
      await refreshGradebook();
      setIsCreating(false);
      setSelectedComponent(`${targetAssignment.term}-${targetAssignment.component}`);
      
      // Update local state to map new gradeIds
      const newGradebook = await apiRequest(`/teacher/courses/${selectedCourseId}/gradebook`);
      const gradesMap = {};
      newGradebook.students.forEach(s => {
        const entry = newGradebook.entries.find(e => e.studentId === s.id && e.term === targetAssignment.term && e.component === targetAssignment.component);
        gradesMap[s.id] = {
          score: entry ? entry.score : "",
          remarks: entry ? entry.remarks : "",
          gradeId: entry ? entry.id : null,
        };
      });
      setStudentGrades(gradesMap);
      
    } catch (err) {
      setNoticeType("error");
      setNotice(err.message || "Could not save grades.");
    } finally {
      setSubmitting(false);
    }
  };

  const currentMaxScore = isCreating ? newAssignment.maxScore : (uniqueAssignments.find(a => `${a.term}-${a.component}` === selectedComponent)?.maxScore || 100);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Grades"
        description="Manage and record student grades for your classes per assignment."
      />

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

      <Card>
        <label htmlFor="grade-course-select" className="block text-sm font-black text-[#202124] mb-2">
          Select Class
        </label>
        {coursesLoading ? (
          <Skeleton className="h-10" />
        ) : (
          <select
            id="grade-course-select"
            className="dn-input"
            value={selectedCourseId || ""}
            onChange={(e) => {
              setSelectedCourseId(e.target.value || null);
              setSelectedComponent("");
              setIsCreating(false);
              setNotice("");
            }}
          >
            <option value="">Choose a class…</option>
            {activeCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.subject} - {c.gradeLevel} {c.term} (S.Y. {c.schoolYear || "Unknown"})
              </option>
            ))}
          </select>
        )}
      </Card>

      {selectedCourseId && gradebookLoading && (
        <div className="space-y-4">
          <Skeleton className="h-48" />
        </div>
      )}

      {selectedCourseId && !gradebookLoading && gradebook && (
        <Card className="animate-fade-in">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-black text-[#202124] mb-2">Assignment / Component</label>
              <select
                className="dn-input"
                value={isCreating ? "NEW" : selectedComponent}
                onChange={(e) => handleSelectComponent(e.target.value)}
              >
                <option value="" disabled>Select an assignment...</option>
                {uniqueAssignments.map(a => (
                  <option key={`${a.term}-${a.component}`} value={`${a.term}-${a.component}`}>
                    [{a.term}] {a.component} (Max: {a.maxScore}, Wt: {a.weight})
                  </option>
                ))}
                <option value="NEW">+ Create New Assignment</option>
              </select>
            </div>
          </div>

          {isCreating && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6 p-4 bg-[#F8F9FA] rounded-xl border border-[#E0E0E0]">
              <div>
                <label className="block text-xs font-bold text-[#5F6368] mb-1">Term</label>
                <select className="dn-input" value={newAssignment.term} onChange={e => setNewAssignment({...newAssignment, term: e.target.value})}>
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#5F6368] mb-1">Component Name (e.g. Written Work 1)</label>
                <input className="dn-input" value={newAssignment.component} onChange={e => setNewAssignment({...newAssignment, component: e.target.value})} placeholder="Required" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#5F6368] mb-1">Max Score</label>
                <input type="number" className="dn-input" value={newAssignment.maxScore} onChange={e => setNewAssignment({...newAssignment, maxScore: e.target.value})} min="1" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#5F6368] mb-1">Weight (e.g. 0.3 for 30%)</label>
                <input type="number" step="0.01" className="dn-input" value={newAssignment.weight} onChange={e => setNewAssignment({...newAssignment, weight: e.target.value})} />
              </div>
            </div>
          )}

          {(selectedComponent || isCreating) && (
            <form onSubmit={handleSaveGrades}>
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="w-5 h-5 text-[#1A73E8]" />
                <h3 className="text-base font-black text-[#202124]">Student Submissions</h3>
                <span className="text-sm text-[#9AA0A6] font-bold ml-auto">
                  {gradebook.students?.length || 0} students
                </span>
              </div>
              
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="dn-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th className="w-32">Score</th>
                      <th>Remarks / Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gradebook.students?.map((student) => {
                      const st = studentGrades[student.id] || { score: "", remarks: "" };
                      const pct = st.score !== "" && st.score !== null ? (st.score / currentMaxScore) * 100 : null;
                      return (
                        <tr key={student.id}>
                          <td className="font-bold text-[#202124]">
                            {student.fullName}
                            {pct !== null && (
                               <Badge className="ml-2" color={pct >= 85 ? "success" : pct >= 70 ? "primary" : pct >= 60 ? "warning" : "error"}>
                                 {Math.round(pct)}%
                               </Badge>
                            )}
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={currentMaxScore}
                              className="dn-input py-1.5"
                              value={st.score}
                              onChange={(e) => setStudentGrades(prev => ({ ...prev, [student.id]: { ...prev[student.id], score: e.target.value } }))}
                              placeholder="0"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="dn-input py-1.5"
                              value={st.remarks}
                              onChange={(e) => setStudentGrades(prev => ({ ...prev, [student.id]: { ...prev[student.id], remarks: e.target.value } }))}
                              placeholder="Optional feedback..."
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 flex justify-end">
                <Button type="submit" disabled={submitting}>
                  <Save className="w-4 h-4" />
                  {submitting ? "Saving Grades..." : "Save All Grades"}
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}
    </div>
  );
}
