from fastapi import APIRouter, Depends, HTTPException, status, Body, File, Form, UploadFile, Response
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import *
from app.schemas import *
from app.main import *
import math

admin_router = APIRouter(prefix='/api', tags=['admin'], dependencies=[Depends(RoleChecker(['admin']))])

@admin_router.get('/admin/overview')
def admin_overview(current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    learner_count = db.query(User).filter(User.role == 'student').count()
    faculty_count = db.query(User).filter(User.role == 'teacher').count()
    admin_count = db.query(User).filter(User.role == 'admin').count()
    active_courses = db.query(Course).filter(Course.is_active == True).count()
    enrollment_count = db.query(Enrollment).filter(Enrollment.status == 'active').count()
    module_count = db.query(Module).count()
    grade_count = db.query(GradeEntry).count()
    section_count = db.query(Section).filter(Section.is_active == True).count()
    dept_count = db.query(Department).filter(Department.is_active == True).count()
    chat_session_count = db.query(ChatSession).count()
    chat_message_count = db.query(ChatMessage).count()
    ai_convo_count = db.query(AIConversation).count()
    return {'totals': {'learners': learner_count, 'faculty': faculty_count, 'admins': admin_count, 'classes': active_courses, 'enrollments': enrollment_count, 'modules': module_count, 'grades': grade_count, 'sections': section_count, 'departments': dept_count, 'chatSessions': chat_session_count, 'chatMessages': chat_message_count, 'aiConversations': ai_convo_count}, 'system': {'portalUrl': f'http://{PORTAL_DOMAIN}', 'wifiSsid': SSID, 'aiRuntime': DANILO_AI_RUNTIME, 'aiModel': DANILO_AI_ACTIVE_MODEL, 'database': 'connected', 'mode': 'LAN offline-first'}, 'courses': build_admin_course_cards(db), 'stream': build_stream(db, current_user), 'contentFolders': build_content_tree(db, user=current_user), 'network': {'ssid': SSID, 'portal': f'http://{PORTAL_DOMAIN}', 'mode': 'offline-first captive portal'}, 'operationsHighlights': [{'label': 'Portal', 'value': f'http://{PORTAL_DOMAIN}'}, {'label': 'SSID', 'value': SSID}, {'label': 'AI Model', 'value': DANILO_AI_ACTIVE_MODEL}]}

@admin_router.get('/admin/users')
def admin_users(role: str | None=None, current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> list[dict]:
    stmt = select(User).order_by(User.role.asc(), User.full_name.asc())
    if role:
        stmt = stmt.where(User.role == role)
    return [serialize_user(user) for user in db.scalars(stmt).all()]

@admin_router.post('/admin/users')
def admin_create_user(payload: dict=Body(default={}), current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    role = clean_text(payload.get('role'), max_length=20)
    if role not in DANILO_ROLES:
        raise HTTPException(status_code=400, detail=f"Role must be one of: {', '.join(DANILO_ROLES)}")
    full_name = clean_text(payload.get('fullName') or payload.get('full_name'), max_length=255)
    education_level = clean_text(payload.get('educationLevel') or payload.get('education_level'), required=False, max_length=40)
    grade_level = clean_text(payload.get('gradeLevel') or payload.get('grade_level'), required=False, max_length=50)
    strand = clean_text(payload.get('strand'), required=False, max_length=80)
    if role == 'student' or education_level or grade_level or strand:
        education_level, grade_level, strand = validate_grade_path(education_level, grade_level, strand)
    section_name_val = clean_text(payload.get('sectionName') or payload.get('section_name'), required=False, max_length=120)
    username_override = clean_text(payload.get('username'), required=False, max_length=120)
    username = username_override.lower() if username_override else unique_local_username(db, generated_username_from_name(full_name, role, section_name_val))
    email = clean_text(payload.get('email'), required=False, max_length=255) or username
    if db.scalar(select(User).where(or_(func.lower(User.username) == username.lower(), func.lower(User.email) == email.lower()))):
        raise HTTPException(status_code=409, detail='Username or email already exists')
    password = clean_text(payload.get('password') or 'danilo123', max_length=255)
    department_id = parse_id(payload.get('departmentId') or payload.get('department_id'), 'Department', required=False)
    if department_id and (not db.scalar(select(Department).where(Department.id == department_id, Department.is_active == True))):
        raise HTTPException(status_code=400, detail='Department not found')
    user = User(role=role, username=username, email=email, full_name=full_name, education_level=education_level, grade_level=grade_level, strand=strand, section_name=section_name_val, department_id=department_id, password_salt='', password_hash=hash_password(password), is_active=parse_bool(payload.get('isActive'), 'Active status', default=True))
    db.add(user)
    db.flush()
    if user.role == 'student' and section_name_val:
        enrolled_course_ids = db.scalars(select(Enrollment.course_id).distinct().join(User, Enrollment.student_id == User.id).where(func.lower(User.section_name) == section_name_val.lower(), User.role == 'student', User.is_active == True, Enrollment.status == 'active', User.id != user.id)).all()
        for cid in enrolled_course_ids:
            db.add(Enrollment(course_id=cid, student_id=user.id, status='active'))
    log_action(db, current_user, 'create_user', 'user', user.id, user.role)
    db.commit()
    db.refresh(user)
    return serialize_user(user)

@admin_router.put('/admin/users/{user_id}')
def admin_update_user(user_id: str, payload: dict=Body(default={}), current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    if 'role' in payload and payload['role'] in {'admin', 'teacher', 'student'}:
        user.role = payload['role']
    for attr, key, limit in [('username', 'username', 120), ('email', 'email', 255), ('full_name', 'fullName', 255), ('education_level', 'educationLevel', 40), ('grade_level', 'gradeLevel', 50), ('strand', 'strand', 80), ('section_name', 'sectionName', 120)]:
        if key in payload:
            setattr(user, attr, clean_text(payload.get(key), required=attr not in {'education_level', 'grade_level', 'strand', 'section_name'}, max_length=limit))
    if 'departmentId' in payload or 'department_id' in payload:
        department_id = parse_id(payload.get('departmentId') or payload.get('department_id'), 'Department', required=False)
        if department_id and (not db.scalar(select(Department).where(Department.id == department_id, Department.is_active == True))):
            raise HTTPException(status_code=400, detail='Department not found')
        user.department_id = department_id
    if {'educationLevel', 'gradeLevel', 'strand'} & set(payload.keys()):
        user.education_level, user.grade_level, user.strand = validate_grade_path(user.education_level, user.grade_level, user.strand)
    if 'isActive' in payload:
        user.is_active = parse_bool(payload['isActive'], 'Active status')
    log_action(db, current_user, 'update_user', 'user', user.id)
    db.commit()
    db.refresh(user)
    return serialize_user(user)

@admin_router.delete('/admin/users/{user_id}')
def admin_delete_user(user_id: str, current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail='Admin cannot delete the active session account')
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    user.is_active = False
    log_action(db, current_user, 'deactivate_user', 'user', user.id)
    db.commit()
    return {'ok': True}

@admin_router.post('/admin/users/{user_id}/reset-password')
def admin_reset_password(user_id: str, payload: dict=Body(default={}), current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    new_password = clean_text(payload.get('password') or 'danilo123', max_length=255)
    user.password_hash = hash_password(new_password)
    user.password_salt = ''
    log_action(db, current_user, 'reset_password', 'user', user.id)
    db.commit()
    return {'ok': True, 'message': 'Password reset'}

@admin_router.delete('/admin/users/{user_id}/permanent')
def admin_permanent_delete_user(user_id: str, current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail='Admin cannot delete the active session account')
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    db.execute(text('DELETE FROM chat_messages WHERE session_id IN (SELECT id FROM chat_sessions WHERE user_id = :uid)'), {'uid': user_id})
    db.execute(text('DELETE FROM chat_sessions WHERE user_id = :uid'), {'uid': user_id})
    db.execute(text('DELETE FROM ai_conversations WHERE student_id = :uid'), {'uid': user_id})
    db.execute(text('DELETE FROM grade_entries WHERE student_id = :uid'), {'uid': user_id})
    db.execute(text('UPDATE grade_entries SET recorded_by = :admin_id WHERE recorded_by = :uid'), {'admin_id': current_user.id, 'uid': user_id})
    db.execute(text('DELETE FROM submissions WHERE student_id = :uid'), {'uid': user_id})
    db.execute(text('DELETE FROM quiz_attempts WHERE student_id = :uid'), {'uid': user_id})
    db.execute(text('DELETE FROM enrollments WHERE student_id = :uid'), {'uid': user_id})
    db.execute(text('DELETE FROM stream_posts WHERE author_id = :uid'), {'uid': user_id})
    db.execute(text('DELETE FROM audit_logs WHERE actor_id = :uid'), {'uid': user_id})
    db.execute(text('UPDATE courses SET teacher_id = NULL WHERE teacher_id = :uid'), {'uid': user_id})
    db.execute(text('UPDATE sections SET adviser_id = NULL WHERE adviser_id = :uid'), {'uid': user_id})
    db.execute(text('UPDATE assignments SET created_by = :admin_id WHERE created_by = :uid'), {'admin_id': current_user.id, 'uid': user_id})
    db.execute(text('UPDATE quizzes SET created_by = :admin_id WHERE created_by = :uid'), {'admin_id': current_user.id, 'uid': user_id})
    db.delete(user)
    log_action(db, current_user, 'permanent_delete_user', 'user', user_id)
    db.commit()
    return {'ok': True}

@admin_router.get('/admin/sections')
def admin_sections(current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> list[dict]:
    sections = db.scalars(select(Section).where(Section.is_active == True).order_by(Section.grade_level.asc(), Section.name.asc())).all()
    result = []
    for section in sections:
        student_count = db.query(User).filter(User.section_name == section.name, User.role == 'student', User.is_active == True).count()
        result.append({'id': section.id, 'name': section.name, 'gradeLevel': section.grade_level, 'educationLevel': section.education_level, 'strand': section.strand, 'schoolYear': section.school_year, 'adviserId': section.adviser_id, 'adviserName': section.adviser.full_name if section.adviser else 'Unassigned', 'studentCount': student_count, 'isActive': section.is_active})
    return result

@admin_router.post('/admin/sections')
def admin_create_section(payload: dict=Body(default={}), current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    education_level, grade_level, strand = validate_grade_path(clean_text(payload.get('educationLevel') or 'Junior High School', max_length=40), clean_text(payload.get('gradeLevel') or 'Grade 7', max_length=50), clean_text(payload.get('strand'), required=False, max_length=80))
    adviser_id = parse_id(payload.get('adviserId') or payload.get('adviser_id'), 'Adviser', required=False)
    if adviser_id and (not db.scalar(select(User).where(User.id == adviser_id, User.role == 'teacher'))):
        raise HTTPException(status_code=400, detail='Adviser must be a teacher account')
    section_name = validate_safe_text(payload.get('name'), 'Section name', max_length=120)
    school_year = clean_text(payload.get('schoolYear') or '2026-2027', max_length=20)
    if db.scalar(select(Section).where(func.lower(Section.name) == section_name.lower(), Section.grade_level == grade_level, Section.school_year == school_year, Section.is_active == True)):
        raise HTTPException(status_code=409, detail='Section name already exists for this grade and school year')
    section = Section(name=section_name, grade_level=grade_level, education_level=education_level, strand=strand, school_year=school_year, adviser_id=adviser_id, is_active=True)
    db.add(section)
    log_action(db, current_user, 'create_section', 'section', None, section.name)
    db.commit()
    db.refresh(section)
    return {'ok': True, 'id': section.id}

@admin_router.put('/admin/sections/{section_id}')
def admin_update_section(section_id: str, payload: dict=Body(default={}), current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    section = db.get(Section, section_id)
    if not section:
        raise HTTPException(status_code=404, detail='Section not found')
    old_name = section.name
    if 'name' in payload:
        section.name = clean_text(payload['name'], max_length=120)
    if 'gradeLevel' in payload or 'educationLevel' in payload or 'strand' in payload:
        section.education_level, section.grade_level, section.strand = validate_grade_path(clean_text(payload.get('educationLevel') or section.education_level, max_length=40), clean_text(payload.get('gradeLevel') or section.grade_level, max_length=50), clean_text(payload.get('strand') or section.strand, required=False, max_length=80))
    if 'adviserId' in payload:
        adviser_id = parse_id(payload['adviserId'], 'Adviser', required=False)
        if adviser_id and (not db.scalar(select(User).where(User.id == adviser_id, User.role == 'teacher'))):
            raise HTTPException(status_code=400, detail='Adviser must be a teacher account')
        section.adviser_id = adviser_id
    if 'isActive' in payload:
        section.is_active = parse_bool(payload['isActive'], 'Active status')
    if db.scalar(select(Section).where(func.lower(Section.name) == section.name.lower(), Section.grade_level == section.grade_level, Section.school_year == section.school_year, Section.id != section.id, Section.is_active == True)):
        raise HTTPException(status_code=409, detail='Section name already exists for this grade and school year')
    if old_name != section.name:
        db.execute(text('UPDATE users SET section_name = :new_name WHERE lower(section_name) = :old_name'), {'new_name': section.name, 'old_name': old_name.lower()})
    log_action(db, current_user, 'update_section', 'section', section.id)
    db.commit()
    return {'ok': True}

@admin_router.delete('/admin/sections/{section_id}')
def admin_delete_section(section_id: str, current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    section = db.get(Section, section_id)
    if not section:
        raise HTTPException(status_code=404, detail='Section not found')
    section.is_active = False
    log_action(db, current_user, 'deactivate_section', 'section', section.id)
    db.commit()
    return {'ok': True}

@admin_router.post('/admin/sections/{section_id}/assign-students')
def admin_assign_students_to_section(section_id: str, payload: dict=Body(default={}), current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    section = db.get(Section, section_id)
    if not section or not section.is_active:
        raise HTTPException(status_code=404, detail='Section not found')
    student_ids = payload.get('studentIds') or payload.get('student_ids') or []
    updated = 0
    for sid in student_ids:
        student_id = parse_id(sid, 'Student')
        student = db.get(User, student_id)
        if student and student.role == 'student':
            student.section_name = section.name
            updated += 1
    log_action(db, current_user, 'assign_students_to_section', 'section', section.id, f'count={updated}')
    db.commit()
    return {'ok': True, 'updated': updated}

@admin_router.get('/admin/courses')
def admin_courses(current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> list[dict]:
    return build_admin_course_cards(db)

@admin_router.post('/admin/courses')
def admin_create_course(payload: dict=Body(default={}), current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    teacher_id = parse_id(payload.get('teacherId') or payload.get('teacher_id'), 'Faculty', required=False)
    if teacher_id and (not db.scalar(select(User).where(User.id == teacher_id, User.role == 'teacher'))):
        raise HTTPException(status_code=400, detail='Teacher account not found')
    department_id = parse_id(payload.get('departmentId') or payload.get('department_id'), 'Department', required=False)
    if department_id and (not db.scalar(select(Department).where(Department.id == department_id, Department.is_active == True))):
        raise HTTPException(status_code=400, detail='Department not found')
    education_level, grade_level, strand = validate_grade_path(clean_text(payload.get('educationLevel') or payload.get('education_level') or 'Junior High School', max_length=40), clean_text(payload.get('gradeLevel') or payload.get('grade_level') or 'Grade 7', max_length=50), clean_text(payload.get('strand'), required=False, max_length=80))
    code = validate_safe_text(payload.get('code'), 'Class code', max_length=50)
    if db.scalar(select(Course).where(func.lower(Course.code) == code.lower())):
        raise HTTPException(status_code=409, detail='Class code already exists')
    course = Course(code=code, title=validate_safe_text(payload.get('title'), 'Class name', max_length=255), subject=validate_deped_subject(payload.get('subject')), education_level=education_level, grade_level=grade_level, strand=strand, quarter=validate_quarter(payload.get('quarter')), school_year=clean_text(payload.get('schoolYear') or payload.get('school_year') or '2026-2027', max_length=20), description=clean_text(payload.get('description') or 'Offline-ready DANILO class.', max_length=1000), teacher_id=teacher_id, department_id=department_id, is_active=True)
    db.add(course)
    db.flush()
    log_action(db, current_user, 'create_course', 'course', course.id)
    db.commit()
    return serialize_course(course)

@admin_router.put('/admin/courses/{course_id}')
def admin_update_course(course_id: str, payload: dict=Body(default={}), current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail='Class not found')
    for attr, key, limit in [('code', 'code', 50), ('title', 'title', 255), ('education_level', 'educationLevel', 40), ('grade_level', 'gradeLevel', 50), ('strand', 'strand', 80), ('school_year', 'schoolYear', 20), ('description', 'description', 1000)]:
        if key in payload:
            setattr(course, attr, clean_text(payload.get(key), required=attr != 'strand', max_length=limit))
    if 'subject' in payload:
        course.subject = validate_deped_subject(payload.get('subject'))
    if 'quarter' in payload:
        course.quarter = validate_quarter(payload.get('quarter'))
    if 'teacherId' in payload or 'teacher_id' in payload:
        teacher_id = parse_id(payload.get('teacherId') or payload.get('teacher_id'), 'Faculty', required=False)
        if teacher_id and (not db.scalar(select(User).where(User.id == teacher_id, User.role == 'teacher'))):
            raise HTTPException(status_code=400, detail='Teacher account not found')
        course.teacher_id = teacher_id
    if 'departmentId' in payload or 'department_id' in payload:
        department_id = parse_id(payload.get('departmentId') or payload.get('department_id'), 'Department', required=False)
        if department_id and (not db.scalar(select(Department).where(Department.id == department_id, Department.is_active == True))):
            raise HTTPException(status_code=400, detail='Department not found')
        course.department_id = department_id
    if {'educationLevel', 'gradeLevel', 'strand'} & set(payload.keys()):
        course.education_level, course.grade_level, course.strand = validate_grade_path(course.education_level, course.grade_level, course.strand)
    if 'isActive' in payload:
        course.is_active = parse_bool(payload['isActive'], 'Active status')
    log_action(db, current_user, 'update_course', 'course', course.id)
    db.commit()
    return {'ok': True}

@admin_router.delete('/admin/courses/{course_id}')
def admin_delete_course(course_id: str, current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail='Class not found')
    course.is_active = False
    log_action(db, current_user, 'deactivate_course', 'course', course.id)
    db.commit()
    return {'ok': True}

@admin_router.delete('/admin/courses/{course_id}/permanent')
def admin_permanent_delete_course(course_id: str, current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail='Class not found')
    db.execute(text('DELETE FROM ai_conversations WHERE course_id = :cid'), {'cid': course_id})
    db.execute(text('DELETE FROM grade_entries WHERE course_id = :cid'), {'cid': course_id})
    db.execute(text('DELETE FROM submissions WHERE assignment_id IN (SELECT id FROM assignments WHERE course_id = :cid)'), {'cid': course_id})
    db.execute(text('DELETE FROM assignments WHERE course_id = :cid'), {'cid': course_id})
    db.execute(text('DELETE FROM quiz_attempts WHERE quiz_id IN (SELECT id FROM quizzes WHERE course_id = :cid)'), {'cid': course_id})
    db.execute(text('DELETE FROM quiz_questions WHERE quiz_id IN (SELECT id FROM quizzes WHERE course_id = :cid)'), {'cid': course_id})
    db.execute(text('DELETE FROM quizzes WHERE course_id = :cid'), {'cid': course_id})
    db.execute(text('DELETE FROM enrollments WHERE course_id = :cid'), {'cid': course_id})
    db.execute(text('DELETE FROM stream_posts WHERE course_id = :cid'), {'cid': course_id})
    db.execute(text('DELETE FROM modules WHERE course_id = :cid'), {'cid': course_id})
    db.delete(course)
    log_action(db, current_user, 'permanent_delete_course', 'course', course_id)
    db.commit()
    return {'ok': True}

@admin_router.post('/admin/courses/{course_id}/enroll')
def admin_enroll_student(course_id: str, payload: dict=Body(default={}), current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    student_id = parse_id(payload.get('studentId') or payload.get('student_id'), 'Student')
    if not db.scalar(select(User).where(User.id == student_id, User.role == 'student')):
        raise HTTPException(status_code=400, detail='Student account not found')
    enrollment = db.scalar(select(Enrollment).where(Enrollment.course_id == course_id, Enrollment.student_id == student_id))
    if enrollment:
        enrollment.status = 'active'
    else:
        db.add(Enrollment(course_id=course_id, student_id=student_id, status='active'))
    log_action(db, current_user, 'enroll_student', 'course', course_id, str(student_id))
    db.commit()
    return {'ok': True}

@admin_router.delete('/admin/courses/{course_id}/enroll/{student_id}')
def admin_unenroll_student(course_id: str, student_id: str, current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    enrollment = db.scalar(select(Enrollment).where(Enrollment.course_id == course_id, Enrollment.student_id == student_id))
    if not enrollment:
        raise HTTPException(status_code=404, detail='Enrollment not found')
    enrollment.status = 'inactive'
    log_action(db, current_user, 'unenroll_student', 'course', course_id, str(student_id))
    db.commit()
    return {'ok': True}

@admin_router.post('/admin/courses/{course_id}/assign-teacher')
def admin_assign_teacher(course_id: str, payload: dict=Body(default={}), current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    teacher_id = parse_id(payload.get('teacherId') or payload.get('teacher_id'), 'Faculty')
    if not db.scalar(select(User).where(User.id == teacher_id, User.role == 'teacher')):
        raise HTTPException(status_code=400, detail='Teacher account not found')
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail='Class not found')
    course.teacher_id = teacher_id
    log_action(db, current_user, 'assign_teacher', 'course', course.id, str(teacher_id))
    db.commit()
    return {'ok': True}

@admin_router.post('/admin/announcements')
def admin_system_announcement(payload: dict=Body(default={}), current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    title = validate_safe_text(payload.get('title'), 'Title', max_length=255)
    body = validate_safe_text(payload.get('body'), 'Body', max_length=2000)
    courses = db.scalars(select(Course).where(Course.is_active == True)).all()
    for course in courses:
        db.add(StreamPost(course_id=course.id, author_id=current_user.id, title=title, body=body, post_type='announcement'))
    log_action(db, current_user, 'system_announcement', 'stream_post', details=title)
    db.commit()
    return {'ok': True, 'postedToClasses': len(courses)}

@admin_router.get('/admin/announcements')
def admin_list_announcements(current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> list[dict]:
    return [item for item in build_stream(db) if item.get('postType') == 'announcement']

@admin_router.get('/admin/reports/roster')
def admin_roster_report(current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> Response:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['course_code', 'course_title', 'teacher', 'student_username', 'student_name', 'status'])
    data = db.execute(select(Course, Enrollment, User).join(Enrollment, Enrollment.course_id == Course.id).join(User, Enrollment.student_id == User.id).order_by(Course.code, User.full_name)).all()
    for course, enrollment, student in data:
        teacher = course.teacher.full_name if course.teacher else 'Unassigned'
        writer.writerow([course.code, course.title, teacher, student.username, student.full_name, enrollment.status])
    return Response(output.getvalue(), media_type='text/csv', headers={'Content-Disposition': 'attachment; filename=danilo-roster.csv'})

@admin_router.get('/admin/reports/grades')
def admin_grades_report(current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> Response:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['course_code', 'student_username', 'student_name', 'quarter', 'component', 'score', 'max_score', 'weight', 'remarks'])
    data = db.execute(select(GradeEntry, Course, User).join(Course, GradeEntry.course_id == Course.id).join(User, GradeEntry.student_id == User.id).order_by(Course.code, User.full_name)).all()
    for grade, course, student in data:
        writer.writerow([course.code, student.username, student.full_name, grade.quarter, grade.component, grade.score, grade.max_score, grade.weight, grade.remarks or ''])
    return Response(output.getvalue(), media_type='text/csv', headers={'Content-Disposition': 'attachment; filename=danilo-grades.csv'})

@admin_router.get('/admin/reports/ai-analytics')
def admin_ai_analytics_report(current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    total_sessions = db.query(ChatSession).count()
    total_messages = db.query(ChatMessage).count()
    active_users = db.query(StudentAIProfile.student_id).distinct().count()
    top_users = db.execute(select(User.full_name, func.count(ChatMessage.id).label('msg_count')).join(ChatSession, ChatSession.user_id == User.id).join(ChatMessage, ChatMessage.session_id == ChatSession.id).where(ChatMessage.role == 'user').group_by(User.full_name).order_by(func.count(ChatMessage.id).desc()).limit(5)).all()
    return {'ok': True, 'metrics': {'totalSessions': total_sessions, 'totalMessages': total_messages, 'activeUsers': active_users}, 'topUsers': [{'name': name, 'messages': count} for name, count in top_users]}

@admin_router.get('/admin/enrollments')
def admin_enrollments(current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> list[dict]:
    rows = db.execute(select(Enrollment, Course, User).join(Course, Enrollment.course_id == Course.id).join(User, Enrollment.student_id == User.id).order_by(Course.code.asc(), User.full_name.asc())).all()
    return [{'id': enrollment.id, 'courseId': course.id, 'courseCode': course.code, 'courseTitle': course.title, 'studentId': student.id, 'studentName': student.full_name, 'studentUsername': student.username, 'status': enrollment.status} for enrollment, course, student in rows]

@admin_router.post('/admin/enrollments')
def admin_create_enrollment(payload: dict=Body(default={}), current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    course_id = parse_id(payload.get('courseId') or payload.get('course_id'), 'Class')
    student_id = parse_id(payload.get('studentId') or payload.get('student_id'), 'Learner')
    course = db.get(Course, course_id)
    student = db.get(User, student_id)
    if not course or not course.is_active:
        raise HTTPException(status_code=404, detail='Class not found')
    if not student or student.role != 'student' or (not student.is_active):
        raise HTTPException(status_code=404, detail='Learner not found')
    enrollment = db.scalar(select(Enrollment).where(Enrollment.course_id == course_id, Enrollment.student_id == student_id))
    if enrollment:
        enrollment.status = 'active'
    else:
        enrollment = Enrollment(course_id=course_id, student_id=student_id, status='active')
        db.add(enrollment)
        db.flush()
    log_action(db, current_user, 'create_enrollment', 'enrollment', enrollment.id, f'course_id={course_id} student_id={student_id}')
    db.commit()
    db.refresh(enrollment)
    return {'ok': True, 'id': enrollment.id, 'courseId': course_id, 'studentId': student_id, 'status': enrollment.status}

@admin_router.get('/admin/assignments')
def admin_assignments(current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> list[dict]:
    rows = db.execute(select(Assignment, Course).join(Course, Assignment.course_id == Course.id).order_by(Assignment.created_at.desc())).all()
    return [{'id': assignment.id, 'courseId': course.id, 'courseCode': course.code, 'courseTitle': course.title, 'title': assignment.title, 'points': assignment.points, 'isActive': assignment.is_active} for assignment, course in rows]

@admin_router.get('/admin/departments')
def admin_list_departments(current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> list[dict]:
    rows = db.scalars(select(Department).order_by(Department.name.asc())).all()
    return [{'id': d.id, 'name': d.name, 'code': d.code, 'description': d.description, 'headId': d.head_id, 'isActive': d.is_active} for d in rows]

@admin_router.post('/admin/departments')
def admin_create_department(payload: dict=Body(default={}), current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    name = clean_text(payload.get('name'), max_length=120)
    code = clean_text(payload.get('code'), max_length=20).upper()
    if db.scalar(select(Department).where(func.lower(Department.code) == code.lower())):
        raise HTTPException(status_code=409, detail='Department code already exists')
    head_id = parse_id(payload.get('headId') or payload.get('head_id'), 'Department head', required=False)
    if head_id and (not db.scalar(select(User).where(User.id == head_id, User.role == 'teacher'))):
        raise HTTPException(status_code=400, detail='Department head must be a teacher account')
    dept = Department(name=name, code=code, description=clean_text(payload.get('description'), required=False, max_length=500), head_id=head_id, is_active=True)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return {'ok': True, 'id': dept.id, 'name': dept.name, 'code': dept.code}

@admin_router.put('/admin/departments/{dept_id}')
def admin_update_department(dept_id: str, payload: dict=Body(default={}), current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    dept = db.get(Department, dept_id)
    if not dept:
        raise HTTPException(status_code=404, detail='Department not found')
    for attr, key, limit in [('name', 'name', 120), ('code', 'code', 20), ('description', 'description', 500)]:
        if key in payload:
            val = clean_text(payload.get(key), required=attr not in {'description'}, max_length=limit)
            setattr(dept, attr, val.upper() if attr == 'code' else val)
    if 'headId' in payload:
        head_id = parse_id(payload.get('headId'), 'Department head', required=False)
        if head_id and (not db.scalar(select(User).where(User.id == head_id, User.role == 'teacher'))):
            raise HTTPException(status_code=400, detail='Department head must be a teacher account')
        dept.head_id = head_id
    if 'isActive' in payload:
        dept.is_active = parse_bool(payload['isActive'], 'Active status')
    db.commit()
    return {'ok': True}

@admin_router.delete('/admin/departments/{dept_id}')
def admin_delete_department(dept_id: str, current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    dept = db.get(Department, dept_id)
    if not dept:
        raise HTTPException(status_code=404, detail='Department not found')
    dept.is_active = False
    db.commit()
    return {'ok': True}

@admin_router.post('/admin/courses/{course_id}/enroll-section')
def admin_enroll_section(course_id: str, payload: dict=Body(default={}), current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    course = db.get(Course, course_id)
    if not course or not course.is_active:
        raise HTTPException(status_code=404, detail='Course not found')
    section_id = payload.get('sectionId')
    section_name = payload.get('sectionName')
    if section_id:
        section = db.get(Section, parse_id(section_id, 'Section'))
        if not section:
            raise HTTPException(status_code=404, detail='Section not found')
        learners = db.scalars(select(User).where(func.lower(User.section_name) == section.name.lower(), User.role == 'student', User.is_active == True)).all()
    elif section_name:
        learners = db.scalars(select(User).where(func.lower(User.section_name) == section_name.lower(), User.role == 'student', User.is_active == True)).all()
    else:
        raise HTTPException(status_code=400, detail='sectionId or sectionName is required')
    enrolled = 0
    skipped = 0
    for learner in learners:
        existing = db.scalar(select(Enrollment).where(Enrollment.course_id == course_id, Enrollment.student_id == learner.id))
        if existing:
            if existing.status != 'active':
                existing.status = 'active'
                enrolled += 1
            else:
                skipped += 1
        else:
            db.add(Enrollment(course_id=course_id, student_id=learner.id, status='active'))
            enrolled += 1
    log_action(db, current_user, 'enroll_section', 'course', course_id, f'enrolled={enrolled} skipped={skipped}')
    db.commit()
    return {'ok': True, 'enrolled': enrolled, 'skipped': skipped, 'total': len(learners)}

@admin_router.get('/admin/system')
def admin_system_status(current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> dict:
    try:
        db.execute(text('SELECT 1'))
        db_status = 'connected'
    except Exception:
        db_status = 'error'
    try:
        r = httpx.get(f'{OLLAMA_URL}/api/tags', timeout=4.0)
        ollama_status = 'online' if r.status_code == 200 else 'degraded'
        ollama_models = [m.get('name') for m in r.json().get('models') or []]
    except Exception:
        ollama_status = 'offline'
        ollama_models = []
    uptime_seconds: float | None = None
    if _psutil:
        try:
            cpu_pct = _psutil.cpu_percent(interval=0.3)
            vm = _psutil.virtual_memory()
            ram_total_mb = round(vm.total / 1024 / 1024)
            ram_used_mb = round(vm.used / 1024 / 1024)
            ram_pct = vm.percent
            disk = _psutil.disk_usage('/')
            disk_total_gb = round(disk.total / 1024 / 1024 / 1024, 1)
            disk_used_gb = round(disk.used / 1024 / 1024 / 1024, 1)
            disk_pct = disk.percent
            uptime_seconds = round(time.time() - _psutil.boot_time(), 0)
            temp_celsius = None
            if hasattr(_psutil, 'sensors_temperatures'):
                temps = _psutil.sensors_temperatures()
                if temps:
                    for name, entries in temps.items():
                        if entries and entries[0].current:
                            temp_celsius = round(entries[0].current, 1)
                            break
        except Exception:
            cpu_pct = ram_pct = disk_pct = temp_celsius = None
            ram_total_mb = ram_used_mb = disk_total_gb = disk_used_gb = None
    else:
        cpu_pct = ram_pct = disk_pct = temp_celsius = None
        ram_total_mb = ram_used_mb = disk_total_gb = disk_used_gb = None
    active_user_count = len(_AI_USER_LAST_REQUEST)
    ai_ready = ollama_status == 'online' and any((name in {OLLAMA_MODEL, f'{OLLAMA_MODEL}:latest'} for name in ollama_models))
    return {'database': db_status, 'ollama': ollama_status, 'cpu': cpu_pct, 'memory': ram_pct, 'disk': disk_pct, 'uptime': f'{round((uptime_seconds or 0) / 3600, 1)}h' if uptime_seconds is not None else None, 'aiStatus': {'ready': ai_ready, 'model': OLLAMA_MODEL, 'message': 'Ollama model is available' if ai_ready else f'Ollama is offline or the configured model is missing: {OLLAMA_MODEL}'}, 'aiRuntime': DANILO_AI_RUNTIME, 'activeModel': DANILO_AI_ACTIVE_MODEL, 'ollamaModel': OLLAMA_MODEL, 'aiPrimaryModel': DANILO_AI_PRIMARY_MODEL, 'aiFallbackModel': DANILO_AI_FALLBACK_MODEL, 'aiOptionalModel': DANILO_AI_OPTIONAL_MODEL, 'ollamaAvailableModels': ollama_models, 'portalUrl': f'http://{PORTAL_DOMAIN}', 'wifiSsid': SSID, 'mode': 'LAN offline-first', 'uptimeSeconds': uptime_seconds, 'activeAiUsers': active_user_count, 'aiQueueSlots': _AI_MAX_CONCURRENT, 'aiQueueDepth': _ai_queue_depth(), 'aiQueueTimeoutSeconds': _AI_QUEUE_TIMEOUT_SECONDS, 'aiHardwareProfile': _HARDWARE['profile'], 'aiModelClass': _AI_MODEL_CLASS, 'aiQuantization': _AI_QUANTIZATION, 'aiScheduler': _AI_SCHEDULER, 'aiContextTokens': OLLAMA_NUM_CTX, 'aiInferenceThreads': OLLAMA_NUM_THREADS, 'aiGpuLayers': OLLAMA_NUM_GPU, 'aiBatchSize': OLLAMA_NUM_BATCH, 'aiKvCache': OLLAMA_KV_CACHE_TYPE, 'aiCacheSize': len(_ai_response_cache), 'aiRequests': _AI_TOTAL_REQUESTS, 'aiTimeouts': _AI_TIMEOUTS, 'aiErrors': _AI_ERRORS, 'aiLastLatencyMs': _AI_LAST_LATENCY_MS, 'ragIndexPath': DANILO_AI_INDEX_PATH, 'ragIndexed': os.path.exists(DANILO_AI_INDEX_PATH), 'hardware': {'cpuPercent': cpu_pct, 'ramPercent': ram_pct, 'ramUsedMb': ram_used_mb, 'ramTotalMb': ram_total_mb, 'diskPercent': disk_pct, 'diskUsedGb': disk_used_gb, 'diskTotalGb': disk_total_gb, 'temperatureCelsius': temp_celsius, 'profile': _HARDWARE['profile'], 'cpuModel': _HARDWARE['cpuModel'], 'cpuThreads': _HARDWARE['cpuCount'], 'gpuName': _HARDWARE['gpuName'], 'gpuVramMb': _HARDWARE['gpuVramMb'], 'integratedGpu': _HARDWARE['integratedGpu'], 'dedicatedGpu': _HARDWARE['dedicatedGpu'], 'cuda': _HARDWARE['cuda'], 'rocm': _HARDWARE['rocm'], 'avx2': _HARDWARE['avx2'], 'avx512': _HARDWARE['avx512'], 'vulkan': _HARDWARE['vulkan'], 'opencl': _HARDWARE['opencl'], 'storageAvailableMb': _HARDWARE['storageAvailableMb']}, 'totals': {'learners': db.query(User).filter(User.role == 'student').count(), 'faculty': db.query(User).filter(User.role == 'teacher').count(), 'classes': db.query(Course).filter(Course.is_active == True).count(), 'sections': db.query(Section).filter(Section.is_active == True).count(), 'departments': db.query(Department).filter(Department.is_active == True).count(), 'enrollments': db.query(Enrollment).filter(Enrollment.status == 'active').count(), 'modules': db.query(Module).count(), 'chatSessions': db.query(ChatSession).count(), 'chatMessages': db.query(ChatMessage).count()}}

@admin_router.get('/admin/logs')
def admin_recent_logs(current_user: User=Depends(get_current_user)) -> list[dict]:
    log_paths = [os.path.join(_LOG_DIR, 'backend.log'), os.path.join(_LOG_DIR, 'ai.log')]
    entries: list[dict] = []
    for path in log_paths:
        try:
            with open(path, 'r', encoding='utf-8', errors='replace') as handle:
                lines = handle.readlines()[-80:]
        except OSError:
            continue
        for line in lines:
            match = re.match('(?P<time>\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}) \\[(?P<level>[A-Z]+)\\] (?P<message>.*)', line.strip())
            if match:
                entries.append(match.groupdict())
            elif line.strip():
                entries.append({'time': '', 'level': 'INFO', 'message': line.strip()})
    entries.sort(key=lambda item: item.get('time') or '', reverse=True)
    return entries[:100]

@admin_router.get('/admin/activity')
def admin_activity(current_user: User=Depends(get_current_user), db: Session=Depends(get_db)) -> list[dict]:
    rows = db.execute(select(AuditLog, User).outerjoin(User, AuditLog.actor_id == User.id).order_by(AuditLog.created_at.desc()).limit(40)).all()
    return [{'id': log.id, 'action': log.action, 'entityType': log.entity_type, 'entityId': log.entity_id, 'details': log.details or '', 'actorName': actor.full_name if actor else 'System', 'actorRole': actor.role if actor else '', 'createdAt': log.created_at.isoformat() if log.created_at else ''} for log, actor in rows]

@admin_router.get('/admin/ai/models')
def admin_ai_models(current_user: User=Depends(get_current_user)) -> dict:
    try:
        response = httpx.get(f'{OLLAMA_URL}/api/tags', timeout=5.0)
        response.raise_for_status()
        models = [m.get('name') for m in response.json().get('models') or [] if m.get('name')]
    except Exception:
        logger.exception('Could not list local AI models')
        models = []
    presets = [{'key': 'active', 'model': OLLAMA_MODEL, 'purpose': 'Environment-selected local Ollama model for offline tutoring'}, {'key': 'fallback', 'model': DANILO_AI_FALLBACK_MODEL, 'purpose': 'Optional backup model attempted if the active model fails'}, {'key': 'gguf', 'model': DANILO_AI_PRIMARY_MODEL, 'purpose': 'Expected local GGUF asset when using a custom Ollama model'}]
    return {'runtime': DANILO_AI_RUNTIME, 'currentModel': DANILO_AI_ACTIVE_MODEL, 'models': models, 'presets': presets, 'queueSlots': _AI_MAX_CONCURRENT, 'maxLoadedModels': _env_int('OLLAMA_MAX_LOADED_MODELS', 1, minimum=1, maximum=4), 'contextTokens': OLLAMA_NUM_CTX, 'inferenceThreads': OLLAMA_NUM_THREADS, 'gpuLayers': OLLAMA_NUM_GPU, 'batchSize': OLLAMA_NUM_BATCH, 'kvCache': OLLAMA_KV_CACHE_TYPE, 'modelClass': _AI_MODEL_CLASS, 'quantization': _AI_QUANTIZATION, 'scheduler': _AI_SCHEDULER, 'hardwareProfile': _HARDWARE['profile'], 'hardware': _HARDWARE, 'keepAlive': os.getenv('OLLAMA_KEEP_ALIVE', '10m')}
