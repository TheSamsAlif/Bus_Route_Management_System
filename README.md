# গন্তব্য BD - Smart Bus Route & Fare Management System

## Project Overview
গন্তব্য BD হলো বাংলাদেশের সবচেয়ে আধুনিক স্মার্ট বাস রুট ও ভাড়া ম্যানেজমেন্ট ওয়েব অ্যাপ। এটি ঢাকা সিটি, ইন্টারসিটি এবং লং রুটের জন্য স্মার্ট ভাড়া ক্যালকুলেশন, রুট সার্চ, এবং ট্রাভেল অ্যাসিস্ট্যান্ট প্রদান করে।

## Features
- ✅ স্মার্ট বাস ভাড়া ক্যালকুলেটর (Distance-based fare)
- ✅ স্মার্ট বাস রুট সার্চ (Route-wise bus list)
- ✅ ইন্টারঅ্যাকটিভ রুট ম্যাপ ভিজ্যুয়ালাইজেশন
- ✅ ইউজার অ্যাকাউন্ট সিস্টেম (JWT Authentication)
- ✅ পছন্দের রুট সংরক্ষণ
- ✅ খোঁজ ইতিহাস
- ✅ অ্যাডমিন প্যানেল (Route & Bus Management)
- ✅ গ্লাসমর্ফিজম UI ডিজাইন
- ✅ মোবাইল রেসপন্সিভ
- ✅ ডার্ক/লাইট থিম
- ✅ বাংলা/ইংরেজি ভাষা সাপোর্ট

## Tech Stack
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js + Express.js
- **Database:** MongoDB (Mongoose)
- **Authentication:** JWT
- **UI Design:** Glassmorphism + Mobile App Style

## Project Structure
```
GontoboddhBD/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Route.js
│   │   ├── Bus.js
│   │   ├── Fare.js
│   │   ├── Announcement.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── routes.js
│   │   ├── buses.js
│   │   ├── fares.js
│   │   ├── users.js
│   │   ├── admin.js
│   │   └── announcements.js
│   └── server.js
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
├── assets/
├── uploads/
├── package.json
└── README.md
```

## Installation & Setup

### ১. প্রিরিক্সিসাইট
- Node.js (v14+) - https://nodejs.org
- MongoDB (v5+) - https://www.mongodb.com/try/download/community

### ২. MongoDB ইনস্টল ও চালু করুন
```powershell
# MongoDB সার্ভিস চালু করুন (উইন্ডোজ)
net start MongoDB

# অথবা MongoDB Compass ব্যবহার করুন
```

### ৩. প্রজেক্ট ইনস্টল করুন
```powershell
cd "C:\Users\Sams Alif\Documents\GontoboddhBD"
npm install
```

### ৪. ডাটাবেস সিড করুন (Initial Data)
```powershell
# ব্রাউজারে খুলুন:
http://localhost:3000/api/admin/seed

# অথবা terminal থেকে:
curl http://localhost:3000/api/admin/seed
```

এটি ডাটাবেসে নিম্নলিখিত ডেটা যোগ করবে:
- ১টি অ্যাডমিন অ্যাকাউন্ট (admin@gontoboddhbd.com / admin123)
- ৭টি রুট (ঢাকা সিটি, ইন্টারসিটি, লং রুট)
- ৭টি বাস
- ৬টি ভাড়া নিয়ম
- ৩টি ঘোষণা

### ৫. সার্ভার চালু করুন
```powershell
npm start
# অথবা
node backend/server.js
```

### ৬. অ্যাপ ব্যবহার করুন
ব্রাউজারে যান: http://localhost:3000

## Default Admin Credentials
- **Email:** admin@gontoboddhbd.com
- **Password:** admin123

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | রেজিস্টার |
| POST | /api/auth/login | লগিন |
| GET | /api/auth/me | প্রোফাইল |
| GET | /api/routes | সকল রুট |
| GET | /api/routes/:id | রুট ডিটেইল |
| POST | /api/routes/search/from/:from/to/:to | রুট সার্চ |
| GET | /api/buses | সকল বাস |
| GET | /api/buses/:id | বাস ডিটেইল |
| POST | /api/fares/calculate | ভাড়া ক্যালকুলেট |
| GET | /api/announcements | ঘোষণা |
| GET | /api/admin/dashboard | ড্যাশবোর্ড (অ্যাডমিন) |
| POST | /api/admin/seed | ডাটাবেস সিড |

## Key Features Details

### ১. ভাড়া ক্যালকুলেশন
- দূরত্ব অনুযায়ী ভাড়া
- বাসের ধরন (AC/Non-AC/Sleeper)
- পিক আওয়ার অটো ডিটেকশন
- স্টুডেন্ট ডিসকাউন্ট সাপোর্ট

### ২. রুট সার্চ
- স্মার্ট সার্চ সাজেশন
- ক্যাটাগরি ফিল্টারিং
- ট্রাফিক স্ট্যাটাস
- বাস স্টপেজ তালিকা

### ৩. ইউজার সিস্টেম
- JWT Authentication
- পছন্দের রুট সংরক্ষণ
- সার্চ হিস্টরি
- প্রোফাইল ম্যানেজমেন্ট

### ৪. অ্যাডমিন প্যানেল
- রুট ম্যানেজমেন্ট
- বাস ম্যানেজমেন্ট
- ভাড়া নিয়ম সেটিং
- অ্যানালিটিক্স ড্যাশবোর্ড

## UI/UX Features
- Glassmorphism Design
- Smooth Animations
- Mobile Responsive (100%)
- Floating Bottom Navigation
- Neon Gradient Theme
- Dark/Light Mode Toggle

## Developer
**Developed by Sams Alif**

---

## English Version

### Quick Start
```powershell
# Install dependencies
npm install

# Seed database (first time only)
# Visit: http://localhost:3000/api/admin/seed

# Start server
npm start

# Open in browser
# http://localhost:3000
```

### Default Login
- User: user@example.com / user123
- Admin: admin@gontoboddhbd.com / admin123

Enjoy your smart bus route management app! 🚌