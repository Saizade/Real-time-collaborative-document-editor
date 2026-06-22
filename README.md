<div align="center">
  <img src="frontend/public/logo.png" alt="DOCUMENTO Logo" width="120" />

  <h1>DOCUMENTO</h1>
  
  <p>
    <strong>A highly polished, real-time collaborative document editor built for speed, simplicity, and teamwork.</strong>
  </p>

  <p>
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" /></a>
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" /></a>
    <a href="https://tiptap.dev/"><img src="https://img.shields.io/badge/Tiptap-000000?style=for-the-badge&logo=tiptap&logoColor=white" alt="Tiptap" /></a>
    <a href="https://socket.io/"><img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.io" /></a>
    <a href="https://firebase.google.com/"><img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=white" alt="Firebase" /></a>
  </p>
</div>

---

## ✨ Features

- **⚡ Real-time Collaboration:** Edit documents simultaneously with multiple users. See live cursors and instant updates powered by Yjs and WebSockets.
- **🔐 Firebase Authentication:** Secure Google OAuth and Email/Password login.
- **📂 Workspace Organization:** Infinite nested folders for structuring your team's documents seamlessly.
- **🎨 Rich Text Editing:** A beautiful, notion-style editor powered by Tiptap. Includes floating slash commands (`/` to open menu) and rich markdown support.
- **📄 Template Gallery:** Jumpstart your work with beautifully crafted starter templates (Meeting Notes, Product Specs, Brainstorming, etc.).
- **🔗 Public Share Links:** Generate read-only or editable public URLs so anyone can collaborate anonymously without needing an account.
- **🕰️ Version History:** Automatically snapshots your document. Preview and seamlessly restore past versions.
- **🌙 Dark Mode:** A sleek, fully integrated dark theme with automatic logo inversion and smooth transitions.
- **📥 Export:** Export your beautiful documents directly to **PDF** or **Markdown**.

## 🛠️ Tech Stack

**Frontend:**
- [React](https://reactjs.org/) (Vite)
- [Tiptap](https://tiptap.dev/) (Headless Rich Text Editor)
- [Yjs](https://yjs.dev/) (CRDTs for Collaboration)
- [Lucide React](https://lucide.dev/) (Beautiful Icons)
- Vanilla CSS (Custom Design System)

**Backend:**
- [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
- [Socket.io](https://socket.io/) (Real-time Communication)
- [MongoDB](https://www.mongodb.com/) & Mongoose (Database)
- [Firebase Admin](https://firebase.google.com/docs/admin/setup) (Authentication Verification)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (Local instance or Atlas URI)
- Firebase Project (for Authentication)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Saizade/Real-time-collaborative-document-editor.git
   cd Real-time-collaborative-document-editor
   ```

2. **Setup Backend:**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5001
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_jwt_key
   FRONTEND_URL=http://localhost:3000
   ```

3. **Setup Frontend:**
   ```bash
   cd ../frontend
   npm install
   ```
   *Note: Firebase configuration is loaded inside `frontend/src/utils/firebase.js`.*

4. **Run the Application:**
   Open two terminals and run:
   ```bash
   # Terminal 1 (Backend)
   cd backend
   npm run dev

   # Terminal 2 (Frontend)
   cd frontend
   npm run dev
   ```

5. **Open in Browser:**
   Navigate to `http://localhost:3000` to start collaborating!

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
