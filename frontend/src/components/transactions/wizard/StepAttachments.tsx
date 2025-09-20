import React, { useState, useRef, DragEvent } from 'react';
import { TransactionForm, ALLOWED_FILE_TYPES, MAX_FILE_SIZE, MAX_FILES_PER_TRANSACTION } from '../../../types/transaction';

interface StepAttachmentsProps {
  formData: TransactionForm;
  updateFormData: (updates: Partial<TransactionForm>) => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
}

interface FileItem {
  file: File;
  id: string;
  progress?: number;
  error?: string;
}

const StepAttachments: React.FC<StepAttachmentsProps> = ({
  formData,
  updateFormData,
  errors,
  setErrors,
}) => {
  const [files, setFiles] = useState<FileItem[]>(
    formData.attachments?.map(file => ({ file, id: Math.random().toString(36).substr(2, 9) })) || []
  );
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isRTL = localStorage.getItem('language') === 'ar';

  const getFileIcon = (file: File): string => {
    const type = file.type;
    if (type.includes('pdf')) return 'bi-file-earmark-pdf text-danger';
    if (type.includes('word')) return 'bi-file-earmark-word text-primary';
    if (type.includes('excel') || type.includes('spreadsheet')) return 'bi-file-earmark-excel text-success';
    if (type.includes('image')) return 'bi-file-earmark-image text-info';
    return 'bi-file-earmark text-secondary';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return `File type ${file.type} is not supported`;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`;
    }

    // Check total number of files
    if (files.length >= MAX_FILES_PER_TRANSACTION) {
      return `Maximum ${MAX_FILES_PER_TRANSACTION} files allowed per transaction`;
    }

    // Check for duplicate files
    if (files.some(f => f.file.name === file.name && f.file.size === file.size)) {
      return 'File already added';
    }

    return null;
  };

  const handleFiles = (fileList: FileList) => {
    const newFiles: FileItem[] = [];
    const errors: string[] = [];

    Array.from(fileList).forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        newFiles.push({
          file,
          id: Math.random().toString(36).substr(2, 9),
        });
      }
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (newFiles.length > 0) {
      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      updateFormData({ attachments: updatedFiles.map(f => f.file) });
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    const updatedFiles = files.filter(f => f.id !== id);
    setFiles(updatedFiles);
    updateFormData({ attachments: updatedFiles.map(f => f.file) });
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleVisibilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData({ client_visible_attachments: e.target.checked });
  };

  return (
    <div className="step-content">
      <h4 className="mb-4">
        {isRTL ? 'تحميل المرفقات' : 'Upload Attachments'}
      </h4>

      {/* Drag & Drop Area */}
      <div
        className={`drag-drop-area ${isDragging ? 'dragover' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        <i className="bi bi-cloud-upload fs-1 text-muted mb-3"></i>
        <p className="mb-2">
          {isRTL 
            ? 'اسحب وأفلت الملفات هنا أو انقر للاستعراض'
            : 'Drag and drop files here or click to browse'
          }
        </p>
        <p className="small text-muted">
          {isRTL 
            ? `الملفات المدعومة: PDF، DOC، DOCX، XLS، XLSX، JPG، PNG (الحد الأقصى ${MAX_FILE_SIZE / (1024 * 1024)}MB لكل ملف)`
            : `Supported files: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Max ${MAX_FILE_SIZE / (1024 * 1024)}MB per file)`
          }
        </p>
        <button type="button" className="btn btn-primary mt-3">
          <i className="bi bi-folder-open me-2"></i>
          {isRTL ? 'استعراض الملفات' : 'Browse Files'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          accept={ALLOWED_FILE_TYPES.join(',')}
          onChange={handleFileInput}
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="file-list mt-4">
          <h6 className="mb-3">
            {isRTL ? `الملفات المحملة (${files.length}/${MAX_FILES_PER_TRANSACTION})` : `Uploaded Files (${files.length}/${MAX_FILES_PER_TRANSACTION})`}
          </h6>
          {files.map(fileItem => (
            <div key={fileItem.id} className="file-item">
              <div className="file-item-info">
                <i className={`bi ${getFileIcon(fileItem.file)} file-icon`}></i>
                <div>
                  <div className="fw-semibold">{fileItem.file.name}</div>
                  <small className="text-muted">{formatFileSize(fileItem.file.size)}</small>
                  {fileItem.error && (
                    <small className="text-danger d-block">{fileItem.error}</small>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => removeFile(fileItem.id)}
                aria-label={isRTL ? 'حذف الملف' : 'Remove file'}
              >
                <i className="bi bi-trash"></i>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Client Visibility Option */}
      <div className="mt-4">
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="clientVisible"
            checked={formData.client_visible_attachments}
            onChange={handleVisibilityChange}
          />
          <label className="form-check-label" htmlFor="clientVisible">
            {isRTL 
              ? 'جعل المرفقات مرئية للعميل'
              : 'Make attachments visible to client'
            }
          </label>
        </div>
        <small className="text-muted">
          {isRTL 
            ? 'إذا تم التحديد، سيتمكن العميل من عرض وتحميل هذه المرفقات'
            : 'If checked, the client will be able to view and download these attachments'
          }
        </small>
      </div>

      {/* Info Alert */}
      <div className="alert alert-info mt-4">
        <i className="bi bi-info-circle me-2"></i>
        {isRTL 
          ? 'جميع الملفات سيتم فحصها بحثاً عن الفيروسات قبل التحميل. قد تستغرق الملفات الكبيرة وقتاً أطول في المعالجة.'
          : 'All files will be scanned for viruses before upload. Large files may take longer to process.'
        }
      </div>

      {/* File Statistics */}
      {files.length > 0 && (
        <div className="card bg-light mt-3">
          <div className="card-body">
            <h6 className="card-title">
              <i className="bi bi-bar-chart me-2"></i>
              {isRTL ? 'إحصائيات الملفات' : 'File Statistics'}
            </h6>
            <div className="row">
              <div className="col-md-4">
                <small className="text-muted d-block">
                  {isRTL ? 'إجمالي الملفات' : 'Total Files'}
                </small>
                <p className="mb-0 fw-bold">{files.length}</p>
              </div>
              <div className="col-md-4">
                <small className="text-muted d-block">
                  {isRTL ? 'الحجم الإجمالي' : 'Total Size'}
                </small>
                <p className="mb-0 fw-bold">
                  {formatFileSize(files.reduce((acc, f) => acc + f.file.size, 0))}
                </p>
              </div>
              <div className="col-md-4">
                <small className="text-muted d-block">
                  {isRTL ? 'الرؤية' : 'Visibility'}
                </small>
                <p className="mb-0 fw-bold">
                  {formData.client_visible_attachments 
                    ? (isRTL ? 'مرئي للعميل' : 'Visible to Client')
                    : (isRTL ? 'داخلي فقط' : 'Internal Only')
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepAttachments;