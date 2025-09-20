import React from 'react';

interface StatsCardProps {
  icon: string;
  iconColor: string;
  value: number | string;
  label: string;
  change?: {
    value: string;
    type: 'increase' | 'decrease' | 'same';
  };
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  icon, 
  iconColor, 
  value, 
  label, 
  change 
}) => {
  const getChangeIcon = () => {
    if (!change) return null;
    if (change.type === 'increase') return 'bi-arrow-up';
    if (change.type === 'decrease') return 'bi-arrow-down';
    return 'bi-dash';
  };

  const getChangeClass = () => {
    if (!change) return '';
    if (change.type === 'increase') return 'text-success';
    if (change.type === 'decrease') return 'text-danger';
    return 'text-warning';
  };

  return (
    <div className="stat-card">
      <div className={`stat-icon bg-${iconColor}-subtle`}>
        <i className={`bi ${icon} text-${iconColor}`}></i>
      </div>
      <div className="stat-content">
        <h3 className="stat-value">{value}</h3>
        <p className="stat-label">{label}</p>
        {change && (
          <span className={`stat-change ${getChangeClass()}`}>
            <i className={`bi ${getChangeIcon()}`}></i> {change.value}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatsCard;