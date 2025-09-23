import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api/client';
import { ActivityItem } from '../../types/history';

interface TransactionHistoryProps {
  transactionId: string;
  isRTL: boolean;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactionId, isRTL }) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'status_change' | 'comment' | 'attachment'>('all');

  useEffect(() => {
    fetchHistory();
  }, [transactionId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/transactions/${transactionId}/history/`);
      console.log('History API Response:', response.data); // Debug log
      // The backend returns data.data.activities structure
      const activitiesData = response.data?.data?.activities || [];
      console.log('Activities extracted:', activitiesData); // Debug log
      setActivities(Array.isArray(activitiesData) ? activitiesData : []);
    } catch (err: any) {
      console.error('Error fetching history:', err);
      setError(isRTL ? 'فشل تحميل السجل' : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return isRTL ? `منذ ${diffMins} دقيقة` : `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return isRTL ? `منذ ${diffHours} ساعة` : `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return isRTL ? `منذ ${diffDays} يوم` : `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getActivityTypeLabel = (type: string) => {
    const labels: { [key: string]: { en: string; ar: string } } = {
      'status_change': { en: 'Status Change', ar: 'تغيير الحالة' },
      'comment': { en: 'Comment', ar: 'تعليق' },
      'attachment': { en: 'Attachment', ar: 'مرفق' }
    };
    return isRTL ? labels[type]?.ar : labels[type]?.en;
  };

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter(activity => activity.type === filter);

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">{isRTL ? 'جاري التحميل...' : 'Loading...'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert alert-danger">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="card-title mb-0">
            {isRTL ? 'سجل المعاملة' : 'Transaction History'}
          </h5>

          {/* Filter Buttons */}
          <div className="btn-group" role="group">
            <button
              type="button"
              className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('all')}
            >
              {isRTL ? 'الكل' : 'All'}
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filter === 'status_change' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('status_change')}
            >
              {isRTL ? 'الحالات' : 'Status'}
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filter === 'comment' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('comment')}
            >
              {isRTL ? 'التعليقات' : 'Comments'}
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filter === 'attachment' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('attachment')}
            >
              {isRTL ? 'المرفقات' : 'Attachments'}
            </button>
          </div>
        </div>

        {filteredActivities.length === 0 ? (
          <div className="text-center text-muted py-5">
            <i className="bi bi-clock-history fs-1"></i>
            <p>{isRTL ? 'لا يوجد سجل' : 'No history available'}</p>
          </div>
        ) : (
          <div className="timeline">
            {filteredActivities.map((activity, index) => (
              <div
                key={index}
                className="timeline-item d-flex mb-4"
                style={{
                  paddingLeft: isRTL ? '0' : '45px',
                  paddingRight: isRTL ? '45px' : '0',
                  position: 'relative'
                }}
              >
                {/* Timeline Icon */}
                <div
                  className="timeline-icon"
                  style={{
                    position: 'absolute',
                    left: isRTL ? 'auto' : '0',
                    right: isRTL ? '0' : 'auto',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: activity.color,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px'
                  }}
                >
                  <i className={activity.icon}></i>
                </div>

                {/* Timeline Content */}
                <div className="timeline-content flex-grow-1">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <div>
                      <h6 className="mb-1">{activity.title}</h6>
                      <p className="mb-1 text-muted">{activity.description}</p>
                      <small className="text-muted">
                        <i className="bi bi-person me-1"></i>
                        {activity.user}
                      </small>
                    </div>
                    <div className="text-end">
                      <small className="text-muted">
                        {formatDate(activity.created_at)}
                      </small>
                      <div>
                        <span className={`badge bg-${activity.type === 'status_change' ? 'info' : activity.type === 'comment' ? 'primary' : 'secondary'} mt-1`}>
                          {getActivityTypeLabel(activity.type)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connecting Line */}
                {index < filteredActivities.length - 1 && (
                  <div
                    className="timeline-line"
                    style={{
                      position: 'absolute',
                      left: isRTL ? 'auto' : '17px',
                      right: isRTL ? '17px' : 'auto',
                      top: '40px',
                      bottom: '-20px',
                      width: '2px',
                      backgroundColor: '#e9ecef'
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;