import React from 'react';
import type { PerformanceMetric } from '../../types/report';

interface TopPerformersTableProps {
  data: PerformanceMetric[];
  isRTL?: boolean;
}

const TopPerformersTable: React.FC<TopPerformersTableProps> = ({ data, isRTL = false }) => {
  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-warning text-dark';
      case 2: return 'bg-secondary text-white';
      case 3: return 'bg-danger text-white';
      default: return 'bg-light text-dark';
    }
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-success';
    if (efficiency >= 70) return 'text-warning';
    return 'text-danger';
  };

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="card-title mb-0">
          {isRTL ? 'أفضل المؤدين' : 'Top Performers'}
        </h5>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>{isRTL ? 'الترتيب' : 'Rank'}</th>
                <th>{isRTL ? 'الموظف' : 'Employee'}</th>
                <th>{isRTL ? 'القسم' : 'Department'}</th>
                <th>{isRTL ? 'المكتملة' : 'Completed'}</th>
                <th>{isRTL ? 'متوسط الوقت' : 'Avg. Time'}</th>
                <th>{isRTL ? 'الكفاءة' : 'Efficiency'}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((performer, index) => (
                <tr key={index}>
                  <td>
                    <span className={`badge rounded-pill ${getRankBadgeColor(performer.rank)}`}>
                      #{performer.rank}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <div className="avatar avatar-sm me-2">
                        <span className="avatar-initial rounded-circle bg-primary text-white">
                          {performer.user.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <span className="fw-medium">{performer.user}</span>
                    </div>
                  </td>
                  <td>{performer.department}</td>
                  <td>
                    <span className="badge bg-success bg-opacity-10 text-success">
                      {performer.completed}
                    </span>
                  </td>
                  <td>{performer.avgTime}</td>
                  <td>
                    <div className="d-flex align-items-center">
                      <div className="progress flex-grow-1 me-2" style={{ height: '8px' }}>
                        <div 
                          className={`progress-bar ${performer.efficiency >= 90 ? 'bg-success' : performer.efficiency >= 70 ? 'bg-warning' : 'bg-danger'}`}
                          style={{ width: `${performer.efficiency}%` }}
                        />
                      </div>
                      <span className={`fw-semibold ${getEfficiencyColor(performer.efficiency)}`}>
                        {performer.efficiency}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TopPerformersTable;