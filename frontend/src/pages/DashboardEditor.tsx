import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import StatsCard from '../components/dashboard/StatsCard';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import { api } from '../services/api/client';

const DashboardEditor: React.FC = () => {
  const [stats, setStats] = useState({
    assignedTasks: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
  });
  const [assignedTransactions, setAssignedTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch editor dashboard stats
      const statsResponse = await api.get('/dashboard/editor-stats/');
      setStats(statsResponse.data);

      // Fetch assigned transactions
      const transactionsResponse = await api.get('/transactions/assigned/');
      setAssignedTransactions(transactionsResponse.data.results || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set mock data for now if API fails
      setStats({
        assignedTasks: 28,
        inProgress: 12,
        completed: 14,
        overdue: 2,
      });
      setAssignedTransactions([
        {
          id: '1',
          reference_number: 'REV-2024-003',
          transaction_id: 'TRX-003',
          client: 'Mohammed Al-Qahtani',
          type: 'Revision Request',
          description: 'Drawing modifications',
          priority: 'High',
          status: 'In Progress',
          creation_date: 'Jan 14, 2024',
          comments_count: 5,
        },
        {
          id: '2',
          reference_number: 'DOC-2024-004',
          transaction_id: 'TRX-004',
          client: 'Sara Al-Mutairi',
          type: 'Document Review',
          description: 'Technical specifications review',
          priority: 'Medium',
          status: 'Pending',
          creation_date: 'Jan 15, 2024',
          comments_count: 2,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container-fluid p-4">
        {/* Page Header */}
        <div className="page-header mb-4">
          <div className="row align-items-center">
            <div className="col">
              <h2 className="page-title">Editor Dashboard</h2>
              <p className="text-muted mb-0">Manage your assigned tasks</p>
            </div>
            <div className="col-auto">
              <button className="btn btn-primary">
                <i className="bi bi-filter me-2"></i> Filter Tasks
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-lg-3">
            <StatsCard
              icon="bi-list-task"
              iconColor="primary"
              value={stats.assignedTasks}
              label="Assigned Tasks"
              change={{ value: '5 new', type: 'increase' }}
            />
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <StatsCard
              icon="bi-hourglass-split"
              iconColor="info"
              value={stats.inProgress}
              label="In Progress"
              change={{ value: '2', type: 'increase' }}
            />
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <StatsCard
              icon="bi-check-circle"
              iconColor="success"
              value={stats.completed}
              label="Completed Today"
              change={{ value: '3', type: 'increase' }}
            />
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <StatsCard
              icon="bi-exclamation-triangle"
              iconColor="danger"
              value={stats.overdue}
              label="Overdue"
              change={{ value: '1', type: 'decrease' }}
            />
          </div>
        </div>

        {/* Task Priority Summary */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Priority Distribution</h5>
              </div>
              <div className="card-body">
                <div className="d-flex flex-column gap-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="badge bg-danger">High Priority</span>
                    <span className="fw-bold">8 tasks</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="badge bg-warning">Medium Priority</span>
                    <span className="fw-bold">12 tasks</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="badge bg-info">Low Priority</span>
                    <span className="fw-bold">8 tasks</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-12 col-md-8">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Quick Actions</h5>
              </div>
              <div className="card-body">
                <div className="row g-2">
                  <div className="col-6">
                    <button className="btn btn-outline-primary w-100">
                      <i className="bi bi-plus-circle me-2"></i> New Task
                    </button>
                  </div>
                  <div className="col-6">
                    <button className="btn btn-outline-secondary w-100">
                      <i className="bi bi-calendar-check me-2"></i> My Schedule
                    </button>
                  </div>
                  <div className="col-6">
                    <button className="btn btn-outline-info w-100">
                      <i className="bi bi-bar-chart me-2"></i> Performance
                    </button>
                  </div>
                  <div className="col-6">
                    <button className="btn btn-outline-success w-100">
                      <i className="bi bi-download me-2"></i> Export Tasks
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Transactions */}
        <div className="row g-3">
          <div className="col-12">
            {loading ? (
              <div className="card">
                <div className="card-body text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              </div>
            ) : (
              <RecentTransactions 
                transactions={assignedTransactions}
                showAllLink={true}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardEditor;