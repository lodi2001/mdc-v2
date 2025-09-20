import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TransactionsPage from './pages/TransactionsPage';
import CreateTransactionPage from './pages/CreateTransactionPage';
import TransactionDetailPage from './pages/TransactionDetailPage';
import TransactionEditPage from './pages/TransactionEditPage';
import UsersPage from './pages/UsersPage';
import NotificationsPage from './pages/NotificationsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import AssignmentsPage from './pages/AssignmentsPage';
import EmailTemplatesPage from './pages/EmailTemplatesPage';
import AuditLogsPage from './pages/AuditLogsPage';
import AssignedTasksPage from './pages/AssignedTasksPage';
import ImportWizardPage from './pages/ImportWizardPage';
import DraftsPage from './pages/DraftsPage';
import DocumentsPage from './pages/DocumentsPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/styles.css';
import './styles/dashboard.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/transactions" 
            element={
              <PrivateRoute roles={['Admin', 'Editor', 'Client']}>
                <TransactionsPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/transactions/create" 
            element={
              <PrivateRoute roles={['Admin', 'Editor']}>
                <CreateTransactionPage />
              </PrivateRoute>
            } 
          />
          <Route
            path="/transactions/:id"
            element={
              <PrivateRoute roles={['Admin', 'Editor', 'Client']}>
                <TransactionDetailPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/transactions/:id/edit"
            element={
              <PrivateRoute roles={['Admin', 'Editor']}>
                <TransactionEditPage />
              </PrivateRoute>
            }
          />
          <Route 
            path="/users" 
            element={
              <PrivateRoute roles={['Admin']}>
                <UsersPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/notifications" 
            element={
              <PrivateRoute>
                <NotificationsPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <PrivateRoute roles={['Admin', 'Editor']}>
                <ReportsPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <PrivateRoute>
                <SettingsPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/assignments" 
            element={
              <PrivateRoute roles={['Admin']}>
                <AssignmentsPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/email-templates" 
            element={
              <PrivateRoute roles={['Admin']}>
                <EmailTemplatesPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/audit-logs" 
            element={
              <PrivateRoute roles={['Admin']}>
                <AuditLogsPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/assigned-tasks" 
            element={
              <PrivateRoute roles={['Editor']}>
                <AssignedTasksPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/import-wizard" 
            element={
              <PrivateRoute roles={['Admin', 'Editor']}>
                <ImportWizardPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/drafts" 
            element={
              <PrivateRoute roles={['Admin', 'Editor']}>
                <DraftsPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/documents" 
            element={
              <PrivateRoute roles={['Client']}>
                <DocumentsPage />
              </PrivateRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;