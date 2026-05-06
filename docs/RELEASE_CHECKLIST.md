# Project DANILO Release Checklist

## Installer

- `powershell -ExecutionPolicy Bypass -File .\scripts\verify-project.ps1` passes before copying the folder to Ubuntu.
- `sudo bash danilo.sh --help` lists all supported modes.
- `sudo bash danilo.sh --install` completes on Ubuntu 24.04.
- `sudo bash danilo.sh --update` regenerates app files without deleting data.
- `sudo bash danilo.sh --rebuild-frontend` rebuilds the gateway image and keeps backend/database data.
- `sudo bash danilo.sh --sync` mirrors lesson content.
- `sudo bash danilo.sh --verify` passes after install and after reboot.
- `sudo bash danilo.sh --uninstall` removes generated app/system files while preserving Docker volumes unless reset is requested.
- `/var/log/danilo-install.log` exists and secrets are redacted from command output.

## Admin Workflow

- Log in as `admin` / `ProjectDANILO2026!`.
- Create teacher and student users; leave username blank to auto-generate one.
- Edit and deactivate a test user.
- Create a class using DepEd education level, grade level, subject, quarter, and SHS strand where applicable.
- Assign a teacher.
- Enroll and unenroll a student.
- View all classes.
- Post a system announcement.
- Export roster CSV.
- Export grades CSV.
- Open System and confirm portal, Wi-Fi, AI model, and database status.

## Teacher Workflow

- Log in as a teacher account.
- Confirm only assigned classes appear.
- Open `/class/:id/stream`, `/class/:id/classwork`, `/class/:id/people`, and `/class/:id/grades`.
- Post an announcement.
- Add a lesson module with MELC code, competency, objectives, quarter, week, and assessment type.
- Upload a PDF, PPT, PPTX, DOCX, or TXT material, generate a lesson draft, edit it, and regenerate if needed.
- Create an assignment.
- View roster in People.
- Add a grade and confirm it appears in Grades.
- Ask the AI assistant.

## Student Workflow

- Log in as a student account.
- Confirm only enrolled classes appear.
- Open Stream, Classwork, People, and Grades.
- View announcements.
- View lessons/modules.
- View assignments.
- Confirm only own grades are visible.
- Ask the AI tutor in English and Filipino.

## System

- Reboot the machine.
- Confirm `danilo-stack.service`, `danilo-ap.service`, `dnsmasq.service`, and `hostapd.service` auto-start.
- Join the `PROJECT-DANILO` Wi-Fi AP.
- Open `http://danilo.local`.
- Confirm `/api/health` returns `status: ok`.
- Confirm the AI model is `danilo-custom` when `models/*.gguf` exists, otherwise `qwen2.5:1.5b-instruct-q4_K_M`.
