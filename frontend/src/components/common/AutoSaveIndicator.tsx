import React from 'react';

interface AutoSaveIndicatorProps {
  show: boolean;
}

const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({ show }) => {
  const isRTL = localStorage.getItem('language') === 'ar';
  
  return (
    <div className={`auto-save-indicator ${show ? 'show' : ''}`}>
      <i className="bi bi-check-circle me-2"></i>
      <span>
        {isRTL ? 'تم حفظ المسودة تلقائياً' : 'Draft saved automatically'}
      </span>
    </div>
  );
};

export default AutoSaveIndicator;