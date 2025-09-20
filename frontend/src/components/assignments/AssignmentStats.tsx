import React from 'react';
import type { AssignmentStats } from '../../types/assignment';

interface AssignmentStatsProps {
  stats: AssignmentStats;
  isRTL: boolean;
}

const AssignmentStatsComponent: React.FC<AssignmentStatsProps> = ({ stats, isRTL }) => {
  const statCards = [
    {
      title: isRTL ? 'إجمالي المسند' : 'Total Assigned',
      value: stats.totalAssigned.toString(),
      subtitle: isRTL ? 'المهام النشطة' : 'Active tasks',
      icon: 'bi-list-task',
      bgColor: 'bg-primary-subtle',
      textColor: 'text-primary',
      changeText: isRTL ? 'المهام النشطة' : 'Active tasks',
      changeIcon: 'bi-info-circle',
      changeColor: 'text-info'
    },
    {
      title: isRTL ? 'عاجل' : 'Urgent',
      value: stats.urgent.toString(),
      subtitle: isRTL ? 'مستحقة اليوم' : 'Due today',
      icon: 'bi-exclamation-triangle',
      bgColor: 'bg-danger-subtle',
      textColor: 'text-danger',
      changeText: stats.dueToday > 0 ? `${stats.dueToday} ${isRTL ? 'مستحقة اليوم' : 'due today'}` : isRTL ? 'مستحقة اليوم' : 'Due today',
      changeIcon: 'bi-clock',
      changeColor: 'text-danger'
    },
    {
      title: isRTL ? 'قيد المراجعة' : 'Pending Review',
      value: stats.pendingReview.toString(),
      subtitle: isRTL ? 'في انتظار إجراء' : 'Awaiting action',
      icon: 'bi-hourglass-split',
      bgColor: 'bg-warning-subtle',
      textColor: 'text-warning',
      changeText: isRTL ? 'في انتظار إجراء' : 'Awaiting action',
      changeIcon: 'bi-eye',
      changeColor: 'text-muted'
    },
    {
      title: isRTL ? 'قيد التنفيذ' : 'In Progress',
      value: stats.inProgress.toString(),
      subtitle: isRTL ? 'على المسار الصحيح' : 'On track',
      icon: 'bi-check-circle',
      bgColor: 'bg-success-subtle',
      textColor: 'text-success',
      changeText: isRTL ? 'على المسار الصحيح' : 'On track',
      changeIcon: 'bi-arrow-right',
      changeColor: 'text-success'
    }
  ];

  return (
    <div className="row g-3 mb-4">
      {statCards.map((card, index) => (
        <div key={index} className="col-12 col-sm-6 col-lg-3">
          <div className="stat-card">
            <div className={`stat-icon ${card.bgColor}`}>
              <i className={`bi ${card.icon} ${card.textColor}`}></i>
            </div>
            <div className="stat-content">
              <h3 className={`stat-value ${card.value === '0' ? '' : card.textColor}`}>
                {card.value}
              </h3>
              <p className="stat-label">{card.title}</p>
              <span className={`stat-change ${card.changeColor}`}>
                <i className={`bi ${card.changeIcon}`}></i>{' '}
                <span>{card.changeText}</span>
              </span>
            </div>
          </div>
        </div>
      ))}
      
      {/* Additional metrics row */}
      {(stats.overdue > 0 || stats.averageCompletionTime > 0) && (
        <div className="col-12">
          <div className="alert alert-warning d-flex align-items-center">
            {stats.overdue > 0 && (
              <>
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <span className="me-4">
                  <strong>{stats.overdue}</strong> {isRTL ? 'معاملات متأخرة' : 'overdue tasks'}
                </span>
              </>
            )}
            {stats.averageCompletionTime > 0 && (
              <>
                <i className="bi bi-clock-history ms-auto me-2"></i>
                <span>
                  {isRTL ? 'متوسط وقت الإنجاز' : 'Avg. completion time'}:{' '}
                  <strong>{stats.averageCompletionTime} {isRTL ? 'أيام' : 'days'}</strong>
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentStatsComponent;