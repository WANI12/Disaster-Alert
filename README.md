# Disaster-Alert
Disaster Alert is a Monitoring system for any disaster

🌍 Disaster Alert

A Real-Time Disaster Monitoring and Early Warning System

📌 Overview

Disaster Alert is a comprehensive monitoring and early warning system designed to detect, track, and report disasters in real time. The platform enables communities, governments, and response agencies to quickly share information, assess risks, and coordinate timely responses to minimize loss of life and property.

The system is particularly relevant for disaster-prone regions and supports both connected and low-connectivity environments.

🎯 Objectives

Provide real-time disaster monitoring and reporting

Enable early warning and rapid response mechanisms

Enhance community participation in reporting incidents

Support decision-makers with reliable data and analytics

Strengthen coordination between stakeholders

🚨 Key Features
1. 📡 Real-Time Incident Reporting

Users can report disasters such as:

Floods

Fires

Conflict incidents

Disease outbreaks

Environmental hazards

Reports can include location, images, and descriptions

2. 🌐 Interactive Dashboard

Visual representation of incidents on a map interface

Filtering by:

Disaster type

Location

Severity

Time

3. 🔔 Alert & Notification System

Instant alerts via:

SMS

Email

Mobile push notifications

Custom alert thresholds based on risk levels

4. 📊 Data Analytics & Insights

Trend analysis for disaster patterns

Risk mapping and forecasting

Reports for decision-making and planning

5. 📱 Offline & Low Connectivity Support

Data capture in offline mode

Automatic sync when internet is available

6. 🏛️ Multi-Stakeholder Integration

Connects:

Communities

NGOs

Government agencies

Emergency responders

🏗️ System Architecture

The system follows a modular architecture:

Frontend:

Web dashboard (React / Vue)

Mobile application (Android)

Backend:

RESTful API (Node.js / Django)

Authentication & role management

Database:

PostgreSQL / MySQL

GIS-enabled (PostGIS) for mapping

Infrastructure:

Cloud-based (AWS / Azure / GCP)

Scalable and secure

⚙️ Installation
Prerequisites

Node.js / Python

Database (PostgreSQL recommended)

Git

Steps
# Clone the repository
git clone https://github.com/your-username/disaster-alert.git

# Navigate into the project
cd disaster-alert

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Run the application
npm start
🔐 User Roles

Admin

Manage users and system settings

View all reports and analytics

Field Reporter

Submit incident reports

Upload media

Responder

Receive alerts

Coordinate response

Public User

View alerts and updates

📍 Use Cases

Early warning systems in rural communities

Disaster response coordination centers

NGO and humanitarian operations

Government emergency management agencies

🌍 Impact

Disaster Alert helps to:

Reduce disaster response time

Improve situational awareness

Empower communities to report incidents

Strengthen resilience and preparedness

🔮 Future Enhancements

AI-based disaster prediction

Integration with satellite and weather data

Voice-based reporting (local languages)

Integration with systems like community early warning platforms

🤝 Contribution

We welcome contributions from developers, researchers, and humanitarian organizations.

# Fork the repository
# Create your feature branch
git checkout -b feature/new-feature

# Commit your changes
git commit -m "Add new feature"

# Push to the branch
git push origin feature/new-feature
📄 License

This project is licensed under the MIT License.

📬 Contact

Project Lead: Wani Geoffrey
Email: wanigeoffrey1@gmail.com

Location: Juba, South Sudan

## Backend (Python + Django + MySQL)

The repository now includes a Django backend in `backend/` with:

- **REST API**: Locations, Alerts, Reports
- **Realtime stream**: Server-Sent Events endpoint for live alerts
- **Analytics**: Simple aggregated summaries for dashboards
- **Database**: MySQL (recommended) with a SQLite dev fallback

### Quick start (SQLite dev mode)

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
copy .env.example .env
set DB_ENGINE=sqlite
.\.venv\Scripts\python manage.py migrate
.\.venv\Scripts\python manage.py runserver
```

### MySQL with Docker (recommended for production-like dev)

```bash
cd backend
docker compose up -d
copy .env.example .env
set DB_ENGINE=mysql
.\.venv\Scripts\python manage.py migrate
.\.venv\Scripts\python manage.py runserver
```

### API endpoints

- **Locations**: `GET/POST /api/locations/`
- **Alerts**: `GET/POST /api/alerts/`, `GET/PATCH /api/alerts/{id}/`
- **Live alerts (SSE)**: `GET /api/alerts/stream/?since=2026-01-01T00:00:00Z`
- **Reports**: `GET/POST /api/reports/`
- **Analytics summary**: `GET /api/analytics/summary/?days=30`
- **Analytics (timeline)**: `GET /api/analytics/timeline/`
- **Analytics (map)**: `GET /api/analytics/map/`
- **Early warning**: `GET /api/analytics/early-warning/`

## Frontend (React + Vite)

The repository includes a modern frontend under `frontend/` with:
- User registration/login
- Incident data collection forms
- Dashboard with map + timeline + early warnings (filtered from early 2000 to today)

### Quick start
```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Default UI address: `http://localhost:5173`