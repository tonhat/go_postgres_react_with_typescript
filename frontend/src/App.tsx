import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Signin from './pages/Signin'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Layout from './components/Layout'
import Students from './pages/Students'
import Teachers from './pages/Teachers'
import Courses from './pages/Courses'
import Classes from './pages/Classes'
import Launches from './pages/Launches'
import Users from './pages/Users'
import GradeRules from './pages/GradeRules'
import Transcripts from './pages/Transcripts'
import FeeStructures from './pages/FeeStructures'
import Invoices from './pages/Invoices'
import Finance from './pages/Finance'

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-8">Loading...</div>
  if (!user) return <Navigate to="/signin" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/signin" element={<Signin />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="students" element={<Students />} />
        <Route path="teachers" element={<Teachers />} />
        <Route path="courses" element={<Courses />} />
        <Route path="classes" element={<Classes />} />
        <Route path="launches" element={<Launches />} />
        <Route path="grade-rules" element={<GradeRules />} />
        <Route path="transcripts" element={<Transcripts />} />
        <Route path="fee-structures" element={<FeeStructures />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="finance" element={<Finance />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
