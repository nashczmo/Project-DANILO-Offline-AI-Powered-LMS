import { PageHeader, Card } from "../../components/ui";
import { GraduationCap, Award } from "lucide-react";

export default function StudentGrades() {
  const grades = [
    {
      subject: "Science 10",
      written: 88,
      performance: 92,
      quarterly: 85,
      final: 89,
      quarter: "Q1"
    },
    {
      subject: "Araling Panlipunan 10",
      written: 90,
      performance: 85,
      quarterly: 88,
      final: 87,
      quarter: "Q1"
    },
    {
      subject: "Mathematics 10",
      written: 82,
      performance: 80,
      quarterly: 85,
      final: 82,
      quarter: "Q1"
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Grades & Assessments" 
        description="Track your academic performance across Written Works, Performance Tasks, and Quarterly Assessments."
      />

      <Card>
        <div className="flex items-center gap-2 mb-6">
          <GraduationCap className="w-6 h-6 text-danilo-primary" />
          <h2 className="text-xl font-bold text-danilo-text">Quarter 1 Overview</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-danilo-border bg-danilo-bg-secondary">
                <th className="p-3 text-sm font-semibold text-danilo-text">Subject</th>
                <th className="p-3 text-sm font-semibold text-danilo-text">Written Works (30%)</th>
                <th className="p-3 text-sm font-semibold text-danilo-text">Performance Tasks (50%)</th>
                <th className="p-3 text-sm font-semibold text-danilo-text">Quarterly (20%)</th>
                <th className="p-3 text-sm font-semibold text-danilo-text">Initial Grade</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((g, i) => (
                <tr key={i} className="border-b border-danilo-border hover:bg-danilo-bg-secondary/50 transition-colors">
                  <td className="p-3 font-medium text-danilo-text">{g.subject}</td>
                  <td className="p-3 text-danilo-text-secondary">{g.written}</td>
                  <td className="p-3 text-danilo-text-secondary">{g.performance}</td>
                  <td className="p-3 text-danilo-text-secondary">{g.quarterly}</td>
                  <td className="p-3 font-bold text-danilo-primary flex items-center gap-2">
                    {g.final}
                    {g.final >= 85 && <Award className="w-4 h-4 text-orange-500" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100">
           <h3 className="font-bold text-indigo-900 mb-2">Grading System (DepEd Order No. 8, s. 2015)</h3>
           <ul className="text-sm text-indigo-800 space-y-1 list-disc list-inside">
             <li><strong>Written Works</strong> ensure students can express skills and concepts in written form.</li>
             <li><strong>Performance Tasks</strong> let learners show what they know and can do in diverse ways.</li>
             <li><strong>Quarterly Assessments</strong> measure student learning at the end of the quarter.</li>
           </ul>
        </Card>
      </div>
    </div>
  );
}
