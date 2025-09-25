import React from 'react';
import { getHealthColor } from '../../types/auditLog';
import type { AuditLogStatistics, SystemHealth } from '../../types/auditLog';

interface StatisticsCardsProps {
  statistics: AuditLogStatistics | null;
  loading: boolean;
  isRTL: boolean;
}

const StatisticsCards: React.FC<StatisticsCardsProps> = ({ statistics, loading, isRTL }) => {
  const getHealthIcon = (health: SystemHealth) => {
    switch (health) {
      case 'excellent': return 'bi-check-circle-fill';
      case 'good': return 'bi-check-circle';
      case 'warning': return 'bi-exclamation-triangle';
      case 'critical': return 'bi-x-circle-fill';
      default: return 'bi-info-circle';
    }
  };

  const getHealthLabel = (health: SystemHealth) => {
    const labels: Record<SystemHealth, { en: string; ar: string }> = {
      excellent: { en: 'Excellent', ar: 'ممتاز' },
      good: { en: 'Good', ar: 'جيد' },
      warning: { en: 'Warning', ar: 'تحذير' },
      critical: { en: 'Critical', ar: 'حرج' }
    };

    return isRTL ? labels[health].ar : labels[health].en;
  };

  if (loading) {
    return (
      <div className="row mb-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="col-md-3 mb-3">
            <div className="card">
              <div className="card-body">
                <div className="d-flex justify-content-center">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!statistics) return null;

  const cards = [
    {
      title: isRTL ? 'إجمالي الأحداث' : 'Total Events',
      value: statistics.total_events.toLocaleString(),
      icon: 'bi-calendar3',
      color: 'primary',
      subtitle: isRTL ? 'آخر 30 يوم' : 'Last 30 days'
    },
    {
      title: isRTL ? 'المستخدمون النشطون' : 'Active Users',
      value: statistics.active_users.toLocaleString(),
      icon: 'bi-people',
      color: 'success',
      subtitle: isRTL ? 'آخر 7 أيام' : 'Last 7 days'
    },
    {
      title: isRTL ? 'التنبيهات الأمنية' : 'Security Alerts',
      value: statistics.security_alerts.toLocaleString(),
      icon: 'bi-shield-exclamation',
      color: statistics.security_alerts > 0 ? 'danger' : 'secondary',
      subtitle: isRTL ? 'آخر 24 ساعة' : 'Last 24 hours'
    },
    {
      title: isRTL ? 'صحة النظام' : 'System Health',
      value: getHealthLabel(statistics.system_health),
      icon: getHealthIcon(statistics.system_health),
      color: getHealthColor(statistics.system_health),
      subtitle: isRTL ? 'الحالة الحالية' : 'Current Status'
    }
  ];

  return (
    <div className="row mb-4">
      {cards.map((card, index) => (
        <div key={index} className="col-md-3 mb-3">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 className="text-muted mb-1">{card.title}</h6>
                  <h3 className="mb-0">{card.value}</h3>
                </div>
                <div className={`text-${card.color}`}>
                  <i className={`${card.icon} fs-1`}></i>
                </div>
              </div>
              <small className="text-muted">{card.subtitle}</small>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatisticsCards;