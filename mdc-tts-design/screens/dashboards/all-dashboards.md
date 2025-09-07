# MDC TTS - Dashboard Designs

## 1. Admin Dashboard

### Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│ Header: MDC Logo | Search Bar | Notifications | User Menu | Lang │
├───────────┬─────────────────────────────────────────────────────┤
│           │                                                      │
│  Sidebar  │  ┌─────────┬─────────┬─────────┬─────────┐        │
│           │  │ Total   │ Pending │ This    │ Revenue │        │
│ Dashboard │  │ Trans.  │ Trans.  │ Month   │ SAR     │        │
│ > Trans.  │  │  1,245  │   45    │  328    │ 2.5M    │        │
│   Users   │  └─────────┴─────────┴─────────┴─────────┘        │
│   Reports │                                                      │
│   Audit   │  ┌──────────────────────┬──────────────────┐       │
│   Settings│  │ Transaction Status   │ Monthly Trend    │       │
│           │  │ [Pie Chart]          │ [Line Chart]     │       │
│           │  └──────────────────────┴──────────────────┘       │
│           │                                                      │
│           │  ┌────────────────────────────────────────┐        │
│           │  │ Recent Transactions                     │        │
│           │  ├────────────────────────────────────────┤        │
│           │  │ TRX-2024-00145  |  In Progress  | 50K  │        │
│           │  │ TRX-2024-00144  |  Pending      | 25K  │        │
│           │  │ TRX-2024-00143  |  Completed    | 100K │        │
│           │  └────────────────────────────────────────┘        │
└───────────┴─────────────────────────────────────────────────────┘
```

### Key Metrics Cards
```css
.metric-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.metric-value {
  font-size: 32px;
  font-weight: 700;
  color: #1a5f3f;
}

.metric-label {
  font-size: 14px;
  color: #6c757d;
  margin-top: 8px;
}

.metric-change {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  margin-top: 8px;
}

.metric-change.positive { color: #28a745; }
.metric-change.negative { color: #dc3545; }
```

### Charts Configuration
```javascript
// Transaction Status Pie Chart
const statusChart = {
  type: 'doughnut',
  data: {
    labels: ['Completed', 'In Progress', 'Pending', 'On Hold'],
    datasets: [{
      data: [450, 230, 125, 45],
      backgroundColor: ['#28a745', '#17a2b8', '#ffc107', '#fd7e14']
    }]
  }
};

// Monthly Trend Line Chart
const trendChart = {
  type: 'line',
  data: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Transactions',
      data: [180, 210, 195, 240, 280, 328],
      borderColor: '#1a5f3f',
      tension: 0.4
    }]
  }
};
```

## 2. Editor Dashboard

### Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│ Header: MDC Logo | Search | Quick Actions | Notifications | User │
├───────────┬─────────────────────────────────────────────────────┤
│           │                                                      │
│  Sidebar  │  Welcome back, [Editor Name]!                       │
│           │                                                      │
│ Dashboard │  ┌─────────┬─────────┬─────────┬─────────┐        │
│ > My Tasks│  │ Assigned│ Due     │ Overdue │ Completed│        │
│   Create  │  │ to Me   │ Today   │ Tasks   │ This Week│        │
│   All     │  │   23    │   5     │   2     │    15   │        │
│   Import  │  └─────────┴─────────┴─────────┴─────────┘        │
│           │                                                      │
│           │  My Workload                                        │
│           │  ┌────────────────────────────────────────┐        │
│           │  │ [Progress bars showing task distribution]│        │
│           │  │ Draft: ████ 8                          │        │
│           │  │ In Progress: ████████ 12              │        │
│           │  │ Review: ██ 3                          │        │
│           │  └────────────────────────────────────────┘        │
│           │                                                      │
│           │  Tasks Requiring Action                             │
│           │  ┌────────────────────────────────────────┐        │
│           │  │ □ TRX-2024-00145 - Awaiting documents  │        │
│           │  │ □ TRX-2024-00142 - Review required     │        │
│           │  │ □ TRX-2024-00139 - Update status       │        │
│           │  └────────────────────────────────────────┘        │
└───────────┴─────────────────────────────────────────────────────┘
```

### Workload Visualization
```css
.workload-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
}

.workload-label {
  min-width: 100px;
  font-size: 14px;
  color: #495057;
}

.workload-progress {
  flex: 1;
  height: 24px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.workload-fill {
  height: 100%;
  background: linear-gradient(90deg, #1a5f3f, #2a7f5f);
  transition: width 0.3s ease;
}

.workload-count {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  font-weight: 600;
  color: white;
}
```

## 3. Client Dashboard

### Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│ Header: MDC Logo | My Transactions | Reports | Profile | Lang   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Welcome, [Client Name] - [Company Name]                        │
│                                                                  │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐    │
│  │ Active      │ Completed   │ Total Amount│ Pending     │    │
│  │ Transactions│ This Month  │ SAR         │ Payments    │    │
│  │     12      │     8       │   450,000   │   125,000   │    │
│  └─────────────┴─────────────┴─────────────┴─────────────┘    │
│                                                                  │
│  Transaction Status Overview                                    │
│  ┌─────────────────────────────────────────────────────┐      │
│  │ [Visual status timeline showing transaction stages]  │      │
│  │  Draft → Submitted → Approved → In Progress → Paid  │      │
│  └─────────────────────────────────────────────────────┘      │
│                                                                  │
│  My Recent Transactions                    [View All] [Export]  │
│  ┌─────────────────────────────────────────────────────┐      │
│  │ ID          | Title        | Amount  | Status | Action│      │
│  ├─────────────────────────────────────────────────────┤      │
│  │ TRX-2024-145| Project ABC  | 50,000  | ● Paid | View │      │
│  │ TRX-2024-144| Consultation | 25,000  | ● Pending|View │      │
│  │ TRX-2024-143| Design Work  | 100,000 | ● Progress|View│      │
│  └─────────────────────────────────────────────────────┘      │
│                                                                  │
│  Quick Actions:                                                 │
│  [Download Reports] [View Attachments] [Contact Support]        │
└─────────────────────────────────────────────────────────────────┘
```

### Status Timeline Component
```css
.status-timeline {
  display: flex;
  justify-content: space-between;
  padding: 24px;
  background: #f8f9fa;
  border-radius: 8px;
}

.timeline-step {
  flex: 1;
  text-align: center;
  position: relative;
}

.timeline-step::after {
  content: '';
  position: absolute;
  top: 20px;
  right: -50%;
  width: 100%;
  height: 2px;
  background: #dee2e6;
}

.timeline-step:last-child::after {
  display: none;
}

.timeline-step.active::after {
  background: #1a5f3f;
}

.timeline-icon {
  width: 40px;
  height: 40px;
  margin: 0 auto 8px;
  border-radius: 50%;
  background: white;
  border: 2px solid #dee2e6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.timeline-step.active .timeline-icon {
  background: #1a5f3f;
  border-color: #1a5f3f;
  color: white;
}

.timeline-step.completed .timeline-icon {
  background: #28a745;
  border-color: #28a745;
  color: white;
}
```

## 4. Common Dashboard Components

### Navigation Sidebar
```css
.sidebar {
  width: 260px;
  height: 100vh;
  background: #2d3139;
  color: white;
  padding: 24px 0;
  position: fixed;
  left: 0;
  top: 0;
  transition: transform 0.3s ease;
}

.sidebar-item {
  padding: 12px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: all 0.2s ease;
}

.sidebar-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.sidebar-item.active {
  background: #1a5f3f;
  color: white;
  border-left: 4px solid #2a7f5f;
}

.sidebar-icon {
  width: 20px;
  height: 20px;
}

.sidebar-label {
  font-size: 14px;
  font-weight: 500;
}
```

### Header Bar
```css
.header {
  height: 64px;
  background: white;
  border-bottom: 1px solid #dee2e6;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  top: 0;
  left: 260px;
  right: 0;
  z-index: 100;
}

.header-search {
  flex: 1;
  max-width: 400px;
}

.search-input {
  width: 100%;
  height: 40px;
  padding: 0 40px 0 16px;
  border: 1px solid #dee2e6;
  border-radius: 20px;
  font-size: 14px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.notification-badge {
  position: relative;
}

.notification-count {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  background: #dc3545;
  color: white;
  font-size: 10px;
  font-weight: 700;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### Data Tables
```css
.data-table {
  width: 100%;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table-header {
  background: #f8f9fa;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: #212529;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.table-content {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #dee2e6;
}

.table td {
  padding: 16px;
  font-size: 14px;
  color: #495057;
  border-bottom: 1px solid #e9ecef;
}

.table tbody tr:hover {
  background: #f8f9fa;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 4px;
}

.status-badge.completed {
  background: rgba(40, 167, 69, 0.1);
  color: #28a745;
}

.status-badge.completed .status-indicator {
  background: #28a745;
}

.status-badge.pending {
  background: rgba(255, 193, 7, 0.1);
  color: #ffc107;
}

.status-badge.pending .status-indicator {
  background: #ffc107;
}

.status-badge.in-progress {
  background: rgba(23, 162, 184, 0.1);
  color: #17a2b8;
}

.status-badge.in-progress .status-indicator {
  background: #17a2b8;
}
```

## 5. Responsive Dashboard Behavior

### Mobile Navigation
```css
@media (max-width: 767px) {
  .sidebar {
    transform: translateX(-100%);
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
  
  .header {
    left: 0;
  }
  
  .mobile-menu-toggle {
    display: block;
  }
  
  .metric-cards {
    grid-template-columns: 1fr;
  }
  
  .chart-container {
    grid-template-columns: 1fr;
  }
}
```

### Tablet Adjustments
```css
@media (min-width: 768px) and (max-width: 1023px) {
  .sidebar {
    width: 80px;
  }
  
  .sidebar-label {
    display: none;
  }
  
  .header {
    left: 80px;
  }
  
  .metric-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

## 6. Arabic RTL Support

### Dashboard RTL Layout
```css
[dir="rtl"] .sidebar {
  right: 0;
  left: auto;
  border-left: none;
  border-right: 1px solid #dee2e6;
}

[dir="rtl"] .sidebar-item.active {
  border-left: none;
  border-right: 4px solid #2a7f5f;
}

[dir="rtl"] .header {
  left: auto;
  right: 260px;
}

[dir="rtl"] .table th,
[dir="rtl"] .table td {
  text-align: right;
}

[dir="rtl"] .status-timeline {
  direction: rtl;
}

[dir="rtl"] .timeline-step::after {
  right: auto;
  left: -50%;
}
```

## 7. Interactive Elements

### Quick Actions Menu
```css
.quick-actions {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
}

.quick-action-toggle {
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background: #1a5f3f;
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(26, 95, 63, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
}

.quick-action-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(26, 95, 63, 0.4);
}

.quick-action-menu {
  position: absolute;
  bottom: 70px;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 8px 0;
  min-width: 180px;
  opacity: 0;
  transform: translateY(10px);
  pointer-events: none;
  transition: all 0.3s ease;
}

.quick-action-menu.open {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.quick-action-item {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #495057;
  text-decoration: none;
  transition: background 0.2s ease;
}

.quick-action-item:hover {
  background: #f8f9fa;
}
```

---

*Dashboard Designs v1.0 - MDC TTS*