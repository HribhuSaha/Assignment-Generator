# Smart Assignment Generator — Project Documentation

## Project Overview

The **Smart Assignment Generator** is a full-stack AI-powered web application that helps teachers and educators create well-structured academic assignments from uploaded reference material (PDFs). It uses the **CAMEL AI** multi-agent framework with **Google Gemini 2.5 Flash** to generate questions strictly based on the provided content — ensuring no external or hallucinated knowledge is included.

### Key Features
- Upload a PDF containing chapter/topic content
- Set difficulty level, question type, total marks, and custom rubric
- AI generates a complete assignment with marking scheme
- Live preview with clean PDF download
- Context-aware floating AI chatbot for follow-up edits

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Axios, ReactMarkdown, Lucide Icons |
| Backend | Python, FastAPI, Uvicorn |
| AI Framework | CAMEL AI (Communicative Agents for Mind Exploration of LLMs) |
| AI Model | Google Gemini 2.5 Flash |
| PDF Processing | pdfplumber |
| Styling | Vanilla CSS with CSS Animations |

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────┐
│                    FRONTEND (React)                  │
│  ┌─────────────────┐    ┌──────────────────────────┐ │
│  │ Assignment Form  │    │   Preview Panel          │ │
│  │ (Upload, Config) │    │   (Markdown Render +     │ │
│  │                  │    │    PDF Download)          │ │
│  └────────┬─────────┘    └──────────┬───────────────┘ │
│           │         API Calls        │                │
│  ┌────────┴──────────────────────────┴───────────┐   │
│  │         Floating Chat Widget (Copilot)         │   │
│  └────────────────────┬──────────────────────────┘   │
└───────────────────────┼──────────────────────────────┘
                        │  HTTP (Axios)
┌───────────────────────┼──────────────────────────────┐
│                 BACKEND (FastAPI)                     │
│  ┌────────────────────┴──────────────────────────┐   │
│  │  POST /api/generate-assignment                │   │
│  │  - Receives PDF + form data                   │   │
│  │  - Extracts text via pdfplumber               │   │
│  │  - Creates CAMEL ChatAgent (Examiner Role)    │   │
│  │  - Returns Markdown assignment                │   │
│  ├───────────────────────────────────────────────┤   │
│  │  POST /chat                                   │   │
│  │  - Context-aware floating chatbot endpoint    │   │
│  │  - Shares generated assignment as context     │   │
│  └───────────────────────────────────────────────┘   │
│                    ↕ CAMEL AI + Gemini API            │
└──────────────────────────────────────────────────────┘
```

---

## File Structure

```
camel-chat-app/
├── backend/
│   ├── main.py          ← FastAPI server, CAMEL AI agents, PDF extraction
│   └── .env             ← Environment variables (API key)
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js       ← Main React component (Form + Preview + Chat)
│   │   └── index.css    ← All styling, animations, responsive design
│   └── package.json     ← Dependencies
```

---

## Team Member Responsibilities

> The **Backend** (FastAPI + CAMEL AI + PDF Processing) was developed independently.  
> The **Frontend** work is divided among 6 team members as follows:

---

### Member 1 — Project Setup & Configuration

**Scope:** Initial React project scaffolding, dependency management, and build configuration.

**What was done:**
- Initialized the React project using `create-react-app`
- Configured `package.json` with all required dependencies:
  - `axios` — for HTTP requests to the backend API
  - `react-markdown` — for rendering AI-generated Markdown in the preview panel
  - `lucide-react` — for modern SVG icons (Sparkles, Send, Upload, Download, etc.)
- Set up the development server (`npm start`) on port 3000
- Configured proxy and CORS compatibility with the FastAPI backend running on port 8000

**Key File:** `package.json`

**Code Reference:**
```json
"dependencies": {
    "axios": "^1.x",
    "lucide-react": "^0.x",
    "react": "^18.x",
    "react-markdown": "^9.x",
    "react-scripts": "5.x"
}
```

---

### Member 2 — Assignment Generator Form (UI)

**Scope:** The left-panel form that captures all assignment parameters from the teacher.

**What was done:**
- Built the Assignment Generator form with the following controlled input fields:
  - **Assignment Title** — text input
  - **Subject** — text input
  - **Difficulty Level** — dropdown (Easy / Medium / Hard / University Level)
  - **Total Marks** — number input
  - **Marking Rubric / Criteria** — optional text input for custom grading rules
  - **Question Type** — dropdown (MCQ / Short Answer / Long Essay / Mixed)
  - **Source Material** — PDF file upload with a drag-style upload area
- Implemented React `useState` hook for form state management (`formData` object)
- Created `handleFormChange` — a generic handler that updates any field dynamically using `e.target.name`
- Created `handleFileUpload` — captures the selected PDF file object

**Key File:** `App.js` (Lines 8–50, 112–175)

**Code Reference (State):**
```javascript
const [formData, setFormData] = useState({
    title: "", subject: "", difficulty: "Medium",
    totalMarks: "", rubric: "", questionType: "Mixed", pdf: null
});
```

**Code Reference (File Upload UI):**
```jsx
<label className="file-upload-wrapper">
    <Upload size={24} color="#6366f1" />
    <div>{formData.pdf ? formData.pdf.name : "Click to upload reference PDF"}</div>
    <input type="file" className="file-input" accept=".pdf" onChange={handleFileUpload} required />
</label>
```

---

### Member 3 — Preview Panel & PDF Download

**Scope:** The right-panel that displays the generated assignment and allows clean PDF export.

**What was done:**
- Built the Preview Panel with a header containing the title and a "Save as PDF" button
- Integrated `react-markdown` to render the AI-generated Markdown as formatted HTML
- Implemented three visual states:
  1. **Empty state** — placeholder text ("Your generated assignment will appear here")
  2. **Loading state** — animated loading dots with status message
  3. **Result state** — full Markdown render of the assignment
- Built the `handlePrint` function for clean PDF download:
  - Opens a new browser tab with a white-background HTML document
  - Converts Markdown to clean HTML with professional print styling (Inter font, proper headings, borders)
  - Automatically triggers the browser's print/save dialog
  - The exported PDF contains only the assignment content — no dark UI elements

**Key File:** `App.js` (Lines 108–177, 230–260)

**Code Reference (Clean PDF Generation):**
```javascript
const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<html>...</html>`); // Clean white-background document
    // ... markdown-to-HTML conversion ...
    setTimeout(() => { printWindow.print(); }, 500);
};
```

---

### Member 4 — Floating Chatbot Widget

**Scope:** The collapsible AI chatbot in the bottom-right corner that is context-aware.

**What was done:**
- Built the floating chat widget with open/close toggle functionality
- Implemented the chat UI:
  - **Widget Header** — title ("CAMEL Copilot") with a close button
  - **Messages Area** — scrollable message list with user/bot bubbles
  - **Input Area** — text input with send button
- Used `useState` for chat state: `messages`, `chatInput`, `isChatLoading`, `isChatOpen`
- Implemented `handleChatSubmit` — sends user messages to `POST /chat` via Axios
- The chatbot is context-aware: the backend injects the current generated assignment into every chat prompt, so the teacher can ask follow-up questions like "Make question 3 harder"
- Added auto-scroll behavior using `useRef` and `useEffect` to always show the latest message
- Used `ReactMarkdown` to render bot responses with proper formatting

**Key File:** `App.js` (Lines 86–106, 270–330)

**Code Reference (Toggle):**
```jsx
{!isChatOpen && (
    <button className="chat-toggle-btn" onClick={() => setIsChatOpen(true)}>
        <MessageSquare size={24} />
    </button>
)}
```

---

### Member 5 — CSS Styling & Animated Background

**Scope:** All visual design, theming, layout, and the dynamic animated background.

**What was done:**
- Designed the complete dark-mode UI with an indigo/purple color palette using CSS custom properties
- Styled the two-panel layout (Generator + Preview) using CSS Flexbox
- Created a glassmorphism effect for the floating chat widget using `backdrop-filter: blur()`
- Designed the file upload area with a dashed-border drag-style appearance
- Built the **animated background** with 4 floating gradient orbs:
  - Uses CSS `@keyframes` animations (`float1` through `float4`)
  - Each orb has a different color (indigo, purple, blue, lavender), size, speed, and trajectory
  - Orbs are rendered with `filter: blur(80px)` and low opacity for a subtle ambient glow
  - Fully non-interactive (`pointer-events: none`) — does not interfere with UI clicks
- Styled chat bubbles with gradient backgrounds and subtle borders

**Key File:** `index.css` (Lines 1–160, orbs at Lines 53–148)

**Code Reference (Orb Animation):**
```css
.orb-1 {
    width: 400px; height: 400px;
    background: radial-gradient(circle, #6366f1, transparent 70%);
    animation: float1 12s infinite alternate;
}
@keyframes float1 {
    0% { transform: translate(0, 0) scale(1); }
    100% { transform: translate(80px, 60px) scale(1.15); }
}
```

---

### Member 6 — Responsive Design & API Integration

**Scope:** Making the application responsive across devices and connecting the frontend to the backend API.

**What was done:**

**Responsive Design:**
- Added 3 CSS media query breakpoints:
  - **≤1024px (Tablets)** — panels stack vertically, chat widget shrinks
  - **≤768px (Tablet Portrait)** — reduced font sizes, compact spacing
  - **≤480px (Mobile)** — full-width chat widget, minimized padding, touch-friendly sizes
- Ensured the form, preview, and chat widget all adapt gracefully to any screen size

**API Integration:**
- Implemented `handleGenerate` — the core function connecting the form to the backend:
  - Constructs a `FormData` object containing all form fields and the PDF file
  - Sends it via `axios.post()` to `POST /api/generate-assignment`
  - Handles success (sets `generatedAssignment` state) and error (shows alert with detail)
- Connected the chat widget to `POST /chat` endpoint via Axios
- Added loading states (`isGenerating`, `isChatLoading`) to disable buttons and show spinners during API calls

**Key File:** `index.css` (Lines 550–760), `App.js` (Lines 52–85)

**Code Reference (API Call):**
```javascript
const submitData = new FormData();
submitData.append('title', formData.title);
submitData.append('file', formData.pdf);
const response = await axios.post('http://localhost:8000/api/generate-assignment', submitData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
setGeneratedAssignment(response.data.assignment);
```

**Code Reference (Responsive):**
```css
@media (max-width: 768px) {
    .main-content { flex-direction: column; height: auto; }
    .form-control { padding: 8px 10px; font-size: 13px; }
    .floating-chat-widget { width: 320px; height: 450px; }
}
```

---

## How to Run

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- Gemini API Key

### Backend
```bash
cd camel-chat-app/backend
# Create .env file with: GEMINI_API_KEY="your-key-here"
pip install fastapi uvicorn pydantic python-multipart pdfplumber camel-ai python-dotenv
python -m uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd camel-chat-app/frontend
npm install
npm start
# Opens at http://localhost:3000
```

---

## Usage Flow

1. Open `http://localhost:3000`
2. Fill in the assignment details (Title, Subject, Difficulty, Marks, etc.)
3. Upload a reference PDF containing the chapter/topic content
4. Click **"Generate Assignment"**
5. View the generated assignment in the Preview panel
6. Click **"Save as PDF"** to download a clean, print-ready document
7. Use the **floating chatbot** (bottom-right) to ask follow-up questions or request modifications
