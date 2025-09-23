import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import { MainLayout } from './components/layout/MainLayout';

// Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { FormEditor } from './pages/forms/FormEditor';
import FormPreview from './pages/forms/FormPreview';
import FormResponses from './pages/forms/FormResponses';
import FormShare from './pages/forms/FormShare';
import FormAnalytics from './pages/forms/FormAnalytics';
import FormFill from './pages/fill/FormFill';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/f/:id" element={<FormFill />} />

            {/* Private Routes */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <MainLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* Forms routes */}
              <Route path="forms/new" element={<FormEditor />} />
              <Route path="forms/:id/edit" element={<FormEditor />} />
              <Route path="forms/:id" element={<FormPreview />} />
              <Route path="forms/:id/preview" element={<FormPreview />} />
              <Route path="forms/:id/responses" element={<FormResponses />} />
              <Route path="forms/:id/share" element={<FormShare />} />
              <Route path="forms/:id/analytics" element={<FormAnalytics />} />
            </Route>

            {/* Catch all - redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;