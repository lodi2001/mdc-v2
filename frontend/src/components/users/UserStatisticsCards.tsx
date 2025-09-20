import React from 'react';
import { UserStatistics } from '../../types/user';

interface UserStatisticsCardsProps {
  statistics: UserStatistics | null;
  loading: boolean;
}

const UserStatisticsCards: React.FC<UserStatisticsCardsProps> = ({ statistics, loading }) => {
  const isRTL = localStorage.getItem('language') === 'ar';

  const cards = [
    {
      title: isRTL ? 'إجمالي المستخدمين' : 'Total Users',
      value: statistics?.total_users || 0,
      subtitle: statistics?.monthly_growth ? (
        <small className={`text-${statistics.monthly_growth > 0 ? 'success' : 'danger'}`}>
          <i className={`bi bi-arrow-${statistics.monthly_growth > 0 ? 'up' : 'down'}`}></i> {Math.abs(statistics.monthly_growth)}%
          <span className="ms-1">{isRTL ? 'من الشهر الماضي' : 'from last month'}</span>
        </small>
      ) : null
    },
    {
      title: isRTL ? 'المستخدمون النشطون' : 'Active Users',
      value: statistics?.active_users || 0,
      subtitle: statistics?.active_percentage ? (
        <small className="text-muted">
          {statistics.active_percentage}% <span>{isRTL ? 'من الإجمالي' : 'of total'}</span>
        </small>
      ) : null
    },
    {
      title: isRTL ? 'المحررون' : 'Editors',
      value: statistics?.editors_count || 0,
      subtitle: statistics?.editors_percentage ? (
        <small className="text-muted">
          {statistics.editors_percentage}% <span>{isRTL ? 'من الإجمالي' : 'of total'}</span>
        </small>
      ) : null
    },
    {
      title: isRTL ? 'العملاء' : 'Clients',
      value: statistics?.clients_count || 0,
      subtitle: statistics?.clients_percentage ? (
        <small className="text-muted">
          {statistics.clients_percentage}% <span>{isRTL ? 'من الإجمالي' : 'of total'}</span>
        </small>
      ) : null
    }
  ];

  if (loading) {
    return (
      <div className="row mb-4">
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className="col-12 col-sm-6 col-md-3">
            <div className="card">
              <div className="card-body">
                <div className="skeleton-loader mb-2" style={{ height: '20px', width: '60%' }}></div>
                <div className="skeleton-loader mb-2" style={{ height: '32px', width: '40%' }}></div>
                <div className="skeleton-loader" style={{ height: '16px', width: '80%' }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="row mb-4">
      {cards.map((card, index) => (
        <div key={index} className="col-12 col-sm-6 col-md-3">
          <div className="card">
            <div className="card-body">
              <h6 className="text-muted mb-2">{card.title}</h6>
              <h3 className="mb-0">{card.value.toLocaleString()}</h3>
              {card.subtitle}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserStatisticsCards;