import os
import json
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import AIConversation, Assignment, Course, Enrollment, GradeEntry, Module, Quiz, QuizAttempt, QuizQuestion, Submission, User

LOW_SCORE_THRESHOLD = float(os.getenv("DANILO_LOW_SCORE_THRESHOLD", "75.0"))
ATTENTION_THRESHOLD = float(os.getenv("DANILO_ATTENTION_THRESHOLD", "80.0"))
RISK_THRESHOLD = float(os.getenv("DANILO_RISK_THRESHOLD", "75.0"))


def percentage(score: float | None, max_score: float | None) -> float | None:
    if score is None or not max_score:
        return None
    return max(0.0, min(100.0, (float(score) / float(max_score)) * 100.0))


def average(values: list[float]) -> float | None:
    return sum(values) / len(values) if values else None


def topic_label(value: str | None, fallback: str) -> str:
    text = " ".join(str(value or fallback).replace("\r", " ").replace("\n", " ").split())
    return text[:80] or fallback


def status_from_signals(avg_score: float | None, low_count: int, missing_count: int, repeated_incorrect: int) -> str:
    if avg_score is None and missing_count >= 2:
        return "At Risk"
    if (avg_score is not None and avg_score < RISK_THRESHOLD) or low_count >= 2 or missing_count >= 2 or repeated_incorrect >= 3:
        return "At Risk"
    if (avg_score is not None and avg_score < ATTENTION_THRESHOLD) or low_count >= 1 or missing_count >= 1 or repeated_incorrect >= 1:
        return "Needs Attention"
    return "Doing Well"


def action_for(status: str, weak_topic: str | None, missing_count: int) -> str:
    if status == "At Risk":
        if missing_count:
            return "Schedule a quick check-in and help the learner complete missing work."
        return f"Run a short remediation activity on {weak_topic or 'the weak topic'}."
    if status == "Needs Attention":
        return f"Give targeted practice on {weak_topic or 'recent lessons'} and monitor the next task."
    return "Keep the learner engaged with enrichment or peer support tasks."


def analyze_student_performance(db: Session, class_id: str) -> dict:
    course = db.get(Course, class_id)
    if not course:
        return {"course": None, "students": [], "classWeakTopics": [], "stats": {}}

    enrolled_students = (
        db.execute(
            select(User)
            .join(Enrollment, Enrollment.student_id == User.id)
            .where(Enrollment.course_id == class_id, Enrollment.status == "active", User.role == "student")
            .order_by(User.full_name.asc())
        )
        .scalars()
        .all()
    )
    assignments = db.scalars(select(Assignment).where(Assignment.course_id == class_id, Assignment.is_active == True)).all()
    submissions = db.scalars(select(Submission).join(Assignment, Submission.assignment_id == Assignment.id).where(Assignment.course_id == class_id)).all()
    submissions_by_student = {(item.student_id, item.assignment_id): item for item in submissions}
    grades = db.scalars(select(GradeEntry).where(GradeEntry.course_id == class_id).order_by(GradeEntry.created_at.asc())).all()
    grade_rows_by_student: dict[int, list[GradeEntry]] = {}
    for grade in grades:
        grade_rows_by_student.setdefault(grade.student_id, []).append(grade)

    quiz_rows = db.execute(select(QuizAttempt, Quiz).join(Quiz, QuizAttempt.quiz_id == Quiz.id).where(Quiz.course_id == class_id)).all()
    ai_rows = db.scalars(select(AIConversation).where(AIConversation.course_id == class_id)).all()
    ai_count_by_student: dict[int, int] = {}
    for conversation in ai_rows:
        ai_count_by_student[conversation.student_id] = ai_count_by_student.get(conversation.student_id, 0) + 1
    quiz_questions = db.scalars(select(QuizQuestion).join(Quiz, QuizQuestion.quiz_id == Quiz.id).where(Quiz.course_id == class_id)).all()
    questions_by_quiz: dict[int, list[QuizQuestion]] = {}
    for question in quiz_questions:
        questions_by_quiz.setdefault(question.quiz_id, []).append(question)
    quiz_max_by_id = {quiz_id: sum(question.points or 1 for question in questions) or None for quiz_id, questions in questions_by_quiz.items()}

    assignment_questions = db.scalars(select(AssignmentQuestion).join(Assignment, AssignmentQuestion.assignment_id == Assignment.id).where(Assignment.course_id == class_id)).all()
    questions_by_assignment: dict[str, list[AssignmentQuestion]] = {}
    for question in assignment_questions:
        questions_by_assignment.setdefault(question.assignment_id, []).append(question)

    modules = db.scalars(select(Module).where(Module.course_id == class_id).order_by(Module.week.asc(), Module.sequence_order.asc())).all()
    module_topics = [topic_label(module.title or module.learning_competency, course.subject) for module in modules]

    topic_scores: dict[str, list[float]] = {}
    class_topic_risk: dict[str, float] = {}
    students = []
    now = datetime.now(timezone.utc)

    for student in enrolled_students:
        score_values: list[float] = []
        low_scores = 0
        student_topic_scores: dict[str, list[float]] = {}
        history_grades = []
        history_assignments = []
        missing_count = 0
        repeated_incorrect = 0

        for grade in grade_rows_by_student.get(student.id, []):
            pct = percentage(grade.score, grade.max_score)
            if pct is None:
                continue
            topic = topic_label(grade.component, course.subject)
            score_values.append(pct)
            student_topic_scores.setdefault(topic, []).append(pct)
            topic_scores.setdefault(topic, []).append(pct)
            if pct < LOW_SCORE_THRESHOLD:
                low_scores += 1
            history_grades.append({"id": grade.id, "topic": topic, "term": grade.term, "score": grade.score, "maxScore": grade.max_score, "percentage": round(pct, 1), "remarks": grade.remarks or ""})

        for assignment in assignments:
            submission = submissions_by_student.get((student.id, assignment.id))
            is_missing = submission is None or submission.status not in {"submitted", "completed", "graded"}
            if is_missing:
                missing_count += 1
                topic = topic_label(assignment.title, course.subject)
                class_topic_risk[topic] = class_topic_risk.get(topic, 0) + 1
            else:
                try:
                    answers = json.loads(submission.answers_json or "{}")
                except json.JSONDecodeError:
                    answers = {}
                for question in questions_by_assignment.get(assignment.id, []):
                    given = str(answers.get(str(question.id), answers.get(question.id, ""))).strip().lower() if isinstance(answers, dict) else ""
                    expected = str(question.answer_key or "").strip().lower()
                    if expected and given and given != expected:
                        repeated_incorrect += 1
                        q_topic = topic_label(question.section_name or question.question_text, assignment.title)
                        class_topic_risk[q_topic] = class_topic_risk.get(q_topic, 0) + 1

            history_assignments.append({"id": assignment.id, "title": assignment.title, "points": assignment.points, "status": submission.status if submission else "missing", "submittedAt": submission.submitted_at.isoformat() if submission and submission.submitted_at else None})

        for attempt, quiz in quiz_rows:
            if attempt.student_id != student.id:
                continue
            quiz_pct = percentage(attempt.score, quiz_max_by_id.get(quiz.id) or 100)
            if quiz_pct is not None:
                topic = topic_label(quiz.title, course.subject)
                score_values.append(quiz_pct)
                student_topic_scores.setdefault(topic, []).append(quiz_pct)
                topic_scores.setdefault(topic, []).append(quiz_pct)
                if quiz_pct < LOW_SCORE_THRESHOLD:
                    low_scores += 1
            try:
                answers = json.loads(attempt.answers_json or "{}")
            except json.JSONDecodeError:
                answers = {}
            for question in questions_by_quiz.get(quiz.id, []):
                given = str(answers.get(str(question.id), answers.get(question.id, ""))).strip().lower() if isinstance(answers, dict) else ""
                expected = str(question.answer_key or "").strip().lower()
                if expected and given and given != expected:
                    repeated_incorrect += 1
                    q_topic = topic_label(question.question_text, quiz.title)
                    class_topic_risk[q_topic] = class_topic_risk.get(q_topic, 0) + 1

        avg_score = average(score_values)
        weak_topic = None
        weak_topic_score = None
        if student_topic_scores:
            topic_avgs = [(topic, average(values) or 0.0) for topic, values in student_topic_scores.items()]
            weak_topic, weak_topic_score = min(topic_avgs, key=lambda item: item[1])
        elif missing_count and assignments:
            weak_topic = topic_label(assignments[0].title, course.subject)
        elif module_topics:
            weak_topic = module_topics[0]

        status = status_from_signals(avg_score, low_scores, missing_count, repeated_incorrect)
        risk_reasons = []
        if avg_score is not None and avg_score < ATTENTION_THRESHOLD:
            risk_reasons.append(f"Average score is {avg_score:.1f}%.")
        if low_scores:
            risk_reasons.append(f"{low_scores} low score{'s' if low_scores != 1 else ''}.")
        if missing_count:
            risk_reasons.append(f"{missing_count} missing submission{'s' if missing_count != 1 else ''}.")
        if repeated_incorrect:
            risk_reasons.append(f"{repeated_incorrect} repeated incorrect quiz answer{'s' if repeated_incorrect != 1 else ''}.")
        if not risk_reasons:
            risk_reasons.append("No major risk signals detected.")

        students.append(
            {
                "studentId": student.id,
                "studentName": student.full_name,
                "username": student.username,
                "averageScore": round(avg_score, 1) if avg_score is not None else None,
                "status": status,
                "weakestTopic": weak_topic,
                "weakestTopicScore": round(weak_topic_score, 1) if weak_topic_score is not None else None,
                "lowScoreCount": low_scores,
                "missingSubmissionCount": missing_count,
                "repeatedIncorrectCount": repeated_incorrect,
                "aiInteractionCount": ai_count_by_student.get(student.id, 0),
                "lastAnalyzedAt": now.isoformat(),
                "explanation": " ".join(risk_reasons),
                "recommendedAction": action_for(status, weak_topic, missing_count),
                "history": {"grades": history_grades, "assignments": history_assignments},
            }
        )

    class_topic_rows = []
    for topic, values in topic_scores.items():
        avg_topic = average(values)
        if avg_topic is not None:
            class_topic_rows.append({"topic": topic, "averageScore": round(avg_topic, 1), "riskCount": 0})
    for topic, count in class_topic_risk.items():
        existing = next((item for item in class_topic_rows if item["topic"] == topic), None)
        if existing:
            existing["riskCount"] += int(count)
        else:
            class_topic_rows.append({"topic": topic, "averageScore": None, "riskCount": int(count)})
    class_topic_rows = sorted(class_topic_rows, key=lambda item: ((item["averageScore"] if item["averageScore"] is not None else 101), -item["riskCount"], item["topic"]))[:8]

    struggling = [item for item in students if item["status"] in {"At Risk", "Needs Attention"}]
    avg_values = [item["averageScore"] for item in students if item["averageScore"] is not None]
    return {
        "course": {"id": course.id, "code": course.code, "title": course.title, "subject": course.subject},
        "students": students,
        "strugglingStudents": struggling,
        "classWeakTopics": class_topic_rows,
        "stats": {
            "studentCount": len(students),
            "strugglingCount": len(struggling),
            "atRiskCount": len([item for item in students if item["status"] == "At Risk"]),
            "needsAttentionCount": len([item for item in students if item["status"] == "Needs Attention"]),
            "classAverage": round(average(avg_values), 1) if avg_values else None,
            "missingSubmissions": sum(item["missingSubmissionCount"] for item in students),
        },
    }
