import sys
sys.path.append('/app')
from app.database import SessionLocal
from app.student_insights import analyze_student_performance
from app.models import Course, User

db = SessionLocal()
teacher = db.query(User).filter_by(username="t_stat").first()
print("Teacher:", teacher.id, teacher.username)
course = db.query(Course).filter_by(teacher_id=teacher.id).first()
print("Course:", course.id, course.title)
try:
    analysis = analyze_student_performance(db, course.id)
    print("Analysis success")
except Exception as e:
    import traceback
    traceback.print_exc()

