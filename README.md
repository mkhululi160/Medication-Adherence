# 💊 Medication Adherence with Guardian Alerts

A full-stack application that helps elderly patients and those with chronic conditions track their medication intake. Family members and caregivers receive real-time alerts when doses are missed.

## 🎯 Problem Statement

Elderly patients or those with chronic conditions often forget to take their medication. Family members worry and have no way to check compliance remotely.

## 💡 Solution

A smart pillbox companion app where:
- Patients scan QR codes on their pillbox when taking medication
- Guardians receive SMS/email/push alerts if a dose is missed by 2 hours
- Both patients and guardians can view adherence history and reports

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js + Express
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT with bcrypt
- **Background Jobs:** Bull queue with Redis
- **Notifications:** Twilio (SMS), Nodemailer (Email), Web Push API
- **QR Codes:** qrcode library

### Frontend
- **Framework:** React 18 with Create React App
- **UI Library:** Material-UI (MUI)
- **State Management:** Context API + Custom Hooks
- **HTTP Client:** Axios
- **QR Scanner:** react-qr-reader
- **Charts:** Recharts
- **Routing:** React Router DOM v6

## 📋 Features

### Authentication
- JWT-based authentication
- Role-based access (Patient / Guardian)
- Protected routes

### Patient Features
- Create, read, update, delete medications
- Set medication schedules (multiple times per day)
- View QR codes for each scheduled dose
- Scan QR codes to log doses
- View adherence dashboard with charts
- Invite guardians via email

### Guardian Features
- Accept patient invitations
- View all linked patients
- Monitor adherence rates
- Receive missed dose alerts via SMS, email, and push notifications

### Automated Alerts
- Missed dose detection runs every minute
- Alerts sent 2 hours after missed dose
- Multiple channels: SMS, Email, Push notifications

## 📁 Project Structure
medication-adherence/
├── server/                 # Backend
│   ├── src/
│   │   ├── models/         # Mongoose models
│   │   ├── controllers/    # Business logic
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Auth middleware
│   │   ├── jobs/           # Bull queue processors
│   │   ├── utils/          # Email, SMS, Push helpers
│   │   └── index.js        # Entry point
│   ├── .env                # Environment variables
│   └── package.json
└── client/                 # Frontend
├── public/
│   ├── index.html
│   └── sw.js           # Service worker for push
├── src/
│   ├── components/     # React components
│   ├── contexts/       # Auth context
│   ├── hooks/          # Custom hooks
│   ├── utils/          # API, error handling, push
│   ├── App.js
│   └── index.js
├── .env                # Environment variables
└── package.json
