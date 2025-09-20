import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import StatsCard from '../components/dashboard/StatsCard';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import { api } from '../services/api/client';

const DashboardClient: React.FC = () => {
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeTransactions: 0,
    completed: 0,
    pending: 0,
  });
  const [myTransactions, setMyTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch client dashboard stats
      const statsResponse = await api.get('/dashboard/client-stats/');
      setStats(statsResponse.data);

      // Fetch client's transactions
      const transactionsResponse = await api.get('/transactions/my-transactions/');
      setMyTransactions(transactionsResponse.data.results || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set mock data for now if API fails
      setStats({
        totalProjects: 5,
        activeTransactions: 3,
        completed: 12,
        pending: 2,
      });
      setMyTransactions([
        {
          id: '1',
          reference_number: 'PRJ-2024-001',
          transaction_id: 'TRX-101',
          client: 'Your Company',
          type: 'Submission',
          description: 'Initial project proposal',
          priority: 'High',
          status: 'In Progress',
          creation_date: 'Jan 10, 2024',
          comments_count: 4,
        },
        {
          id: '2',
          reference_number: 'PRJ-2024-002',
          transaction_id: 'TRX-102',
          client: 'Your Company',
          type: 'Approval Request',
          description: 'Budget approval for phase 2',
          priority: 'Medium',
          status: 'Pending',
          creation_date: 'Jan 12, 2024',
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
              <h2 className="page-title">My Dashboard</h2>
              <p className="text-muted mb-0">Track your projects and transactions</p>
            </div>
            <div className="col-auto">
              <button className="btn btn-primary">
                <i className="bi bi-plus-circle me-2"></i> New Transaction
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-lg-3">
            <StatsCard
              icon="bi-folder"
              iconColor="primary"
              value={stats.totalProjects}
              label="Total Projects"
              change={{ value: '1 new', type: 'increase' }}
            />
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <StatsCard
              icon="bi-activity"
              iconColor="info"
              value={stats.activeTransactions}
              label="Active Transactions"
              change={{ value: '2', type: 'same' }}
            />
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <StatsCard
              icon="bi-check-circle"
              iconColor="success"
              value={stats.completed}
              label="Completed"
              change={{ value: '5 this month', type: 'increase' }}
            />
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <StatsCard
              icon="bi-clock"
              iconColor="warning"
              value={stats.pending}
              label="Awaiting Response"
              change={{ value: '1', type: 'decrease' }}
            />
          </div>
        </div>

        {/* Project Summary */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Project Status</h5>
              </div>
              <div className="card-body">
                <div className="list-group list-group-flush">
                  <div className="list-group-item d-flex justify-content-between align-items-center px-0">
                    <div>
                      <h6 className="mb-1">Residential Complex A</h6>
                      <small className="text-muted">Last updated: 2 days ago</small>
                    </div>
                    <span className="badge bg-success">Active</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between align-items-center px-0">
                    <div>
                      <h6 className="mb-1">Office Building B</h6>
                      <small className="text-muted">Last updated: 1 week ago</small>
                    </div>
                    <span className="badge bg-warning">Under Review</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between align-items-center px-0">
                    <div>
                      <h6 className="mb-1">Mall Renovation</h6>
                      <small className="text-muted">Last updated: 3 days ago</small>
                    </div>
                    <span className="badge bg-info">Planning</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Recent Activities</h5>
              </div>
              <div className="card-body">
                <div className="timeline">
                  <div className="timeline-item">
                    <div className="timeline-marker bg-success"></div>
                    <div className="timeline-content">
                      <p className="mb-1">Transaction TRX-101 approved</p>
                      <small className="text-muted">2 hours ago</small>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-marker bg-info"></div>
                    <div className="timeline-content">
                      <p className="mb-1">New comment on TRX-102</p>
                      <small className="text-muted">5 hours ago</small>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-marker bg-warning"></div>
                    <div className="timeline-content">
                      <p className="mb-1">Document uploaded for review</p>
                      <small className="text-muted">Yesterday</small>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-marker bg-primary"></div>
                    <div className="timeline-content">
                      <p className="mb-1">New project created</p>
                      <small className="text-muted">3 days ago</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* My Transactions */}
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
                transactions={myTransactions}
                showAllLink={true}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardClient;