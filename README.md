# Aura - Premium Full-Stack Chat Application

## 🚀 Live Links
*   **Live Web Application**: [https://aura-premium-chat.vercel.app](https://aura-premium-chat.vercel.app)
*   **Backend Server URL**: [https://aura-premium-chat.onrender.com](https://aura-premium-chat.onrender.com)

Aura is a real-time, glassmorphic dark-mode chat application built using the MERN stack with Socket.IO. It features single-channel messaging, group chats, file/image sharing, online status tracking, typing indicators, read receipts, and profile management.

## Tech Stack

* **Frontend**: React (Vite), Axios, Socket.IO-Client, Lucide React (Icons), React Hot Toast (Notifications)
* **Backend**: Node.js, Express, Socket.IO (WebSockets), JWT, BcryptJS (Password Security)
* **Database**: MongoDB (Mongoose ODM)
* **Media Uploads**: Multer with Cloudinary (Graceful fallback to local file system if Cloudinary is not configured)

---

## Features

1. **Authentication**: JWT token authorization, secure cookie storage, password hashing with bcrypt, and profile creation.
2. **Real-time Messaging**: Direct messaging via Socket.IO connections.
3. **Group Chats**: Create group channels, rename groups, add/remove members (admin privilege), or leave group rooms.
4. **Online Status**: Real-time presence indicators ("online" green status dot, "offline" status with last seen timestamps).
5. **Typing Indicators**: Bouncing animation alerts when users are currently typing.
6. **Read Receipts**: Message ticketing system (Single tick = Sent, Double gray ticks = Delivered to receiver, Double blue ticks = Read/Seen by receiver).
7. **Message Actions**: Hover options to edit sent messages or soft-delete them ("This message was deleted").
8. **File Sharing**: Upload images/documents using Cloudinary storage (or local uploads folder `/server/uploads`).
9. **Notifications**: Increments badge counts for chats that are not currently focused.
10. **Profile Management**: Update your name, bio description, or upload a new avatar profile picture.

---

## How to Run the Project

### Prerequisites
* **Node.js** installed on your system.
* **MongoDB** server running locally (usually at `mongodb://127.0.0.1:27017/`) or a MongoDB Atlas URI.

---

### Step 1: Configure Environment Variables
We have created a `.env` template inside the `server/` directory:
1. Open [server/.env](file:///c:/Users/Dell/OneDrive/Desktop/Chat%20Application/server/.env).
2. (Optional) Provide Cloudinary keys if you have them:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
   *Note: If these keys are left empty, Aura automatically falls back to local storage inside `server/uploads/` and serves files statically.*

---

### Step 2: Start the Backend Server
1. Open a terminal, move to the server directory, and start the development server:
   ```bash
   cd server
   npm run dev
   ```
2. The server will start on port `5000` and database logs will print:
   `MongoDB Connected: localhost`

---

### Step 3: Start the React Frontend
1. Open a new terminal window, move to the client directory, and start Vite:
   ```bash
   cd client
   npm run dev
   ```
2. Open your browser and navigate to the printed URL (usually [http://localhost:5173](http://localhost:5173)).
