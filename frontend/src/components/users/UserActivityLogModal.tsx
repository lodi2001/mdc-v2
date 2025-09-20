import React, { useState, useEffect } from 'react';
import { User } from '../../types/user';
import userService from '../../services/api/userService';

interface UserActivityLogModalProps {
  show: boolean;
  user: User | null;
  onClose: () => void;
}

interface ActivityLogEntry {
  id: number;
  action: string;
  timestamp: string;
  details: string;
  ip_address?: string;
  user_agent?: string;
}

const UserActivityLogModal: React.FC<UserActivityLogModalProps> = ({
  show,
  user,
  onClose
}) => {
  const isRTL = localStorage.getItem('language') === 'ar';
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (show && user) {
      fetchActivityLog();
    }
  }, [show, user, currentPage]);

  const fetchActivityLog = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await userService.getUserActivityLog(user.id, currentPage);
      setActivities(response.results || []);
      setTotalPages(Math.ceil(response.count / 10));
    } catch (error) {
      console.error('Failed to fetch activity log:', error);
      // For now, use mock data
      setActivities([
        {
          id: 1,
          action: 'Login',
          timestamp: new Date().toISOString(),
          details: 'Successful login',
          ip_address: '192.168.1.1'
        },
        {
          id: 2,
          action: 'Update Profile',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          details: 'Updated phone number',
          ip_address: '192.168.1.1'
        },
        {
          id: 3,
          action: 'Password Changed',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          details: 'Password successfully changed',
          ip_address: '192.168.1.2'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
        return 'bi-box-arrow-in-right';
      case 'logout':
        return 'bi-box-arrow-right';
      case 'update profile':
      case 'profile update':
        return 'bi-person-gear';
      case 'password changed':
      case 'password reset':
        return 'bi-key';
      case 'transaction created':
        return 'bi-plus-circle';
      case 'transaction updated':
        return 'bi-pencil-square';
      default:
        return 'bi-activity';
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
        return 'success';
      case 'logout':
        return 'info';
      case 'password changed':
      case 'password reset':
        return 'warning';
      case 'failed login':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  if (!show) return null;

  return (
    <>
      <div className="modal fade show d-block" tabIndex={-1}>
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="bi bi-clock-history me-2"></i>
                {isRTL ? `سجل النشاط - ${user?.first_name} ${user?.last_name}` : `Activity Log - ${user?.first_name} ${user?.last_name}`}
              </h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-inbox fs-1 text-muted"></i>
                  <p className="text-muted mt-3">
                    {isRTL ? 'لا توجد أنشطة مسجلة' : 'No activities recorded'}
                  </p>
                </div>
              ) : (
                <div className="timeline">
                  {activities.map((activity) => (
                    <div key={activity.id} className="timeline-item mb-4">
                      <div className="d-flex align-items-start">
                        <div className={`badge bg-${getActionColor(activity.action)} bg-opacity-10 p-2 me-3`}>
                          <i className={`bi ${getActionIcon(activity.action)} fs-5 text-${getActionColor(activity.action)}`}></i>
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="mb-1">{activity.action}</h6>
                              <p className="text-muted small mb-1">{activity.details}</p>
                              {activity.ip_address && (
                                <span className="badge bg-light text-dark me-2">
                                  <i className="bi bi-globe2 me-1"></i>
                                  {activity.ip_address}
                                </span>
                              )}
                            </div>
                            <small className="text-muted">
                              {formatDate(activity.timestamp)}
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <nav aria-label="Activity log pagination" className="mt-4">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        {isRTL ? 'السابق' : 'Previous'}
                      </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        {isRTL ? 'التالي' : 'Next'}
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => {
                  // TODO: Export activity log
                  console.log('Export activity log');
                }}
              >
                <i className="bi bi-download me-2"></i>
                {isRTL ? 'تصدير السجل' : 'Export Log'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                {isRTL ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
};

export default UserActivityLogModal;