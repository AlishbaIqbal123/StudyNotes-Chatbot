# Firebase Setup & Migration Guide - LuminaStudy 🔥

You can absolutely use Firebase! It is a fantastic choice for this project because it handles **Authentication**, **Database**, and **File Storage** in one unified free platform.

---

## 1. Create Your Firebase Project
1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click **Add Project** and name it `LuminaStudy`.
3.  (Optional) Disable Google Analytics for a faster setup.
4.  Once created, click the **Web icon (`</>`)** to register your app.
5.  Copy the `firebaseConfig` object provided.

---

## 2. Enable Core Services

### A. Authentication (Identity)
1.  In the Firebase sidebar, go to **Build -> Authentication**.
2.  Click **Get Started**.
3.  Enable **Email/Password** and **Google** (for one-tap login).
4.  *Benefit:* You get a secure, production-ready auth system without writing any hashing logic.

### B. Cloud Firestore (Database)
1.  Go to **Build -> Firestore Database**.
2.  Click **Create Database**.
3.  Start in **Test Mode** (to begin development immediately).
4.  Choose a location near you.
5.  *Benefit:* Real-time sync. When the AI finishes processing a note, the UI will update instantly without refreshing.

### C. Firebase Storage (Files)
1.  Go to **Build -> Storage**.
2.  Click **Get Started**.
3.  *Benefit:* Perfect for storing User PDFs and Note attachments.

---

## 3. Integration with LuminaStudy

### Installing Dependencies
Run this in the `client` directory:
```bash
npm install firebase
```

### Configuration File (`client/src/lib/firebase.ts`)
Create this file and paste your config:
```typescript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

---

## 4. Why use Firebase for LuminaStudy?
1.  **Security:** Firebase handles session management, token refreshing, and password security automatically.
2.  **Scalability:** No need to manage a MongoDB server; Google handles the scaling.
3.  **Speed:** The "Pinterest" feel requires fast data fetching; Firestore is optimized for web performance.
4.  **Cost:** The **Spark Plan** (Free) includes:
    *   Auth: 50,000 monthly active users.
    *   Firestore: 1GB storage + 50,000 reads/day.
    *   Hosting: 10GB storage.

---

**Next Steps:** I will now update your codebase to support Firebase as an option for Auth and Data.
