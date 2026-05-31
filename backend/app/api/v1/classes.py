from fastapi import APIRouter, Depends, HTTPException, status, Body, File, Form, UploadFile, Response
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import *
from app.schemas import *
from app.main import *
import math

classes_router = APIRouter(prefix='/api', tags=['classes'])

@classes_router.get('/classes/{course_id}')
def class_detail(course_id: str, current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    course = get_user_class(db, current_user, course_id)
    return serialize_course(course)

@classes_router.get('/classes/{course_id}/stream')
def class_stream(course_id: str, current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> list[dict]:
    course = get_user_class(db, current_user, course_id)
    rows = db.execute(select(StreamPost, User).join(User, StreamPost.author_id == User.id).where(StreamPost.course_id == course.id).order_by(StreamPost.created_at.desc())).all()
    return [{'id': post.id, 'title': post.title, 'body': post.body, 'postType': post.post_type, 'createdAt': post.created_at.isoformat() if post.created_at else '', 'courseId': course.id, 'courseCode': course.code, 'courseTitle': course.title, 'authorName': author.full_name} for post, author in rows]

@classes_router.get('/classes/{course_id}/classwork')
def class_classwork(course_id: str, current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    course = get_user_class(db, current_user, course_id)
    modules = build_content_tree(db, user=current_user)
    modules = [item for item in modules if item['courseId'] == course.id]
    assignment_rows = db.scalars(select(Assignment).where(Assignment.course_id == course.id, Assignment.is_active == True).order_by(Assignment.created_at.desc())).all()
    submissions_by_assignment = {}
    if current_user.role == 'student':
        submissions = db.scalars(select(Submission).join(Assignment, Submission.assignment_id == Assignment.id).where(Assignment.course_id == course.id, Submission.student_id == current_user.id)).all()
        submissions_by_assignment = {item.assignment_id: item for item in submissions}
    assignments = []
    for item in assignment_rows:
        submission = submissions_by_assignment.get(item.id)
        questions = db.scalars(select(AssignmentQuestion).where(AssignmentQuestion.assignment_id == item.id).order_by(AssignmentQuestion.id.asc())).all()
        questions_data = [{'id': q.id, 'sectionName': q.section_name or '', 'questionText': q.question_text, 'type': q.question_type, 'choicesJson': q.choices_json or '', 'answerKey': q.answer_key or '', 'points': q.points} for q in questions]
        assignments.append({
            'id': item.id, 'courseId': course.id, 'title': item.title, 'instructions': item.instructions, 'points': item.points, 
            'dueAt': item.due_at.isoformat() if item.due_at else None, 'createdAt': item.created_at.isoformat() if item.created_at else '', 
            'assignmentType': item.assignment_type, 'attachmentsJson': item.attachments_json, 'questions': questions_data,
            'submission': {'status': submission.status, 'responseText': submission.response_text or '', 'answersJson': submission.answers_json, 'attachmentsJson': submission.attachments_json, 'score': submission.score, 'feedback': submission.feedback or ''} if submission else None
        })
    quiz_rows = db.scalars(select(Quiz).where(Quiz.course_id == course.id, Quiz.is_published == True).order_by(Quiz.created_at.desc())).all()
    attempts_by_quiz = {}
    if current_user.role == 'student':
        attempts = db.scalars(select(QuizAttempt).join(Quiz, QuizAttempt.quiz_id == Quiz.id).where(Quiz.course_id == course.id, QuizAttempt.student_id == current_user.id).order_by(QuizAttempt.submitted_at.desc())).all()
        for attempt in attempts:
            attempts_by_quiz.setdefault(attempt.quiz_id, attempt)
    quizzes = []
    for quiz in quiz_rows:
        questions = db.scalars(select(QuizQuestion).where(QuizQuestion.quiz_id == quiz.id).order_by(QuizQuestion.id.asc())).all()
        attempt = attempts_by_quiz.get(quiz.id)
        quizzes.append({'id': quiz.id, 'courseId': course.id, 'title': quiz.title, 'instructions': quiz.instructions, 'createdAt': quiz.created_at.isoformat() if quiz.created_at else '', 'attempt': {'id': attempt.id, 'score': attempt.score, 'submittedAt': attempt.submitted_at.isoformat() if attempt.submitted_at else ''} if attempt else None, 'questions': [{'id': question.id, 'questionText': question.question_text, 'choicesJson': question.choices_json or '', 'points': question.points} for question in questions]})
    return {'course': serialize_course(course), 'modules': modules, 'assignments': assignments, 'quizzes': quizzes}

@classes_router.get('/classes/{course_id}/people')
def class_people(course_id: str, current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    course = get_user_class(db, current_user, course_id)
    rows = db.execute(select(User, Enrollment).join(Enrollment, Enrollment.student_id == User.id).where(Enrollment.course_id == course.id, Enrollment.status == 'active').order_by(User.full_name.asc())).all()
    return {'teacher': serialize_user(course.teacher) if course.teacher else None, 'students': [{**serialize_user(student), 'enrollmentStatus': enrollment.status} for student, enrollment in rows]}

@classes_router.get('/classes/{course_id}/grades')
def class_grades(course_id: str, current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    course = get_user_class(db, current_user, course_id)
    if current_user.role == 'student':
        grades = db.scalars(select(GradeEntry).where(GradeEntry.course_id == course.id, GradeEntry.student_id == current_user.id).order_by(GradeEntry.created_at.asc())).all()
        return {'course': serialize_course(course), 'entries': [{'id': grade.id, 'term': grade.term, 'component': grade.component, 'score': grade.score, 'maxScore': grade.max_score, 'weight': grade.weight, 'remarks': grade.remarks or ''} for grade in grades], 'grades': summarize_grade_entries(course, grades)}
    grades = db.execute(select(GradeEntry, User).join(User, GradeEntry.student_id == User.id).where(GradeEntry.course_id == course.id).order_by(User.full_name.asc(), GradeEntry.created_at.asc())).all()
    by_student: dict[int, list[GradeEntry]] = {}
    names: dict[int, str] = {}
    for grade, student in grades:
        by_student.setdefault(student.id, []).append(grade)
        names[student.id] = student.full_name
    summaries = []
    for student_id, rows in by_student.items():
        for item in summarize_grade_entries(course, rows, names.get(student_id)):
            item['studentId'] = student_id
            summaries.append(item)
    return {'course': serialize_course(course), 'entries': [{'id': grade.id, 'studentId': student.id, 'studentName': student.full_name, 'term': grade.term, 'component': grade.component, 'score': grade.score, 'maxScore': grade.max_score, 'weight': grade.weight, 'remarks': grade.remarks or ''} for grade, student in grades], 'grades': summaries}


@classes_router.get('/metadata')
def get_metadata() -> dict:
    return {
        "gradeLevels": {
            "Junior High School": ["Grade 7", "Grade 8", "Grade 9", "Grade 10"],
            "Senior High School": ["Grade 11", "Grade 12"]
        },
        "strands": ["STEM", "ABM", "HUMSS", "GAS", "TVL", "Sports", "Arts & Design"],
        "roles": ["student", "teacher", "admin"],
        "subjects": [
            "Pre-Calculus", "General Chemistry 1", "Statistics and Probability", 
            "Reading and Writing Skills", "Empowerment Technologies", 
            "21st Century Literature", "Physical Education and Health"
        ]
    }
