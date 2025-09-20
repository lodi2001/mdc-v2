import React from 'react';
import type { MetricCard } from '../../types/report';

interface MetricsCardsProps {
  metrics: MetricCard[];
  isRTL?: boolean;
}

const MetricsCards: React.FC<MetricsCardsProps> = ({ metrics, isRTL = false }) => {
  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      primary: 'bg-primary',
      success: 'bg-success',
      warning: 'bg-warning',
      danger: 'bg-danger',
      info: 'bg-info'
    };
    return colorMap[color] || 'bg-primary';
  };

  const getTrendIcon = (direction: 'up' | 'down') => {
    return direction === 'up' ? 'bi-arrow-up' : 'bi-arrow-down';
  };

  const getTrendColor = (direction: 'up' | 'down') => {
    return direction === 'up' ? 'text-success' : 'text-danger';
  };

  return (
    <div className="row g-3 mb-4">
      {metrics.map((metric, index) => (
        <div key={index} className="col-xl-3 col-lg-6">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                <div className={`icon-box ${getColorClass(metric.color)} bg-opacity-10 rounded-3 p-3 me-3`}>
                  <i className={`bi ${metric.icon} fs-4 text-${metric.color}`}></i>
                </div>
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-1">
                    {isRTL ? (metric.titleAr || metric.title) : metric.title}
                  </h6>
                  <h3 className="mb-0 fw-bold">{metric.value}</h3>
                </div>
              </div>
              
              {metric.subtitle && (
                <p className="text-muted small mb-2">
                  {isRTL ? (metric.subtitleAr || metric.subtitle) : metric.subtitle}
                </p>
              )}
              
              {metric.trend && (
                <div className={`d-flex align-items-center ${getTrendColor(metric.trend.direction)}`}>
                  <i className={`bi ${getTrendIcon(metric.trend.direction)} me-1`}></i>
                  <span className="fw-semibold">{metric.trend.value}%</span>
                  <span className="text-muted ms-2">
                    {isRTL ? (metric.trend.textAr || metric.trend.text) : metric.trend.text}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricsCards;