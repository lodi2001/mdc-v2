/**
 * Centralized status color configuration
 * Based on MDC Transaction Tracking System prototype design
 */

export interface StatusColor {
  background: string;
  text: string;
  border: string;
}

// Main status colors matching the prototype CSS
export const STATUS_COLORS: Record<string, StatusColor> = {
  draft: {
    background: '#6c757d',
    text: '#ffffff',
    border: '#6c757d'
  },
  submitted: {
    background: '#17a2b8',
    text: '#ffffff',
    border: '#17a2b8'
  },
  under_review: {
    background: '#17a2b8',  // Same as submitted (info color)
    text: '#ffffff',
    border: '#17a2b8'
  },
  approved: {
    background: '#007bff',
    text: '#ffffff',
    border: '#007bff'
  },
  in_progress: {
    background: '#0056b3',
    text: '#ffffff',
    border: '#0056b3'
  },
  pending: {
    background: '#ffc107',
    text: '#212529',  // Dark text for better contrast on yellow
    border: '#ffc107'
  },
  paid: {
    background: '#20c997',
    text: '#ffffff',
    border: '#20c997'
  },
  completed: {
    background: '#28a745',
    text: '#ffffff',
    border: '#28a745'
  },
  cancelled: {
    background: '#dc3545',
    text: '#ffffff',
    border: '#dc3545'
  },
  on_hold: {
    background: '#fd7e14',
    text: '#ffffff',
    border: '#fd7e14'
  }
};

// Light versions for backgrounds (10% opacity)
export const STATUS_COLORS_LIGHT: Record<string, StatusColor> = {
  draft: {
    background: 'rgba(108, 117, 125, 0.1)',
    text: '#6c757d',
    border: 'rgba(108, 117, 125, 0.3)'
  },
  submitted: {
    background: 'rgba(23, 162, 184, 0.1)',
    text: '#17a2b8',
    border: 'rgba(23, 162, 184, 0.3)'
  },
  under_review: {
    background: 'rgba(23, 162, 184, 0.1)',
    text: '#17a2b8',
    border: 'rgba(23, 162, 184, 0.3)'
  },
  approved: {
    background: 'rgba(0, 123, 255, 0.1)',
    text: '#007bff',
    border: 'rgba(0, 123, 255, 0.3)'
  },
  in_progress: {
    background: 'rgba(0, 86, 179, 0.1)',
    text: '#0056b3',
    border: 'rgba(0, 86, 179, 0.3)'
  },
  pending: {
    background: 'rgba(255, 193, 7, 0.1)',
    text: '#ffc107',
    border: 'rgba(255, 193, 7, 0.3)'
  },
  paid: {
    background: 'rgba(32, 201, 151, 0.1)',
    text: '#20c997',
    border: 'rgba(32, 201, 151, 0.3)'
  },
  completed: {
    background: 'rgba(40, 167, 69, 0.1)',
    text: '#28a745',
    border: 'rgba(40, 167, 69, 0.3)'
  },
  cancelled: {
    background: 'rgba(220, 53, 69, 0.1)',
    text: '#dc3545',
    border: 'rgba(220, 53, 69, 0.3)'
  },
  on_hold: {
    background: 'rgba(253, 126, 20, 0.1)',
    text: '#fd7e14',
    border: 'rgba(253, 126, 20, 0.3)'
  }
};

// Chart colors - using the main status colors
export const CHART_COLORS: Record<string, string> = {
  draft: '#6c757d',
  submitted: '#17a2b8',
  under_review: '#17a2b8',
  approved: '#007bff',
  in_progress: '#0056b3',
  pending: '#ffc107',
  paid: '#20c997',
  completed: '#28a745',
  cancelled: '#dc3545',
  on_hold: '#fd7e14'
};

// Priority colors
export const PRIORITY_COLORS: Record<string, StatusColor> = {
  low: {
    background: '#28a745',
    text: '#ffffff',
    border: '#28a745'
  },
  normal: {
    background: '#17a2b8',
    text: '#ffffff',
    border: '#17a2b8'
  },
  high: {
    background: '#ffc107',
    text: '#212529',
    border: '#ffc107'
  },
  urgent: {
    background: '#dc3545',
    text: '#ffffff',
    border: '#dc3545'
  }
};

/**
 * Get status color configuration
 * @param status - The transaction status
 * @param variant - 'solid' for badges, 'light' for backgrounds
 */
export function getStatusColor(status: string, variant: 'solid' | 'light' = 'solid'): StatusColor {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_');
  const colors = variant === 'solid' ? STATUS_COLORS : STATUS_COLORS_LIGHT;

  return colors[normalizedStatus] || {
    background: '#6c757d',
    text: '#ffffff',
    border: '#6c757d'
  };
}

/**
 * Get chart color for a status
 * @param status - The transaction status
 */
export function getChartColor(status: string): string {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_');
  return CHART_COLORS[normalizedStatus] || '#6c757d';
}

/**
 * Get priority color configuration
 * @param priority - The transaction priority
 */
export function getPriorityColor(priority: string): StatusColor {
  const normalizedPriority = priority.toLowerCase();
  return PRIORITY_COLORS[normalizedPriority] || PRIORITY_COLORS.normal;
}