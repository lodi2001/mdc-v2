import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import MetricsCards from '../components/reports/MetricsCards';
import ReportFilters from '../components/reports/ReportFilters';
import { VolumeChart, StatusChart, DepartmentChart, ProcessingTimeChart, WorkloadChart } from '../components/reports/ReportCharts';
import TopPerformersTable from '../components/reports/TopPerformersTable';
import reportService from '../services/reportService';
import authService from '../services/api/auth.service';
import type { 
  AdminDashboard, 
  EditorDashboard, 
  ClientDashboard,
  DateRange,
  MetricCard
} from '../types/report';

const ReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<AdminDashboard | null>(null);
  const [editorData, setEditorData] = useState<EditorDashboard | null>(null);
  const [clientData, setClientData] = useState<ClientDashboard | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date(),
    preset: 'month'
  });
  
  const userRole = authService.getUserRole();
  const isRTL = localStorage.getItem('language') === 'ar';

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      switch (userRole) {
        case 'admin':
          // Try to fetch real data, fall back to mock if error
          try {
            const adminDash = await reportService.getAdminDashboard(dateRange);
            setAdminData(adminDash);
          } catch (err) {
            console.log('Using mock data for admin dashboard');
            const mockAdmin = reportService.getMockAdminDashboard();
            setAdminData(mockAdmin);
          }
          break;
        case 'editor':
          // Try to fetch real data, fall back to mock if error
          try {
            const editorDash = await reportService.getEditorDashboard(dateRange);
            setEditorData(editorDash);
          } catch (err) {
            console.log('Using mock data for editor dashboard');
            const mockEditor = reportService.getMockEditorDashboard();
            setEditorData(mockEditor);
          }
          break;
        case 'client':
          // Try to fetch real data, fall back to mock if error
          try {
            const clientDash = await reportService.getClientDashboard(dateRange);
            setClientData(clientDash);
          } catch (err) {
            console.log('Using mock data for client dashboard');
            // Create mock client data
            setClientData({
              myTransactions: 45,
              pendingApproval: 8,
              completed: 32,
              transactionTrends: [
                { period: 'Week 1', count: 10, change: 5 },
                { period: 'Week 2', count: 12, change: 20 },
                { period: 'Week 3', count: 15, change: 25 },
                { period: 'Week 4', count: 8, change: -47 }
              ],
              statusBreakdown: [
                { status: 'Completed', count: 32, percentage: 71 },
                { status: 'Pending', count: 8, percentage: 18 },
                { status: 'In Progress', count: 5, percentage: 11 }
              ]
            });
          }
          break;
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      const blob = await reportService.generateReport(
        { dateRange },
        format
      );
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${dateRange.preset}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const getMetricsCards = (): MetricCard[] => {
    if (userRole === 'admin' && adminData && adminData.stats) {
      return [
        {
          title: 'Total Transactions',
          titleAr: 'إجمالي المعاملات',
          value: (adminData.stats.totalTransactions || 0).toLocaleString(),
          icon: 'bi-arrow-left-right',
          color: 'primary',
          trend: {
            value: 12,
            direction: 'up',
            text: 'from last month',
            textAr: 'من الشهر الماضي'
          }
        },
        {
          title: 'Pending Approval',
          titleAr: 'في انتظار الموافقة',
          value: (adminData.stats.pendingApproval || 0).toLocaleString(),
          icon: 'bi-clock-history',
          color: 'warning',
          trend: {
            value: 5,
            direction: 'down',
            text: 'from last week',
            textAr: 'من الأسبوع الماضي'
          }
        },
        {
          title: 'Completed',
          titleAr: 'مكتمل',
          value: (adminData.stats.completed || 0).toLocaleString(),
          icon: 'bi-check-circle',
          color: 'success',
          trend: {
            value: 8,
            direction: 'up',
            text: 'from last month',
            textAr: 'من الشهر الماضي'
          }
        },
        {
          title: 'Active Users',
          titleAr: 'المستخدمون النشطون',
          value: (adminData.stats.activeUsers || 0).toLocaleString(),
          icon: 'bi-people',
          color: 'info'
        }
      ];
    } else if (userRole === 'editor' && editorData) {
      return [
        {
          title: 'Assigned Tasks',
          titleAr: 'المهام المخصصة',
          value: (editorData.assignedTransactions || 0).toLocaleString(),
          icon: 'bi-list-task',
          color: 'primary'
        },
        {
          title: 'Average Time',
          titleAr: 'متوسط الوقت',
          value: `${editorData.myAverageTime || 0} days`,
          subtitle: 'Per transaction',
          subtitleAr: 'لكل معاملة',
          icon: 'bi-clock',
          color: 'info'
        },
        {
          title: 'Completion Rate',
          titleAr: 'معدل الإنجاز',
          value: `${editorData.myCompletionRate || 0}%`,
          icon: 'bi-graph-up',
          color: 'success',
          trend: {
            value: 3,
            direction: 'up',
            text: 'this week',
            textAr: 'هذا الأسبوع'
          }
        },
        {
          title: 'Pending Reviews',
          titleAr: 'المراجعات المعلقة',
          value: (editorData.pendingReviews || 0).toLocaleString(),
          icon: 'bi-eye',
          color: 'warning'
        }
      ];
    } else if (clientData) {
      return [
        {
          title: 'My Transactions',
          titleAr: 'معاملاتي',
          value: (clientData.myTransactions || 0).toLocaleString(),
          icon: 'bi-file-earmark-text',
          color: 'primary'
        },
        {
          title: 'Pending Approval',
          titleAr: 'في انتظار الموافقة',
          value: (clientData.pendingApproval || 0).toLocaleString(),
          icon: 'bi-hourglass-split',
          color: 'warning'
        },
        {
          title: 'Completed',
          titleAr: 'مكتمل',
          value: (clientData.completed || 0).toLocaleString(),
          icon: 'bi-check-circle',
          color: 'success'
        }
      ];
    }
    return [];
  };

  if (loading) {
    return (
      <Layout>
        <div className="container-fluid p-4">
          <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-fluid p-4">
        <div className="page-header mb-4">
          <h2 className="page-title">
            {isRTL ? 'التقارير والتحليلات' : 'Reports & Analytics'}
          </h2>
          <p className="text-muted mb-0">
            {isRTL ? 'عرض التقارير والتحليلات' : 'View reports and analytics'}
          </p>
        </div>

        {/* Filters */}
        <ReportFilters 
          onDateRangeChange={setDateRange}
          onExport={handleExport}
          isRTL={isRTL}
        />

        {/* Metrics Cards */}
        <MetricsCards metrics={getMetricsCards()} isRTL={isRTL} />

        {/* Admin Dashboard */}
        {userRole === 'admin' && adminData && adminData.stats && (
          <>
            <div className="row g-4 mb-4">
              <div className="col-lg-6">
                <div className="card h-100">
                  <div className="card-body">
                    <VolumeChart data={adminData.volumeTrends} isRTL={isRTL} />
                  </div>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card h-100">
                  <div className="card-body">
                    <StatusChart data={adminData.statusDistribution} isRTL={isRTL} />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="row g-4 mb-4">
              <div className="col-lg-6">
                <div className="card h-100">
                  <div className="card-body">
                    <DepartmentChart data={adminData.departmentPerformance} isRTL={isRTL} />
                  </div>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card h-100">
                  <div className="card-body">
                    <ProcessingTimeChart data={adminData.processingTime} isRTL={isRTL} />
                  </div>
                </div>
              </div>
            </div>

            <TopPerformersTable data={adminData.topPerformers} isRTL={isRTL} />
          </>
        )}

        {/* Editor Dashboard */}
        {userRole === 'editor' && editorData && (
          <>
            <div className="row g-4 mb-4">
              <div className="col-lg-6">
                <div className="card h-100">
                  <div className="card-body">
                    <WorkloadChart data={editorData.weeklyWorkload} isRTL={isRTL} />
                  </div>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card h-100">
                  <div className="card-body">
                    <StatusChart data={editorData.taskStatusDistribution} isRTL={isRTL} />
                  </div>
                </div>
              </div>
            </div>

            {/* Deadline Tracker */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  {isRTL ? 'متتبع المواعيد النهائية' : 'Deadline Tracker'}
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  {editorData.deadlineTracker.map((item, index) => (
                    <div key={index} className="col-md-2 col-6">
                      <div className="text-center">
                        <div 
                          className="rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
                          style={{ 
                            width: '60px', 
                            height: '60px', 
                            backgroundColor: `${item.color}20`,
                            color: item.color
                          }}
                        >
                          <span className="fs-4 fw-bold">{item.count}</span>
                        </div>
                        <p className="mb-0 small text-muted">{item.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Client Activity */}
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  {isRTL ? 'نشاط العميل' : 'Client Activity'}
                </h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>{isRTL ? 'رقم المعاملة' : 'Transaction ID'}</th>
                        <th>{isRTL ? 'اسم العميل' : 'Client Name'}</th>
                        <th>{isRTL ? 'آخر نشاط' : 'Last Activity'}</th>
                        <th>{isRTL ? 'وقت الاستجابة' : 'Response Time'}</th>
                        <th>{isRTL ? 'الزيارات' : 'Visits'}</th>
                        <th>{isRTL ? 'الحالة' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editorData.clientActivity.map((client, index) => (
                        <tr key={index}>
                          <td>{client.transactionId}</td>
                          <td>{client.clientName}</td>
                          <td>{client.lastActivity}</td>
                          <td>
                            <span className="badge bg-success bg-opacity-10 text-success">
                              {client.responseTime}
                            </span>
                          </td>
                          <td>{client.platformVisits}</td>
                          <td>
                            <span className={`badge bg-${client.status === 'active' ? 'success' : 'warning'} bg-opacity-10 text-${client.status === 'active' ? 'success' : 'warning'}`}>
                              {client.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Client Dashboard */}
        {userRole === 'client' && clientData && (
          <div className="row g-4">
            <div className="col-lg-6">
              <div className="card h-100">
                <div className="card-body">
                  <VolumeChart data={clientData.transactionTrends} isRTL={isRTL} />
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card h-100">
                <div className="card-body">
                  <StatusChart data={clientData.statusBreakdown} isRTL={isRTL} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ReportsPage;
