import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import AuthGuard from './components/layout/AuthGuard'
import StudentAuthGuard from './components/layout/StudentAuthGuard'
import AppShell from './components/layout/AppShell'
import StudentPortalShell from './components/layout/StudentPortalShell'
import LoadingSpinner from './components/feedback/LoadingSpinner'

// Public pages
const LandingPage       = lazy(() => import('./pages/landing/LandingPage'))
const LoginPage         = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage      = lazy(() => import('./pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))

// Student auth pages (public)
const StudentLoginPage  = lazy(() => import('./pages/auth/StudentLoginPage'))
const StudentSignupPage = lazy(() => import('./pages/auth/StudentSignupPage'))

// Protected teacher pages
const DashboardPage     = lazy(() => import('./pages/dashboard/DashboardPage'))
const SubjectsListPage  = lazy(() => import('./pages/subjects/SubjectsListPage'))
const CreateSubjectPage = lazy(() => import('./pages/subjects/CreateSubjectPage'))
const SubjectDetailPage = lazy(() => import('./pages/subjects/SubjectDetailPage'))
const ClassesListPage   = lazy(() => import('./pages/classes/ClassesListPage'))
const CreateClassPage   = lazy(() => import('./pages/classes/CreateClassPage'))
const ClassDetailPage   = lazy(() => import('./pages/classes/ClassDetailPage'))
const DocumentsLibraryPage = lazy(() => import('./pages/documents/DocumentsLibraryPage'))
const UploadDocumentPage   = lazy(() => import('./pages/documents/UploadDocumentPage'))
const DocumentDetailPage   = lazy(() => import('./pages/documents/DocumentDetailPage'))
const PapersListPage    = lazy(() => import('./pages/papers/PapersListPage'))
const GeneratePaperPage = lazy(() => import('./pages/papers/GeneratePaperPage'))
const PaperDetailPage   = lazy(() => import('./pages/papers/PaperDetailPage'))
const PaperEditorPage   = lazy(() => import('./pages/papers/PaperEditorPage'))
const GradingOverviewPage = lazy(() => import('./pages/grading/GradingOverviewPage'))
const UploadGradingPage   = lazy(() => import('./pages/grading/UploadGradingPage'))
const GradingResultDetailPage = lazy(() => import('./pages/grading/GradingResultDetailPage'))
const AIAssistantPage   = lazy(() => import('./pages/ai/AIAssistantPage'))
const AnalyticsDashboardPage = lazy(() => import('./pages/analytics/AnalyticsDashboardPage'))
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage'))
const ProfileSettingsPage  = lazy(() => import('./pages/settings/ProfileSettingsPage'))
const SecuritySettingsPage = lazy(() => import('./pages/settings/SecuritySettingsPage'))
const BillingPage          = lazy(() => import('./pages/settings/BillingPage'))

// Teacher assignment pages
const AssignmentsListPage   = lazy(() => import('./pages/assignments/AssignmentsListPage'))
const CreateAssignmentPage  = lazy(() => import('./pages/assignments/CreateAssignmentPage'))
const AssignmentDetailPage  = lazy(() => import('./pages/assignments/AssignmentDetailPage'))

// Student portal pages
const StudentDashboardPage        = lazy(() => import('./pages/student/StudentDashboardPage'))
const StudentAssignmentsPage      = lazy(() => import('./pages/student/StudentAssignmentsPage'))
const StudentAssignmentDetailPage = lazy(() => import('./pages/student/StudentAssignmentDetailPage'))
const StudentScoresPage           = lazy(() => import('./pages/student/StudentScoresPage'))
const StudentSubjectsPage         = lazy(() => import('./pages/student/StudentSubjectsPage'))
const StudentAskAIPage            = lazy(() => import('./pages/student/StudentAskAIPage'))

const Fallback = () => (
  <div className="flex items-center justify-center h-screen bg-[#FFFAF5]">
    <LoadingSpinner size="lg" />
  </div>
)

export default function App() {
  return (
    <Suspense fallback={<Fallback />}>
      <AnimatePresence mode="wait">
        <Routes>
          {/* Public */}
          <Route path="/"               element={<LandingPage />} />
          <Route path="/login"          element={<LoginPage />} />
          <Route path="/register"       element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Student auth (public) */}
          <Route path="/student/login"  element={<StudentLoginPage />} />
          <Route path="/student/signup" element={<StudentSignupPage />} />

          {/* Protected — Teacher — wrapped in AuthGuard + AppShell */}
          <Route element={<AuthGuard />}>
            <Route element={<AppShell />}>
              <Route path="/dashboard"        element={<DashboardPage />} />

              <Route path="/subjects"         element={<SubjectsListPage />} />
              <Route path="/subjects/new"     element={<CreateSubjectPage />} />
              <Route path="/subjects/:id"     element={<SubjectDetailPage />} />

              <Route path="/classes"          element={<ClassesListPage />} />
              <Route path="/classes/new"      element={<CreateClassPage />} />
              <Route path="/classes/:id"      element={<ClassDetailPage />} />

              <Route path="/assignments"          element={<AssignmentsListPage />} />
              <Route path="/assignments/new"      element={<CreateAssignmentPage />} />
              <Route path="/assignments/:id"      element={<AssignmentDetailPage />} />

              <Route path="/documents"        element={<DocumentsLibraryPage />} />
              <Route path="/documents/upload" element={<UploadDocumentPage />} />
              <Route path="/documents/:id"    element={<DocumentDetailPage />} />

              <Route path="/papers"           element={<PapersListPage />} />
              <Route path="/papers/generate"  element={<GeneratePaperPage />} />
              <Route path="/papers/:id"       element={<PaperDetailPage />} />
              <Route path="/papers/:id/edit"  element={<PaperEditorPage />} />

              <Route path="/grading"          element={<GradingOverviewPage />} />
              <Route path="/grading/new"      element={<UploadGradingPage />} />
              <Route path="/grading/:id"      element={<GradingResultDetailPage />} />

              <Route path="/ai-assistant"     element={<AIAssistantPage />} />
              <Route path="/analytics"        element={<AnalyticsDashboardPage />} />
              <Route path="/notifications"    element={<NotificationsPage />} />

              <Route path="/settings"         element={<Navigate to="/settings/profile" replace />} />
              <Route path="/settings/profile" element={<ProfileSettingsPage />} />
              <Route path="/settings/security" element={<SecuritySettingsPage />} />
              <Route path="/settings/billing"  element={<BillingPage />} />

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>

          {/* Protected — Student — wrapped in StudentAuthGuard + StudentPortalShell */}
          <Route element={<StudentAuthGuard />}>
            <Route element={<StudentPortalShell />}>
              <Route path="/student/dashboard"          element={<StudentDashboardPage />} />
              <Route path="/student/assignments"        element={<StudentAssignmentsPage />} />
              <Route path="/student/assignments/:id"    element={<StudentAssignmentDetailPage />} />
              <Route path="/student/scores"             element={<StudentScoresPage />} />
              <Route path="/student/subjects"           element={<StudentSubjectsPage />} />
              <Route path="/student/ask-ai"             element={<StudentAskAIPage />} />
              <Route path="/student/*" element={<Navigate to="/student/dashboard" replace />} />
            </Route>
          </Route>
        </Routes>
      </AnimatePresence>
    </Suspense>
  )
}
