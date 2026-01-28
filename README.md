# API-First Video App

A React Native mobile app with Flask backend that demonstrates API-first architecture, JWT authentication, and YouTube URL abstraction.

## 📁 Project Structure

```
video_streaming/
├── backend/                 # Flask API
│   ├── app/
│   │   ├── config.py        # Environment configuration
│   │   ├── models/          # User & Video models
│   │   ├── routes/          # Auth & Video endpoints
│   │   └── middleware/      # JWT authentication
│   ├── run.py               # Flask entry point
│   ├── requirements.txt
│   └── .env.example
│
└── mobile/                  # React Native (Expo)
    ├── src/
    │   ├── context/         # Auth context
    │   ├── screens/         # App screens
    │   └── services/        # API client
    ├── App.js               # Navigation setup
    └── .env.example
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- Expo CLI
- MongoDB Atlas account (or local MongoDB)

### 1. Backend Setup

```bash
cd video_streaming/backend

# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Edit .env file and add your MongoDB Atlas connection string:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/video_app

# Start the server
python run.py
```

The API will be running at `http://localhost:5000`

### 2. Mobile App Setup

```bash
cd video_streaming/mobile

# Install dependencies
npm install

# Configure API URL
# For Android Emulator: API_URL is already set to http://10.0.2.2:5000
# For physical device: Update src/services/api.js with your computer's IP

# Start Expo
npx expo start

# For network issues, use tunnel mode:
npx expo start --tunnel
```

**Testing options:**
- Press `a` for Android emulator
- Press `i` for iOS simulator (Mac only)
- Scan QR code with Expo Go app on your phone

## 📱 App Features

### Authentication
- **Signup**: name, email, password
- **Login**: email, password → JWT tokens (access + refresh)
- **Secure Storage**: JWT stored with expo-secure-store
- **Auto Refresh**: Access token auto-refreshes using refresh token

### Dashboard
- Displays video tiles fetched from backend (pagination-ready)
- Each tile shows: thumbnail, title, description
- Pull-to-refresh support

### Video Player
- YouTube embed via react-native-youtube-iframe
- Play/pause, seek, volume controls
- Secure playback with signed token

### Settings
- Shows user name and email
- Logout button (clears JWT)

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register new user |
| POST | `/auth/login` | Login, returns access + refresh tokens |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/me` | Get user profile |
| POST | `/auth/logout` | Logout user |
| GET | `/dashboard` | Get videos (supports ?page=1&limit=2) |
| GET | `/video/<id>/stream` | Get playback token + embed URL |

## ⭐ Bonus Features Implemented

- ✅ **Refresh Tokens**: Access token (1hr) + Refresh token (7 days)
- ✅ **Token Expiry Handling**: Auto-refresh on expiry
- ✅ **Rate Limiting**: 5 login attempts per 5 minutes
- ✅ **Basic Logging**: All routes log requests/errors
- ✅ **Pagination-Ready Dashboard**: `?page=1&limit=2` query params

## 🔒 YouTube URL Abstraction

The mobile app **never** sees raw YouTube URLs:

1. `/dashboard` returns video metadata without `youtube_id`
2. When user clicks a video, app calls `/video/<id>/stream`
3. Backend generates a signed `playback_token`
4. Backend returns `embed_url` (youtube.com/embed/...) not watch URL
5. App uses YouTube iframe to load the embed

## 🧪 Testing the App

1. **Start backend**: `python run.py` (in backend folder)
2. **Start mobile**: `npx expo start` (in mobile folder)
3. **Register** a new account
4. **Login** and see the dashboard with videos
5. **Play** a video
6. **Open Settings** and logout

## 📝 Environment Variables

### Backend (.env)
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET_KEY=your-secret-key
JWT_ACCESS_TOKEN_EXPIRES=86400
```

### Mobile (src/services/api.js)
```javascript
const API_URL = 'http://10.0.2.2:5000';  // Android emulator
// const API_URL = 'http://localhost:5000';  // iOS simulator
// const API_URL = 'http://192.168.x.x:5000';  // Physical device
```


