from fastapi import APIRouter, Depends, HTTPException, status, Body, File, Form, UploadFile, Response
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import *
from app.schemas import *
from app.main import *
import math

student_router = APIRouter(prefix='/api', tags=['student'], dependencies=[Depends(RoleChecker(['student']))])

@student_router.get('/student/dashboard')
def student_dashboard(current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    result = dashboard(current_user, db)
    result['assignments'] = student_assignments(current_user, db)
    return result

@student_router.get('/student/courses')
def student_courses(current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> list[dict]:
    return build_student_course_cards(db, current_user.id)

@student_router.get('/student/grades')
def student_grades(current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> list[dict]:
    return build_grade_summary(db, current_user.id)

@student_router.get('/student/assignments')
def student_assignments(current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> list[dict]:
    rows = db.execute(select(Assignment, Course).join(Course, Assignment.course_id == Course.id).join(Enrollment, Enrollment.course_id == Course.id).where(Enrollment.student_id == current_user.id, Enrollment.status == 'active', Assignment.is_active == True).order_by(Assignment.created_at.desc())).all()
    submissions = {item.assignment_id: item for item in db.scalars(select(Submission).where(Submission.student_id == current_user.id)).all()}
    
    result = []
    for assignment, course in rows:
        sub = submissions.get(assignment.id)
        
        questions = db.scalars(select(AssignmentQuestion).where(AssignmentQuestion.assignment_id == assignment.id).order_by(AssignmentQuestion.id.asc())).all()
        questions_data = [{'id': q.id, 'questionText': q.question_text, 'type': q.question_type, 'choicesJson': q.choices_json or '', 'answerKey': q.answer_key or '', 'points': q.points} for q in questions]

        result.append({
            'id': assignment.id, 'courseId': course.id, 'courseCode': course.code, 'courseTitle': course.title, 
            'title': assignment.title, 'instructions': assignment.instructions, 'points': assignment.points, 
            'assignmentType': assignment.assignment_type, 'assignmentAttachmentsJson': assignment.attachments_json,
            'questions': questions_data,
            'status': sub.status if sub else 'not_started', 
            'responseText': sub.response_text if sub else '',
            'answersJson': sub.answers_json if sub else None,
            'submissionAttachmentsJson': sub.attachments_json if sub else '[]',
            'score': sub.score if sub else None,
            'feedback': sub.feedback if sub else ''
        })
    return result

@student_router.post('/student/assignments/{assignment_id}/submit')
def student_submit_assignment(assignment_id: str, payload: dict=Body(default={}), current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    assignment = db.get(Assignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail='Assignment not found')
    course = ensure_student_enrolled(db, current_user, assignment.course_id)
    submission = db.scalar(select(Submission).where(Submission.assignment_id == assignment_id, Submission.student_id == current_user.id))
    if not submission:
        submission = Submission(assignment_id=assignment_id, student_id=current_user.id)
        db.add(submission)
        
    submission.response_text = clean_text(payload.get('responseText') or payload.get('response_text'), required=False, max_length=6000)
    
    if 'answersJson' in payload:
        submission.answers_json = json.dumps(payload.get('answersJson'))
    if 'attachmentsJson' in payload:
        submission.attachments_json = json.dumps(payload.get('attachmentsJson'))
        
    submission.status = 'submitted'
    
    answers = payload.get('answersJson') or {}
    questions = db.scalars(select(AssignmentQuestion).where(AssignmentQuestion.assignment_id == assignment.id)).all()
    
    if questions and answers:
        earned_points = 0.0
        for q in questions:
            if q.question_type in ['multiple_choice', 'true_false', 'identification']:
                given = str(answers.get(str(q.id), '')).strip().lower()
                expected = str(q.answer_key or '').strip().lower()
                if expected and given == expected:
                    earned_points += q.points
            elif q.question_type == 'checkbox':
                given_list = answers.get(str(q.id), [])
                if not isinstance(given_list, list): given_list = [given_list]
                given_set = {str(v).strip().lower() for v in given_list}
                
                try:
                    expected_list = json.loads(q.answer_key)
                except:
                    expected_list = [q.answer_key]
                if not isinstance(expected_list, list): expected_list = [expected_list]
                expected_set = {str(v).strip().lower() for v in expected_list if v}
                
                if expected_set and given_set == expected_set:
                    earned_points += q.points
                    
        submission.score = earned_points
        submission.status = 'graded'
        
        grade_entry = db.scalar(select(GradeEntry).where(
            GradeEntry.student_id == current_user.id,
            GradeEntry.course_id == course.id,
            GradeEntry.component == f"Assignment: {assignment.title[:65]}"
        ))
        if grade_entry:
            grade_entry.score = earned_points
        else:
            db.add(GradeEntry(
                student_id=current_user.id,
                course_id=course.id,
                term=course.term,
                component=f"Assignment: {assignment.title[:65]}",
                score=earned_points,
                max_score=assignment.points,
                weight=1.0,
                remarks='',
                recorded_by=current_user.id
            ))
            
    db.commit()
    return {'ok': True, 'submission': {'status': submission.status, 'responseText': submission.response_text, 'answersJson': submission.answers_json, 'attachmentsJson': submission.attachments_json, 'score': submission.score, 'feedback': submission.feedback or ''}}

@student_router.post('/student/assignments/{assignment_id}/upload')
async def student_upload_assignment_file(assignment_id: str, file: UploadFile=File(...), current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    assignment = db.get(Assignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail='Assignment not found')
    ensure_student_enrolled(db, current_user, assignment.course_id)
    upload_dir = os.path.join(os.getcwd(), 'data', 'uploads')
    os.makedirs(upload_dir, exist_ok=True)
    import uuid
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    safe_filename = f"{file_id}{ext}"
    filepath = os.path.join(upload_dir, safe_filename)
    with open(filepath, "wb") as f:
        f.write(await file.read())
    return {'ok': True, 'filename': file.filename, 'url': f"/api/uploads/{safe_filename}"}

@student_router.post('/student/assignments/{assignment_id}/complete')
def student_complete_assignment(assignment_id: str, current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    assignment = db.get(Assignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail='Assignment not found')
    ensure_student_enrolled(db, current_user, assignment.course_id)
    submission = db.scalar(select(Submission).where(Submission.assignment_id == assignment_id, Submission.student_id == current_user.id))
    if not submission:
        submission = Submission(assignment_id=assignment_id, student_id=current_user.id)
        db.add(submission)
    submission.status = 'completed'
    db.commit()
    return {'ok': True, 'submission': {'status': submission.status, 'responseText': submission.response_text or '', 'score': submission.score, 'feedback': submission.feedback or ''}}

@student_router.post('/student/quizzes/{quiz_id}/submit')
def student_submit_quiz(quiz_id: str, payload: dict=Body(default={}), current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    quiz = db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail='Quiz not found')
    if not quiz.is_published:
        raise HTTPException(status_code=400, detail='Quiz is not yet published')
    ensure_student_enrolled(db, current_user, quiz.course_id)
    questions = db.scalars(select(QuizQuestion).where(QuizQuestion.quiz_id == quiz_id).order_by(QuizQuestion.id.asc())).all()
    if not questions:
        raise HTTPException(status_code=400, detail='Quiz has no questions')
    answers = payload.get('answers') or {}
    total_points = 0.0
    earned_points = 0.0
    per_question = []
    for question in questions:
        total_points += question.points or 1
        given = str(answers.get(str(question.id), '')).strip().lower()
        expected = str(question.answer_key or '').strip().lower()
        correct = expected and given == expected
        if correct:
            earned_points += question.points or 1
        per_question.append({'questionId': question.id, 'questionText': question.question_text[:120], 'givenAnswer': given, 'correctAnswer': expected, 'correct': correct, 'points': question.points or 1})
    score_pct = round(earned_points / total_points * 100, 1) if total_points > 0 else 0.0
    attempt = QuizAttempt(quiz_id=quiz_id, student_id=current_user.id, answers_json=json.dumps(answers), score=score_pct, submitted_at=datetime.now(timezone.utc))
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return {'ok': True, 'attemptId': attempt.id, 'score': score_pct, 'earnedPoints': earned_points, 'totalPoints': total_points, 'questions': per_question}

