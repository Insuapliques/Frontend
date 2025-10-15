# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based chatbot admin dashboard for "Insuapliques" - a customer service chatbot management system. The frontend connects to Firebase for authentication, real-time database, and file storage.

## Tech Stack

- **Frontend Framework**: React (Create React App)
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Backend/Database**: Firebase (Firestore, Storage, Authentication)
- **Key Libraries**:
  - `firebase` - Backend services
  - `jspdf` + `html2canvas` - PDF export functionality
  - `react-icons` - Icon components

## Architecture

### Firebase Integration

The app uses Firebase as its backend (`firebaseConfig.jsx`):
- **Firestore Collections**:
  - `conversations` - Stores historical chat conversations with users
  - `liveChat` - Real-time chat messages between operators and users
  - `settings/prompts` - Bot configuration (AI prompts, training data, closure keywords)
  - `productos_chatbot` - Product catalog with images/videos and keyword-triggered responses
  - `productos` - Product database (managed via ProductoManager component)
- **Firebase Storage**: Used for uploading chat attachments, product images/videos, and training documents
- **Firebase Auth**: Authentication system (email/password)

### Application Structure

The app has a single-page architecture with protected routes:

1. **Authentication Layer** ([App.jsx:15-22](Frontend/src/App.jsx#L15-L22))
   - `onAuthStateChanged` listener wraps entire app
   - Unauthenticated users redirected to Login page
   - Logout available in header navigation

2. **Main Routes** ([App.jsx:48-53](Frontend/src/App.jsx#L48-L53))
   - `/` - HistorialConversaciones (conversation history viewer)
   - `/entrenamiento` - EntrenamientoConfig (AI training configuration)
   - `/Documentos` - ProductosChatbotPanel (product/document management)
   - `/chat` - ChatTiempoReal (live operator chat interface)

### Key Components

#### HistorialConversaciones ([HistorialConversaciones.jsx](Frontend/src/pages/HistorialConversaciones.jsx))
- Displays all past conversations from `conversations` collection
- Real-time updates via `onSnapshot`
- Features: search filter, view full conversation, export to PDF, delete conversations
- PDF export uses `html2canvas` + `jsPDF`

#### EntrenamientoConfig ([EntrenamientoConfig.jsx](Frontend/src/pages/EntrenamientoConfig.jsx))
- Manages bot AI training settings in `settings/prompts` document
- Two configuration sections:
  1. **AI Configuration**: Base prompts, closure keywords
  2. **Message Templates**: Predefined messages (greetings, closures, human handoff)
- File upload for training documents to Firebase Storage

#### ChatTiempoReal ([ChatTiempoReal.jsx](Frontend/src/pages/ChatTiempoReal.jsx))
- Live chat interface for operators to respond to users
- Real-time messaging via `liveChat` collection
- Features:
  - Multi-user support with color-coded avatars
  - Unread message counters per user
  - File attachment support
  - Typing indicators
  - User selection sidebar

#### ProductosChatbotPanel ([ProductosChatbotPanel.jsx](Frontend/src/pages/ProductosChatbotPanel.jsx))
- Manages keyword-triggered responses in `productos_chatbot` collection
- Supports both image and video responses
- Each entry has: keyword, response text, and media file (uploaded to Storage)
- CRUD operations: create, edit, delete products/documents

#### BotConfigEditor ([BotConfigEditor.jsx](Frontend/src/BotConfigEditor.jsx))
- Standalone component for editing bot prompts (appears unused in current routing)
- Manages base prompt, retrieval prompt, and closure keywords

## Development Workflow

Since this is a Create React App project without a `package.json` in the Frontend directory, development commands are likely run from a parent directory or the actual package.json is missing from the repository.

**Expected commands** (verify package.json location first):
```bash
npm install          # Install dependencies
npm start            # Start dev server (typically localhost:3000)
npm run build        # Production build
npm test             # Run tests
```

## Firebase Configuration

The Firebase config in [firebaseConfig.jsx](Frontend/src/firebaseConfig.jsx) contains **hardcoded API keys**. This is a public client-side key but ensure Firebase security rules are properly configured.

**Important**: Firebase security rules should restrict:
- Write access to authenticated users only
- Read access based on user roles/ownership
- Storage upload limits and file type restrictions

## Styling

- Uses **Tailwind CSS utility classes** throughout
- Dark theme (`bg-gray-900`, `text-white`)
- Green accent color (`text-green-500`, `hover:bg-green-500`)
- Custom component styles in [index.css](Frontend/src/index.css)

## State Management

- No global state management library (Redux, Zustand, etc.)
- State managed via React hooks (`useState`, `useEffect`)
- Real-time data sync via Firebase `onSnapshot` listeners
- Authentication state via Firebase `onAuthStateChanged`

## Data Flow Patterns

1. **Real-time Listeners**: All pages use `onSnapshot` for live updates
2. **Optimistic UI**: Most operations update Firestore and rely on listeners to refresh UI
3. **File Uploads**: Upload to Storage → get download URL → save URL to Firestore
4. **Cleanup**: All components properly unsubscribe from listeners in `useEffect` cleanup

## Common Patterns

**Adding a new page**:
1. Create component in `Frontend/src/pages/`
2. Import in [App.jsx](Frontend/src/App.jsx)
3. Add route in `<Routes>` section
4. Add navigation link in header

**Working with Firestore**:
```javascript
// Read real-time
const unsubscribe = onSnapshot(collection(db, "collectionName"), (snapshot) => {
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  setState(data);
});
return () => unsubscribe();

// Create
await addDoc(collection(db, "collectionName"), { field: value });

// Update
await updateDoc(doc(db, "collectionName", "docId"), { field: newValue });

// Delete
await deleteDoc(doc(db, "collectionName", "docId"));
```

**File Upload Pattern**:
```javascript
const storageRef = ref(storage, `folder/${Date.now()}_${file.name}`);
await uploadBytes(storageRef, file);
const url = await getDownloadURL(storageRef);
// Save url to Firestore
```
