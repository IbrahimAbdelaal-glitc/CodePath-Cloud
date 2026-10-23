import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import { PageSkeleton } from './components/States.jsx';
import Home from './pages/Home.jsx';
import Paths from './pages/Paths.jsx';
import PathDetail from './pages/PathDetail.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Bookmarks from './pages/Bookmarks.jsx';
import Profile from './pages/Profile.jsx';
import Certificates from './pages/Certificates.jsx';
import { Login, Register } from './pages/Auth.jsx';
import { ForgotPassword, ResetPassword } from './pages/PasswordReset.jsx';
import NotFound from './pages/NotFound.jsx';

// Heavier pages (Markdown, syntax highlighting, admin tools) load on demand
const Lesson = lazy(() => import('./pages/Lesson.jsx'));
const Certificate = lazy(() => import('./pages/Certificate.jsx'));
const VerifyCertificate = lazy(() => import('./pages/VerifyCertificate.jsx'));
const ManageHome = lazy(() => import('./pages/manage/ManageHome.jsx'));
const ManageRoadmap = lazy(() => import('./pages/manage/ManageRoadmap.jsx'));
const LessonEditor = lazy(() => import('./pages/manage/LessonEditor.jsx'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers.jsx'));

export default function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="paths" element={<Paths />} />
          <Route path="paths/:slug" element={<PathDetail />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="verify/:code" element={<VerifyCertificate />} />

          <Route element={<RequireAuth />}>
            <Route path="lessons/:id" element={<Lesson />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="bookmarks" element={<Bookmarks />} />
            <Route path="profile" element={<Profile />} />
            <Route path="certificates" element={<Certificates />} />
            <Route path="certificates/:id" element={<Certificate />} />
          </Route>

          <Route element={<RequireAuth roles={['INSTRUCTOR', 'ADMIN']} />}>
            <Route path="manage" element={<ManageHome />} />
            <Route path="manage/roadmaps/:id" element={<ManageRoadmap />} />
            <Route path="manage/lessons/new" element={<LessonEditor />} />
            <Route path="manage/lessons/:id" element={<LessonEditor />} />
            <Route path="manage/modules/:moduleId/lessons/new" element={<LessonEditor />} />
          </Route>

          <Route element={<RequireAuth roles={['ADMIN']} />}>
            <Route path="admin/users" element={<AdminUsers />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
