# Project DANILO Smoke Tests

Run after install, update, frontend rebuild, and reboot.

## Command Checks

```bash
sudo bash danilo.sh --verify
sudo docker compose -f /opt/danilo/app/docker-compose.yml -p danilo ps
curl -fsS -H "Host: danilo.local" http://127.0.0.1/api/health
curl -fsS -H "Host: danilo.local" http://127.0.0.1/
```

## Login Check

```bash
curl -fsS \
  -H "Host: danilo.local" \
  -H "Content-Type: application/json" \
  -X POST http://127.0.0.1/api/auth/login \
  -d '{"username":"admin","password":"ProjectDANILO2026!"}'
```

The response must include `accessToken` and a user with role `admin`.

## Role Checks

- Admin can create/edit/deactivate users, create classes, assign teachers, enroll students, export reports, and post announcements.
- Teacher sees assigned classes only and can add announcements, modules, assignments, and grades.
- Student sees enrolled classes only and can view lessons, assignments, own grades, and AI tutor.

## Class Routes

Each active class must open:

- `/class/:id/stream`
- `/class/:id/classwork`
- `/class/:id/people`
- `/class/:id/grades`

Unauthorized users must receive `403` from matching `/api/classes/:id/...` endpoints. Missing classes must receive `404`.
