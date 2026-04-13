@echo off
echo Starting Disaster Alert Development Environment...

echo Installing root dependencies...
call npm install

echo Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo Installing backend dependencies...
cd backend
call pip install -r requirements.txt
call python manage.py migrate
cd ..

echo Starting services...
start "Backend" cmd /k "cd backend && python manage.py runserver"
start "Frontend" cmd /k "cd frontend && npm run dev"

echo Services started!
echo Frontend: http://localhost:5173
echo Backend: http://localhost:8000