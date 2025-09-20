import React, { useState } from 'react';
import type { DateRange } from '../../types/report';

interface ReportFiltersProps {
  onDateRangeChange: (range: DateRange) => void;
  onExport: (format: 'pdf' | 'excel') => void;
  isRTL?: boolean;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({ 
  onDateRangeChange, 
  onExport, 
  isRTL = false 
}) => {
  const [activePreset, setActivePreset] = useState<string>('month');
  const [customRange, setCustomRange] = useState({
    start: '',
    end: ''
  });

  const presets = [
    { value: 'today', label: 'Today', labelAr: 'اليوم' },
    { value: 'week', label: 'This Week', labelAr: 'هذا الأسبوع' },
    { value: 'month', label: 'This Month', labelAr: 'هذا الشهر' },
    { value: 'quarter', label: 'This Quarter', labelAr: 'هذا الربع' },
    { value: 'year', label: 'This Year', labelAr: 'هذه السنة' },
    { value: 'custom', label: 'Custom Range', labelAr: 'نطاق مخصص' }
  ];

  const handlePresetClick = (preset: string) => {
    setActivePreset(preset);
    
    const now = new Date();
    let start: Date;
    let end: Date = new Date();

    switch (preset) {
      case 'today':
        start = new Date();
        break;
      case 'week':
        start = new Date();
        start.setDate(start.getDate() - start.getDay());
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        return;
      default:
        start = new Date();
    }

    onDateRangeChange({
      start,
      end,
      preset: preset as any
    });
  };

  const handleCustomRangeSubmit = () => {
    if (customRange.start && customRange.end) {
      onDateRangeChange({
        start: new Date(customRange.start),
        end: new Date(customRange.end),
        preset: 'custom'
      });
    }
  };

  return (
    <div className="card mb-4">
      <div className="card-body">
        <div className="row align-items-center">
          <div className="col-lg-8">
            <div className="d-flex flex-wrap gap-2 mb-3 mb-lg-0">
              <label className="text-muted me-2 align-self-center">
                {isRTL ? 'الفترة:' : 'Period:'}
              </label>
              {presets.map(preset => (
                <button
                  key={preset.value}
                  className={`btn btn-sm ${activePreset === preset.value ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handlePresetClick(preset.value)}
                >
                  {isRTL ? preset.labelAr : preset.label}
                </button>
              ))}
            </div>
            
            {activePreset === 'custom' && (
              <div className="row g-2 mt-3">
                <div className="col-md-4">
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={customRange.start}
                    onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                    placeholder={isRTL ? 'تاريخ البداية' : 'Start Date'}
                  />
                </div>
                <div className="col-md-4">
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={customRange.end}
                    onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                    placeholder={isRTL ? 'تاريخ النهاية' : 'End Date'}
                  />
                </div>
                <div className="col-md-4">
                  <button
                    className="btn btn-sm btn-primary w-100"
                    onClick={handleCustomRangeSubmit}
                  >
                    {isRTL ? 'تطبيق' : 'Apply'}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="col-lg-4">
            <div className="d-flex justify-content-lg-end gap-2">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => onExport('pdf')}
                title={isRTL ? 'تصدير PDF' : 'Export PDF'}
              >
                <i className="bi bi-file-earmark-pdf me-1"></i>
                PDF
              </button>
              <button
                className="btn btn-sm btn-outline-success"
                onClick={() => onExport('excel')}
                title={isRTL ? 'تصدير Excel' : 'Export Excel'}
              >
                <i className="bi bi-file-earmark-excel me-1"></i>
                Excel
              </button>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => window.print()}
                title={isRTL ? 'طباعة' : 'Print'}
              >
                <i className="bi bi-printer me-1"></i>
                {isRTL ? 'طباعة' : 'Print'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportFilters;