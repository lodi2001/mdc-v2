# MDC TTS Component Library

## Component Categories

### 1. Navigation Components
- **Sidebar**: Collapsible navigation menu
- **Header Bar**: Top navigation with search
- **Breadcrumbs**: Hierarchical navigation
- **Tab Navigation**: Content section switcher
- **Language Toggle**: EN/AR switcher

### 2. Form Components
- **Input Field**: Text, email, password inputs
- **Select Dropdown**: Single/multi-select
- **Date Picker**: Calendar date selection
- **File Upload**: Drag & drop uploader
- **Checkbox/Radio**: Selection controls
- **Form Validation**: Error/success messages

### 3. Data Display
- **Data Table**: Sortable, filterable tables
- **Card**: Content container
- **Status Badge**: Visual status indicators
- **Progress Bar**: Loading/completion indicator
- **Charts**: Pie, line, bar visualizations
- **Timeline**: Status history display

### 4. Action Components
- **Button**: Primary, secondary, outline variants
- **Quick Actions**: Floating action menu
- **Modal**: Dialog overlay
- **Dropdown Menu**: Context actions
- **Confirmation Dialog**: Delete/update confirmations

### 5. Feedback Components
- **Alert**: Success/error/warning messages
- **Toast Notification**: Temporary messages
- **Loading Spinner**: Activity indicator
- **Empty State**: No data messages
- **Error Boundary**: Error fallback UI

## Component Implementation Examples

### Button Component
```jsx
// Button.jsx
const Button = ({
  variant = 'primary', // primary, secondary, outline, danger
  size = 'md',        // sm, md, lg
  icon = null,
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  children
}) => {
  const classNames = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth && 'btn-full',
    loading && 'btn-loading',
    disabled && 'btn-disabled'
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classNames}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading ? <Spinner size="sm" /> : icon}
      <span>{children}</span>
    </button>
  );
};
```

### Status Badge Component
```jsx
// StatusBadge.jsx
const StatusBadge = ({ status, size = 'md' }) => {
  const statusConfig = {
    draft: { color: 'gray', icon: '○' },
    submitted: { color: 'info', icon: '◐' },
    approved: { color: 'primary', icon: '◑' },
    'in-progress': { color: 'blue', icon: '◕' },
    pending: { color: 'warning', icon: '◔' },
    paid: { color: 'teal', icon: '◉' },
    completed: { color: 'success', icon: '●' },
    cancelled: { color: 'danger', icon: '×' },
    'on-hold': { color: 'orange', icon: '⊙' }
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span className={`badge badge-${config.color} badge-${size}`}>
      <span className="badge-indicator">{config.icon}</span>
      <span className="badge-text">{status}</span>
    </span>
  );
};
```

### Data Table Component
```jsx
// DataTable.jsx
const DataTable = ({
  columns,
  data,
  sortable = true,
  selectable = false,
  onSort,
  onSelect,
  loading = false
}) => {
  const [sortConfig, setSortConfig] = useState({});
  const [selectedRows, setSelectedRows] = useState([]);

  const handleSort = (column) => {
    if (!sortable) return;
    
    const direction = sortConfig.column === column && 
                     sortConfig.direction === 'asc' ? 'desc' : 'asc';
    
    setSortConfig({ column, direction });
    onSort?.(column, direction);
  };

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            {selectable && (
              <th className="checkbox-column">
                <Checkbox
                  checked={selectedRows.length === data.length}
                  onChange={handleSelectAll}
                />
              </th>
            )}
            {columns.map(column => (
              <th
                key={column.key}
                onClick={() => handleSort(column.key)}
                className={sortable ? 'sortable' : ''}
              >
                <span>{column.label}</span>
                {sortable && <SortIcon column={column.key} config={sortConfig} />}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={columns.length}><Loading /></td></tr>
          ) : data.map(row => (
            <tr key={row.id}>
              {selectable && (
                <td>
                  <Checkbox
                    checked={selectedRows.includes(row.id)}
                    onChange={() => handleRowSelect(row.id)}
                  />
                </td>
              )}
              {columns.map(column => (
                <td key={column.key}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

### File Upload Component
```jsx
// FileUpload.jsx
const FileUpload = ({
  accept = '.pdf,.jpg,.png,.doc,.docx,.xls,.xlsx',
  maxSize = 10 * 1024 * 1024, // 10MB
  multiple = true,
  onUpload,
  onError
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState([]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    validateAndUpload(files);
  };

  const validateAndUpload = async (files) => {
    for (const file of files) {
      if (file.size > maxSize) {
        onError?.(`${file.name} exceeds max size of ${maxSize / 1024 / 1024}MB`);
        continue;
      }

      setUploading(prev => [...prev, { name: file.name, progress: 0 }]);
      
      try {
        await uploadFile(file, (progress) => {
          setUploading(prev => prev.map(f => 
            f.name === file.name ? { ...f, progress } : f
          ));
        });
        
        onUpload?.(file);
      } catch (error) {
        onError?.(error.message);
      }
    }
  };

  return (
    <div className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
         onDrop={handleDrop}
         onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
         onDragLeave={() => setDragOver(false)}>
      
      <UploadIcon />
      <p>Drop files here or</p>
      <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
        Browse Files
      </Button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        hidden
      />
      
      {uploading.map(file => (
        <div key={file.name} className="upload-progress">
          <span>{file.name}</span>
          <ProgressBar value={file.progress} />
        </div>
      ))}
    </div>
  );
};
```

---

*Component Library v1.0 - MDC TTS*