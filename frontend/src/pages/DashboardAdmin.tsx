import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import StatsCard from '../components/dashboard/StatsCard';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import { api } from '../services/api/client';

const DashboardAdmin: React.FC = () => {
  const [stats, setStats] = useState({
    totalTransactions: 0,
    pendingApproval: 0,
    completed: 0,
    activeUsers: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Try to fetch dashboard stats
      try {
        const statsResponse = await api.get('/dashboard/stats/');
        setStats(statsResponse.data);
      } catch (statsError) {
        console.log('Stats endpoint not available, using mock data');
      }

      // Try to fetch recent transactions
      try {
        const transactionsResponse = await api.get('/transactions/recent/');
        setRecentTransactions(transactionsResponse.data.results || []);
      } catch (transError) {
        console.log('Transactions endpoint not available, using mock data');
      }
    } catch (error) {
      console.log('Using mock data for dashboard');
      // Set mock data for now if API fails
      setStats({
        totalTransactions: 234,
        pendingApproval: 45,
        completed: 189,
        activeUsers: 52,
      });
      setRecentTransactions([
        {
          id: '1',
          reference_number: 'DOC-2024-001',
          transaction_id: 'TRX-001',
          client: 'Ahmed Al-Rashid',
          type: 'Document Review',
          description: 'Project consultation',
          priority: 'In Review',
          status: 'Completed',
          creation_date: 'Jan 15, 2024',
          comments_count: 3,
        },
        {
          id: '2',
          reference_number: 'APR-2024-002',
          transaction_id: 'TRX-002',
          client: 'Fatima Al-Zahrani',
          type: 'Approval Request',
          description: 'Design phase approval',
          priority: 'Pending',
          status: 'Pending',
          creation_date: 'Jan 15, 2024',
          comments_count: 1,
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
              <h2 className="page-title">Admin Dashboard</h2>
              <p className="text-muted mb-0">Welcome back, System Administrator</p>
            </div>
            <div className="col-auto">
              <button className="btn btn-primary">
                <i className="bi bi-download me-2"></i> Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-lg-3">
            <StatsCard
              icon="bi-receipt"
              iconColor="primary"
              value={stats.totalTransactions}
              label="Total Transactions"
              change={{ value: '12.5%', type: 'increase' }}
            />
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <StatsCard
              icon="bi-clock-history"
              iconColor="warning"
              value={stats.pendingApproval}
              label="Pending Approval"
              change={{ value: 'Same', type: 'same' }}
            />
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <StatsCard
              icon="bi-check-circle"
              iconColor="success"
              value={stats.completed}
              label="Completed"
              change={{ value: '8.3%', type: 'increase' }}
            />
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <StatsCard
              icon="bi-people"
              iconColor="info"
              value={stats.activeUsers}
              label="Active Users"
              change={{ value: '3 new', type: 'increase' }}
            />
          </div>
        </div>

        {/* Recent Transactions */}
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
              <RecentTransactions transactions={recentTransactions} />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardAdmin;