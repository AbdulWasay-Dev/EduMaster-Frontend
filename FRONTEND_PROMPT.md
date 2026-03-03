# EduMaster — Professional SaaS Frontend Build Prompt

## Project Overview

Build a **professional, modern SaaS frontend** for **EduMaster** — an AI-powered educational platform designed exclusively for teachers. The platform enables teachers to manage classes, upload learning material, generate AI-powered exam papers, and automatically grade handwritten answer sheets using OCR and Large Language Models (Google Gemini + Mistral).

The frontend communicates with a **FastAPI backend** (`http://localhost:8000`) via a REST API. Authentication uses **JWT Bearer tokens**.

---

## Tech Stack (Recommended)

| Layer | Choice |
|---|---|
| Framework | **Next.js 14+ (App Router)** |
| Language | **TypeScript** |
| Styling | **Tailwind CSS** + **shadcn/ui** component library |
| State Management | **Zustand** (global) + **TanStack Query v5** (server state) |
| Forms | **React Hook Form** + **Zod** validation |
| Charts | **Recharts** or **Tremor** |
| Icons | **Lucide React** |
| Animations | **Framer Motion** |
| File Uploads | **react-dropzone** |
| Tables | **TanStack Table v8** |
| Notifications | **Sonner** (toast) |
| Date Handling | **date-fns** |
| HTTP Client | **Axios** with request/response interceptors |
| PDF Viewer | **react-pdf** |

---

## Design System

### Color Palette — "Solar Flare" Theme

A bold, energetic palette built around **deep amber, volcanic orange, and molten red** — warm, premium, and instantly memorable. No other major SaaS uses this combination, making EduMaster stand out completely.

```
Primary:          #F97316  (Orange-500)    — CTA buttons, active nav, key highlights
Primary Dark:     #EA580C  (Orange-600)    — hover state
Primary Light:    #FED7AA  (Orange-200)    — tinted backgrounds, chips
Accent:           #EF4444  (Red-500)       — power accents, important badges
Accent Dark:      #DC2626  (Red-600)       — hover state for accent elements
Gold:             #FBBF24  (Amber-400)     — highlights, star ratings, medals
Gold Dark:        #D97706  (Amber-600)     — hover on gold elements
Success:          #10B981  (Emerald-500)   — pass grades, upload success
Info:             #06B6D4  (Cyan-500)      — info states, AI-related elements
Warning:          #FBBF24  (Amber-400)     — pending states, medium difficulty
Danger:           #EF4444  (Red-500)       — errors, fail grades
Background:       #FFFAF5                  — warm off-white page background
Card:             #FFFFFF                  — card background
Card Warm:        #FFF7ED  (Orange-50)     — subtle warm tint for feature cards
Border:           #FED7AA  (Orange-200)    — warm border color
Border Subtle:    #FFEDD5  (Orange-100)    — very subtle dividers
Text Primary:     #1C0A00                  — near-black with warm undertone
Text Secondary:   #78350F  (Amber-900)     — secondary text, warm brown
Text Muted:       #9A3412  (Orange-800)    — muted warm tone
Sidebar BG:       #1C0A00                  — deep volcanic brown-black
Sidebar Border:   #3D1500                  — sidebar section dividers
Sidebar Active:   #F97316  (Orange-500)    — active nav item background strip
Sidebar Text:     #FED7AA  (Orange-200)    — sidebar link text
Sidebar Icon:     #FB923C  (Orange-400)    — sidebar icons (inactive)
Gradient Hero:    from-[#1C0A00] via-[#7C2D12] to-[#EA580C]  — landing page hero
Gradient Card:    from-orange-500 to-red-500  — featured cards, CTA sections
```

**Usage philosophy:**
- Orange (#F97316) is the single "brand color" — used on nav active state, primary buttons, progress bars, chart lines
- Red (#EF4444) is the power accent — used on the most important badges, "Generate AI" buttons, urgent notifications
- Gold (#FBBF24) adds luxury — used on leaderboard medals, star ratings, premium plan highlights
- The warm off-white background (`#FFFAF5`) prevents the page from feeling sterile and pairs perfectly with warm borders
- The deep volcanic sidebar (`#1C0A00`) creates a dramatic, high-contrast shell that immediately communicates premium quality
- Tailwind custom config must extend the palette with these exact hex values so all `bg-`, `text-`, `border-` utilities are available

### Typography

- **Font**: Inter (Google Fonts) — clean, professional, widely used in SaaS
- Headings: `font-bold`, sizes from `text-2xl` to `text-5xl`
- Body: `text-sm` to `text-base`, `text-gray-700`
- Monospace (code/IDs): `font-mono text-xs`

### Layout

- **Sidebar navigation** (260px wide, collapsible to icon-only mode)
- **Top navbar** (breadcrumb + search bar + notifications bell + user avatar menu)
- **Main content area**: max-width container with `p-6` padding
- Fully **responsive**: sidebar collapses to bottom nav on mobile
- **Dark mode** support via Tailwind `dark:` classes and a theme toggle

---

## Application Routes & Pages

### Route Map

```
/                          → Marketing Landing Page (public)
/login                     → Login Page (public)
/register                  → Register Page (public)
/forgot-password           → Forgot Password (public)

/dashboard                 → Main Dashboard (protected)
/subjects                  → Subjects List (protected)
/subjects/new              → Create Subject (protected)
/subjects/[id]             → Subject Detail (protected)

/classes                   → Classes List (protected)
/classes/new               → Create Class (protected)
/classes/[id]              → Class Detail + Student List (protected)
/classes/[id]/students/new → Add Student (protected)

/documents                 → Documents Library (protected)
/documents/upload          → Upload Document (protected)
/documents/[id]            → Document Detail + Chunks Preview (protected)

/papers                    → Papers List (protected)
/papers/generate           → AI Paper Generator (protected)
/papers/[id]               → Paper Detail + Preview (protected)
/papers/[id]/edit          → Edit Paper (protected)
/papers/[id]/export        → Export Paper as PDF (protected)

/grading                   → Grading Overview (protected)
/grading/new               → Upload & Grade Answer Sheet (protected)
/grading/[submissionId]    → Grading Result Detail (protected)

/ai-assistant              → RAG AI Chat / Q&A (protected)

/analytics                 → Analytics Dashboard (protected)

/notifications             → Notifications Center (protected)

/settings                  → Account Settings (protected)
/settings/profile          → Profile Settings
/settings/security         → Password & Security
/settings/billing          → Billing & Plan (placeholder)
```

---

## Page Specifications (Detailed)

---

### 1. Marketing Landing Page (`/`)

A world-class SaaS landing page to convert visitors into registered users.

**Sections (in order):**

#### Hero Section
- Full-width with **gradient background** (`from-[#1C0A00] via-[#7C2D12] to-[#EA580C]`) — deep volcanic black bleeding into burning orange
- Large headline: `"Grade Smarter. Teach Better. Powered by AI."`
- Sub-headline: `"EduMaster automates exam creation from your study materials and grades handwritten answer sheets in seconds — so you can focus on teaching."`
- Two CTA buttons: **"Get Started Free"** (primary, filled) + **"Watch Demo"** (secondary, ghost with play icon)
- Hero image/mockup: animated browser mockup showing the dashboard
- Floating feature badges (animated): `"AI Paper Generation"`, `"OCR Grading"`, `"RAG Search"`
- Subtle animated particles or grid background

#### Social Proof Bar
- Row of logos placeholders: `"Trusted by teachers at [School 1] [School 2] [School 3]..."`
- Star rating + number of teachers using the platform

#### Feature Highlights (3-column grid)
Each card has icon, heading, and 2-line description:
1. **AI Question Generation** — Generate MCQ, short-answer, and essay questions from your PDFs instantly
2. **OCR Handwriting Grading** — Upload photos of handwritten sheets; Mistral OCR + Gemini grades them automatically
3. **RAG-Powered Search** — Ask questions about your course material and get cited answers
4. **Class & Student Management** — Organize students, track performance, manage assignments
5. **Detailed Analytics** — Performance charts, grade distributions, topic-wise insights
6. **Exam Paper Builder** — Assemble professional exam papers with one-click PDF export

#### How It Works (Step-by-step)
Numbered steps with icons and a flowing connector line:
1. Upload your PDFs, slides, or notes
2. Generate an exam paper with AI — choose difficulty, type, and number of questions
3. Students write their answers; you photograph the sheets
4. Upload photos — EduMaster grades them with AI and gives detailed feedback
5. View analytics and track progress

#### Demo / Screenshot Showcase
- Tabbed interface (tabs: Dashboard, Paper Generator, Grading Result, AI Assistant)
- Each tab shows a high-fidelity screenshot or animated mockup
- Subtle auto-play between tabs every 4 seconds

#### Pricing Section (3 tiers)
| Free | Pro | Institution |
|---|---|---|
| 1 Class | Unlimited Classes | Custom |
| 3 Subjects | Unlimited Subjects | Dedicated Support |
| 10 Papers/mo | Unlimited Papers | SSO / API Access |
| 50 Gradings/mo | 1000 Gradings/mo | Volume Pricing |
| — | Priority AI Processing | — |

Highlight the **Pro** plan as "Most Popular" with a glowing border.

#### Testimonials Section
3-column card grid with quote, teacher name, school, and avatar placeholder.

#### FAQ Section
Accordion-style with 8 questions covering questions about grading accuracy, supported file types, data privacy, pricing, etc.

#### Footer
4-column layout: Logo + tagline, Product links, Resources links, Company links.
Bottom bar: copyright + privacy policy + terms.

---

### 2. Login Page (`/login`)

- Centered card on a subtle gradient background
- EduMaster logo at top
- Email + Password fields
- "Remember me" checkbox
- "Forgot Password?" link
- Primary "Sign In" button (full width)
- Divider: "— or —"
- Google sign-in button placeholder (disabled with tooltip "Coming soon")
- Link to `/register`
- Show/hide password toggle
- Loading spinner on submit
- Error alert component for wrong credentials
- Background: soft animated gradient blobs

---

### 3. Register Page (`/register`)

- Same centered card layout as login
- Fields: Full Name, Email, Password, Confirm Password
- Password strength indicator (weak/medium/strong/very strong bar)
- Terms & Conditions checkbox with link
- Primary "Create Account" button
- Link back to `/login`
- On success: redirect to `/dashboard` with a welcome toast

---

### 4. Forgot Password Page (`/forgot-password`)

- Single email input with instruction text
- "Send Reset Link" button
- Success state: shows confirmation card with email address
- Back to login link

---

### 5. Main Dashboard (`/dashboard`)

The primary hub after login. Must feel like a **premium analytics SaaS**.

**Top stat cards row (4 cards):**
- Total Classes (with icon, count, and `+N this month` delta badge)
- Total Students
- Papers Generated
- Answer Sheets Graded

**Charts row:**
- **Grading Activity** (Area chart — last 30 days of submissions)
- **Grade Distribution** (Bar chart — A/B/C/D/F breakdown across all papers)

**Recent Activity Feed** (right sidebar panel):
- Timeline list of recent events: "Paper generated", "10 sheets graded", "New student added"
- Each entry has timestamp, icon, and short description

**Quick Action Cards** (2x2 grid):
- Generate New Paper → links to `/papers/generate`
- Upload Answer Sheets → links to `/grading/new`
- Add Document → links to `/documents/upload`
- Ask AI Assistant → links to `/ai-assistant`

**Recent Papers table** (last 5):
Columns: Title, Subject, Questions, Created, Status | Actions: View, Export

**My Classes overview** (card grid):
Each class card: name, grade level, student count, last active badge

---

### 6. Subjects List (`/subjects`)

- Page header with title + "Create Subject" button (primary)
- Search bar + filter by status (Active / Archived)
- **Grid of subject cards** (3 columns):
  Each card displays:
  - Color-coded left border cycling through: orange-500, red-500, amber-400, orange-700, red-700 (auto-assigned by subject area)
  - Subject name (large)
  - Description (truncated 2 lines)
  - Grade level badge
  - Stats row: `X Documents · Y Papers · Z Students`
  - Created date
  - Action menu (⋯): Edit, Archive, Delete
- Empty state illustration when no subjects exist

---

### 7. Subject Detail (`/subjects/[id]`)

- Hero header with subject name, description, grade badge, status toggle
- **4 sub-tabs**: Overview | Documents | Papers | AI Query

**Overview tab:**
- Stat cards: Documents, Papers, RAG queries this week
- Recent documents list
- Recent papers list

**Documents tab:**
- Upload area (drag & drop) inline
- Document table: filename, type, size, processing status (with status badge: Processing / Ready / Error), uploaded date
- Click row → `/documents/[id]`

**Papers tab:**
- Papers table for this subject
- "Generate Paper" button

**AI Query tab:**
- Full RAG chat interface scoped to this subject (see AI Assistant page)

---

### 8. Classes List (`/classes`)

- Header + "Create Class" button
- Class cards grid (same pattern as subjects but blue accent)
- Each card: class name, grade level, academic year, student count, subject area, active/inactive badge
- Quick "Add Students" action per card

---

### 9. Class Detail (`/classes/[id]`)

- Class name header with edit icon
- Info row: grade level, academic year, subject area, status toggle
- **3 sub-tabs**: Students | Papers | Performance

**Students tab:**
- "Add Student" button
- Student table: Name, Student ID, Email, Enrolled Date, Average Grade, Actions (View, Remove)
- Bulk actions: select all → Export CSV, Remove selected
- Search bar above table

**Papers tab:**
- List of papers assigned/associated with this class
- "Assign Paper" button

**Performance tab:**
- Class average score (prominent number with trend arrow)
- Top performers (top 3 with medal icons)
- Needs attention (bottom 3 with alert icon)
- Comparison bar chart: class average vs. previous paper

---

### 10. Documents Library (`/documents`)

- Global document library across all subjects
- Filter by: Subject, File Type (PDF, PPTX, DOCX, Image), Processing Status
- Table view / Grid view toggle
- Each document row: icon (file type color), filename, subject name, size, status badge, upload date, actions
- Status badges: `Processing` (yellow spinner), `Ready` (green), `Error` (red)
- Click on "Ready" document → `/documents/[id]`

---

### 11. Document Detail (`/documents/[id]`)

- Document info header: filename, subject, type, size, processing status, upload date
- **2 panels side-by-side:**
  - Left: PDF/image preview (using react-pdf or img tag)
  - Right: **Extracted Chunks** panel
    - Numbered list of text chunks
    - Each chunk shows: chunk index, character count, a preview of the text (expandable)
    - Search within chunks
- Bottom: "Generate Questions from this Document" button → prefills paper generator

---

### 12. AI Paper Generator (`/papers/generate`)

This is a **premium multi-step wizard** — the most complex form in the app.

**Step 1 — Basics:**
- Paper title (text input)
- Description (textarea)
- Subject selector (dropdown from API)
- Class selector (optional dropdown)
- Time limit (number input, minutes)
- Total marks (number input)

**Step 2 — Content Source:**
- Document selector — multi-select checkboxes from subject's documents
- Chapter / Topic filter (text input for keyword filtering)
- Content focus text area: "Focus on topics like..."

**Step 3 — Question Configuration:**
- Number of questions (slider 1–50 with live counter)
- Question types (multi-select toggle chips): MCQ | Short Answer | Long Answer | True/False | Fill in the Blank
- Difficulty level (segmented picker): Easy | Medium | Hard | Mixed
- Per-type allocation (optional): if multiple types, show split sliders (e.g., 40% MCQ, 40% Short, 20% Long)

**Step 4 — Review & Generate:**
- Summary of all selections in a clean review card
- Estimated generation time note
- Large "Generate Paper with AI" button
- Loading state: animated progress bar with step labels:
  - "Retrieving relevant content..."
  - "Generating questions..."
  - "Assembling paper..."
- On success: redirect to `/papers/[id]`

---

### 13. Papers List (`/papers`)

- Header + "Generate Paper" button
- Filter by: Subject, Difficulty, Status (Draft / Published)
- Table: Title | Subject | Questions | Marks | Difficulty | Status | Created | Actions
- Status badge: "Draft" (gray), "Published" (green)
- Actions: View | Edit | Export PDF | Publish | Delete

---

### 14. Paper Detail (`/papers/[id]`)

- Paper title header with publish toggle (Draft / Published)
- Metadata row: Subject, Class, Total Marks, Time Limit, Difficulty, Created date
- Action buttons: **Edit**, **Export PDF**, **Assign to Class**, **Delete**

**Paper Preview panel:**
- Styled like a real printed exam paper with:
  - Header: Paper title, subject, time limit, total marks
  - Sections by question type
  - Each question: number, question text, marks allocated
  - MCQ options displayed as A/B/C/D
  - Answer key toggle (teacher view): click to reveal/hide correct answers

**Questions editor sidebar (when editing):**
- Drag-to-reorder questions (react-beautiful-dnd)
- Inline edit for each question text, marks, correct answer
- Add question button
- Delete question button

---

### 15. Grading Overview (`/grading`)

- Stats bar: Total Submissions | Auto-Graded | Pending Review | Average Score
- Date range filter
- Submissions table:
  - Student Name | Paper Title | Score | Grade % | Grading Mode | Submitted | Status | Actions
  - Grade % shown as colored badge: ≥80% emerald-green, 60–79% amber-gold, <60% red
- Batch actions: Re-grade selected, Export results CSV

---

### 16. Upload & Grade Answer Sheet (`/grading/new`)

A **two-panel page** (wizard style):

**Left Panel — Upload:**
- Paper selector (searchable dropdown)
- Student selector (searchable dropdown, filtered by paper's class)
- Grading mode toggle: `Auto` | `Semi-Auto` | `Manual`
- Strictness slider: `Lenient ← Medium → Strict`
- **Multi-image drop zone** (drag & drop multiple images for multi-page sheets)
  - Shows image thumbnails with remove buttons
  - Accepts: JPG, PNG, PDF scan
  - Max 10 images per submission
- Preview of dropped images in scrollable grid

**Right Panel — Grading Result** (appears after submit):
- Student name + paper title + submission date
- **Score card** (large): `87 / 100` with animated count-up on load
- Grade percentage badge (color-coded)
- Circular progress chart for score visualization
- **Per-question breakdown table:**
  - Q# | Question text (truncated) | Max Marks | Scored | OCR Confidence | AI Feedback
- **Overall feedback** card with AI-generated narrative
- OCR Confidence indicator bar
- "Download Result PDF" button
- "Re-grade" button
- "Override Score" button (manual correction flow)

---

### 17. Grading Result Detail (`/grading/[submissionId]`)

Full-page result view for a specific submission:

- Student info card (name, ID, class)
- Paper info card (title, total marks, date)
- Score summary (same as above)
- Side-by-side view:
  - Left: Original answer sheet image viewer (paginated if multi-page)
  - Right: Grading breakdown (per-question scores + feedback)
- AI feedback narrative (full text)
- Audit trail section: shows grading timestamps, OCR version, LLM model used
- Teacher override form: adjust any question's score with a note field
- Export button

---

### 18. AI Assistant (`/ai-assistant`)

A **ChatGPT-style RAG chat interface**:

**Layout:**
- Left sidebar: Chat history list (sorted by date), "New Chat" button
- Main area: Chat window

**Chat window:**
- Message bubbles: user (right, orange gradient `from-orange-500 to-red-500`) | AI (left, white card with warm `#FFF7ED` background and Gemini icon)
- AI responses include **cited sources**: each answer shows source chunks with document name + preview
- Markdown rendering in AI responses (bold, bullet lists, code blocks)
- Subject filter dropdown at top: "Querying: All Subjects" or select specific subject
- Input area: multi-line textarea + Send button + attach document icon
- Suggested prompts chips when chat is empty: `"Summarize Chapter 3"`, `"Generate 5 MCQs on photosynthesis"`, `"What topics should I focus on for the exam?"`
- Loading state: animated typing indicator (3 dots)
- Copy response button on each AI message
- Regenerate response button

---

### 19. Analytics Dashboard (`/analytics`)

**Overview KPI row (6 cards):**
- Total Students enrolled
- Total Papers created
- Total Submissions graded
- Average score across all papers
- AI queries made this month
- Documents processed

**Charts section:**
- Performance Over Time (Line chart — avg score per paper, last 10 papers)
- Grade Distribution (Donut chart — A/B/C/D/F)
- Submissions Per Day (Bar chart — last 30 days)
- Top Subjects by Activity (Horizontal bar chart)

**Per-Class Performance Table:**
- Class | Students | Papers | Avg Score | Top Student | Last Active
- Click row → drill into class performance sub-page

**Student Leaderboard** (top 10):
- Rank | Student Name | Class | Papers Submitted | Average Score | Trend
- Trophy icons for top 3

**Export section:**
- "Export Full Report (PDF)" and "Export Data (CSV)" buttons

---

### 20. Notifications Center (`/notifications`)

- Top header with "Mark all as read" button
- Filter tabs: All | Unread | Grading | Papers | System
- Notification list items:
  - Icon (type-based: green check for grading done, blue wand for paper generated, orange bell for system)
  - Notification text
  - Timestamp (relative: "2 minutes ago")
  - Unread dot indicator
  - Click → navigate to related resource
- Empty state: "You're all caught up! 🎉"
- Pagination

---

### 21. Settings Pages (`/settings`)

**Profile Settings (`/settings/profile`):**
- Profile photo upload (drag & drop circle avatar)
- Full Name field
- Email (read-only with "Change Email" modal)
- Role badge (Teacher / Admin)
- Save Changes button

**Security Settings (`/settings/security`):**
- Change Password form: Current Password, New Password, Confirm New Password
- Password strength indicator
- Active sessions list (device, location, last active, Revoke button)
- Two-factor authentication toggle (placeholder with "Coming soon" badge)

**Billing & Plan (`/settings/billing`):**
- Current plan card with usage bars (papers used / limit, gradings used / limit)
- Plan comparison table
- Upgrade CTA button
- Invoice history table (placeholder)

---

## Shared Components (UI Kit)

Build and document these reusable components:

### Layout
- `<AppShell>` — sidebar + topbar + main area wrapper
- `<Sidebar>` — collapsible nav with icon mode
- `<TopNav>` — breadcrumb + search + notifications + user menu
- `<PageHeader title subtitle action>` — standard page heading
- `<EmptyState icon title description action>` — no data state

### Data Display
- `<StatCard title value delta icon>` — KPI card with trend
- `<DataTable columns data>` — TanStack table with sort, filter, pagination
- `<StatusBadge status>` — colored badge (Processing, Ready, Draft, Published, etc.)
- `<GradeCircle percentage>` — circular score indicator
- `<DocumentCard>` — file thumbnail with metadata
- `<QuestionCard question marks type>` — exam question display
- `<StudentRow>` — student list row with avatar

### Forms & Inputs
- `<FileDropzone>` — drag & drop with preview
- `<MultiSelect>` — searchable multi-select dropdown
- `<DifficultyPicker>` — Easy/Medium/Hard/Mixed segmented control
- `<QuestionTypeChips>` — toggle chip group
- `<PasswordInput>` — with show/hide toggle + strength bar
- `<SearchInput>` — debounced search with clear button

### Feedback
- `<LoadingSpinner>` — branded spinner
- `<ProgressSteps steps currentStep>` — wizard progress bar
- `<AIThinking>` — animated "AI is generating..." indicator
- `<ErrorBoundary>` — graceful error fallback
- `<ConfirmDialog>` — destructive action confirmation modal

---

## API Integration

### Base URL
```
http://localhost:8000/api/v1
```

### Auth Flow
1. POST `/auth/login` → receive `access_token`
2. Store token in `localStorage` (or httpOnly cookie)
3. Attach `Authorization: Bearer <token>` header via Axios interceptor
4. On 401 response → redirect to `/login` and clear token

### Key Endpoints to Integrate

| Feature | Method | Endpoint |
|---|---|---|
| Register | POST | `/auth/register` |
| Login | POST | `/auth/login` |
| Get Profile | GET | `/auth/profile` |
| List Subjects | GET | `/subjects/` |
| Create Subject | POST | `/subjects/` |
| Upload Document | POST | `/documents/upload` |
| List Documents | GET | `/documents/` |
| Generate Paper | POST | `/papers/generate` |
| List Papers | GET | `/papers/` |
| Get Paper | GET | `/papers/{id}` |
| Export Paper PDF | GET | `/papers/{id}/export` |
| Grade Answer Sheet | POST | `/grading/upload-answer-sheet` |
| List Submissions | GET | `/grading/` |
| Get Submission | GET | `/grading/{id}` |
| RAG Query | POST | `/rag/query` |
| Generate Questions | POST | `/rag/generate-questions` |
| List Classes | GET | `/classes/` |
| Create Class | POST | `/classes/` |
| List Students | GET | `/students/` |
| Create Student | POST | `/students/` |
| Class Analytics | GET | `/analytics/class/{id}/overview` |
| Student Progress | GET | `/analytics/student/{id}/progress` |

### Error Handling
- Display toast notifications for all API errors
- 422 Validation errors → show field-level errors in forms
- 401 → redirect to login
- 500 → show generic "Something went wrong" page with retry button

---

## Animations & Micro-interactions

- **Page transitions**: fade + slide up (Framer Motion `AnimatePresence`)
- **Card hover**: subtle `translateY(-2px)` + `box-shadow` increase
- **Stat counters**: count-up animation on page load (react-countup)
- **Sidebar**: smooth width transition on collapse
- **AI typing indicator**: three dots pulse animation
- **Score reveal**: circular progress animates from 0 on grading result load
- **File upload**: drag-over state changes drop zone border to dashed indigo
- **Button loading**: spinner replaces icon inside button (no layout shift)
- **Table row hover**: subtle row highlight
- **Notification badge**: pulsing dot for unread count

---

## Responsive Breakpoints

| Breakpoint | Layout Change |
|---|---|
| < 640px (mobile) | Sidebar hidden; bottom nav bar with 5 icons |
| 640–1024px (tablet) | Sidebar collapses to icon-only (60px) |
| > 1024px (desktop) | Full sidebar (260px) |

All tables become horizontally scrollable cards on mobile.
Multi-column grids collapse to 1 column on mobile.

---

## Performance Requirements

- **Lighthouse score**: ≥90 on Performance, Accessibility, Best Practices
- Images: use `next/image` with lazy loading and blur placeholder
- Code splitting: each route is lazy loaded
- TanStack Query: cache API responses with 5-minute stale time
- Virtualized lists for document chunks and long student tables
- Debounce search inputs (300ms)

---

## Accessibility Requirements

- All interactive elements have `aria-label` or visible labels
- Keyboard navigable sidebar and dropdowns
- Focus rings on all focusable elements (`focus-visible:ring-2`)
- Color is never the sole indicator (always paired with text or icon)
- WCAG AA color contrast minimum
- Alt text on all images
- Screen reader announcements for async state changes (`aria-live`)

---

## File / Folder Structure

```
frontend/
├── public/
│   ├── logo.svg
│   ├── favicon.ico
│   └── images/
│       └── hero-mockup.png
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (public)/               # Unauthenticated routes
│   │   │   ├── page.tsx            # Landing page
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   ├── (dashboard)/            # Authenticated routes
│   │   │   ├── layout.tsx          # AppShell wrapper
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── subjects/
│   │   │   ├── classes/
│   │   │   ├── documents/
│   │   │   ├── papers/
│   │   │   ├── grading/
│   │   │   ├── ai-assistant/
│   │   │   ├── analytics/
│   │   │   ├── notifications/
│   │   │   └── settings/
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                     # shadcn/ui primitives
│   │   ├── layout/                 # AppShell, Sidebar, TopNav
│   │   ├── forms/                  # FileDropzone, MultiSelect, etc.
│   │   ├── data-display/           # StatCard, DataTable, Charts
│   │   ├── feedback/               # Spinner, AIThinking, ErrorBoundary
│   │   └── shared/                 # PageHeader, EmptyState, etc.
│   ├── lib/
│   │   ├── api/                    # Axios instance + endpoint functions
│   │   │   ├── axios.ts
│   │   │   ├── auth.ts
│   │   │   ├── subjects.ts
│   │   │   ├── documents.ts
│   │   │   ├── papers.ts
│   │   │   ├── grading.ts
│   │   │   ├── classes.ts
│   │   │   ├── students.ts
│   │   │   ├── rag.ts
│   │   │   └── analytics.ts
│   │   ├── hooks/                  # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── usePapers.ts
│   │   │   ├── useDocuments.ts
│   │   │   └── useGrading.ts
│   │   ├── store/                  # Zustand stores
│   │   │   ├── authStore.ts
│   │   │   └── uiStore.ts
│   │   ├── utils/                  # Helper functions
│   │   ├── types/                  # TypeScript interfaces
│   │   └── validations/            # Zod schemas
│   └── styles/
│       └── globals.css
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_NAME=EduMaster
NEXT_PUBLIC_APP_VERSION=1.0.0
```

---

## Key UX Flows to Implement Perfectly

### Flow 1: Generate a Paper (Happy Path)
1. User clicks "Generate Paper" from dashboard quick actions
2. Step 1 wizard: fill title, select subject
3. Step 2: select 2 documents, add chapter keyword "Chapter 3"
4. Step 3: 15 questions, Mixed types, Medium difficulty
5. Step 4 review → click Generate → loading animation plays
6. Redirect to `/papers/[newId]` → paper preview renders with all questions
7. User clicks "Export PDF" → PDF downloads

### Flow 2: Grade Answer Sheet
1. User clicks "Upload Answer Sheets" from dashboard
2. Select paper from dropdown
3. Select student from dropdown
4. Drop 3 JPG images (multi-page sheet)
5. Click "Grade with AI" → loading state shows
6. Grading result appears in right panel
7. Score animates up to final value
8. Per-question breakdown table renders
9. User sees AI feedback
10. Clicks "Download Result PDF"

### Flow 3: Ask AI Assistant
1. User navigates to "/ai-assistant"
2. Selects subject "Biology" from filter
3. Types: "Explain photosynthesis and generate 3 exam questions about it"
4. AI thinking indicator appears
5. Response renders with markdown formatting
6. Source chunks footnotes appear below response
7. User copies the response

---

## Additional Notes for the Developer

1. **Auth Guard**: Implement middleware in `next.config.ts` or a `middleware.ts` file that redirects unauthenticated users from `/dashboard/**` to `/login`
2. **Token Refresh**: If the backend supports refresh tokens, implement silent refresh logic in the Axios interceptor
3. **Optimistic Updates**: Use TanStack Query `useMutation` with `onMutate` optimistic updates for class creation and student addition
4. **Image Compression**: Before uploading answer sheet images, compress them client-side using `browser-image-compression` to reduce payload size
5. **PDF Export**: For paper export, use `@react-pdf/renderer` to generate a professionally styled PDF client-side rather than relying on the backend
6. **Error States**: Every data-loading component must have a proper error state with a "Retry" button
7. **Skeleton Loaders**: Use skeleton loading components (shadcn/ui Skeleton) for all tables and cards while data loads — never show a blank page
8. **Confetti on Grading**: Show a subtle confetti animation when a student scores ≥ 90%
9. **Tour / Onboarding**: On first login, show a 5-step guided tour (using `driver.js`) highlighting the main features
10. **PWA**: Configure as a Progressive Web App with offline indicator and service worker so teachers can access grading results without internet

---

*This document is the single source of truth for building the EduMaster SaaS frontend. All pages, components, and flows described here should be implemented to production quality.*
