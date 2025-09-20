import React, { useState, useEffect } from 'react';
import { User, CreateUserRequest, UpdateUserRequest } from '../../types/user';
import userService from '../../services/api/userService';

interface AddEditUserModalProps {
  show: boolean;
  user: User | null;
  onClose: () => void;
  onSave: () => void;
}

const AddEditUserModal: React.FC<AddEditUserModalProps> = ({
  show,
  user,
  onClose,
  onSave
}) => {
  const isRTL = localStorage.getItem('language') === 'ar';
  const [formData, setFormData] = useState<any>({
    email: '',
    first_name: '',
    last_name: '',
    role: 'client',
    department: '',
    company_name: '',
    phone: '',
    password: '',
    status: 'active',
    send_welcome_email: true
  });
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        department: user.department || '',
        company_name: user.company_name || '',
        phone: user.phone || '',
        status: user.status || 'active',
        password: '',
        send_welcome_email: false
      });
    } else {
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        role: 'client',
        department: '',
        company_name: '',
        phone: '',
        password: '',
        status: 'active',
        send_welcome_email: true
      });
      setShowPassword(false);
    }
    setErrors({});
  }, [user, show]);

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const generatePassword = () => {
    const password = userService.generateTemporaryPassword();
    setFormData({ ...formData, password });
    setShowPassword(true);
  };

  const validateForm = (): boolean => {
    const newErrors: any = {};

    if (!formData.email) {
      newErrors.email = isRTL ? 'البريد الإلكتروني مطلوب' : 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = isRTL ? 'البريد الإلكتروني غير صالح' : 'Invalid email format';
    }

    if (!formData.first_name) {
      newErrors.first_name = isRTL ? 'الاسم الأول مطلوب' : 'First name is required';
    }

    if (!formData.last_name) {
      newErrors.last_name = isRTL ? 'اسم العائلة مطلوب' : 'Last name is required';
    }

    if (!user && !formData.password) {
      newErrors.password = isRTL ? 'كلمة المرور مطلوبة' : 'Password is required';
    }

    if (formData.password && formData.password.length < 8) {
      newErrors.password = isRTL ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (user) {
        const updateData: UpdateUserRequest = {
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          status: formData.status,
          department: formData.department,
          company_name: formData.company_name,
          phone: formData.phone
        };
        await userService.updateUser(user.id, updateData);
      } else {
        const createData: CreateUserRequest = {
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          department: formData.department,
          company_name: formData.company_name,
          phone: formData.phone,
          send_welcome_email: formData.send_welcome_email
        };
        await userService.createUser(createData);
      }
      onSave();
      onClose();
    } catch (error: any) {
      if (error.response?.data) {
        const apiErrors = error.response.data;
        const newErrors: any = {};
        Object.keys(apiErrors).forEach(key => {
          if (Array.isArray(apiErrors[key])) {
            newErrors[key] = apiErrors[key][0];
          } else {
            newErrors[key] = apiErrors[key];
          }
        });
        setErrors(newErrors);
      } else {
        setErrors({ 
          general: isRTL ? 'حدث خطأ. يرجى المحاولة مرة أخرى.' : 'An error occurred. Please try again.' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <>
      <div className="modal fade show d-block" tabIndex={-1} role="dialog">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {user ? (isRTL ? 'تعديل المستخدم' : 'Edit User') : (isRTL ? 'إضافة مستخدم جديد' : 'Add New User')}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {errors.general && (
                  <div className="alert alert-danger">{errors.general}</div>
                )}

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      {isRTL ? 'الاسم الأول' : 'First Name'} <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.first_name ? 'is-invalid' : ''}`}
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      disabled={loading}
                    />
                    {errors.first_name && (
                      <div className="invalid-feedback">{errors.first_name}</div>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      {isRTL ? 'اسم العائلة' : 'Last Name'} <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.last_name ? 'is-invalid' : ''}`}
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      disabled={loading}
                    />
                    {errors.last_name && (
                      <div className="invalid-feedback">{errors.last_name}</div>
                    )}
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      {isRTL ? 'البريد الإلكتروني' : 'Email'} <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={loading}
                    />
                    {errors.email && (
                      <div className="invalid-feedback">{errors.email}</div>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      {isRTL ? 'رقم الهاتف' : 'Phone'}
                    </label>
                    <input
                      type="tel"
                      className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={loading}
                    />
                    {errors.phone && (
                      <div className="invalid-feedback">{errors.phone}</div>
                    )}
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      {isRTL ? 'الدور' : 'Role'} <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${errors.role ? 'is-invalid' : ''}`}
                      value={formData.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      disabled={loading}
                    >
                      <option value="client">{isRTL ? 'عميل' : 'Client'}</option>
                      <option value="editor">{isRTL ? 'محرر' : 'Editor'}</option>
                      <option value="admin">{isRTL ? 'مدير' : 'Admin'}</option>
                    </select>
                    {errors.role && (
                      <div className="invalid-feedback">{errors.role}</div>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      {isRTL ? 'القسم' : 'Department'}
                    </label>
                    <select
                      className={`form-select ${errors.department ? 'is-invalid' : ''}`}
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      disabled={loading}
                    >
                      <option value="">{isRTL ? 'اختر القسم' : 'Select Department'}</option>
                      <option value="engineering">{isRTL ? 'الهندسة' : 'Engineering'}</option>
                      <option value="operations">{isRTL ? 'العمليات' : 'Operations'}</option>
                      <option value="management">{isRTL ? 'الإدارة' : 'Management'}</option>
                      <option value="architecture">{isRTL ? 'العمارة' : 'Architecture'}</option>
                      <option value="legal">{isRTL ? 'القانونية' : 'Legal'}</option>
                      <option value="finance">{isRTL ? 'المالية' : 'Finance'}</option>
                      <option value="external">{isRTL ? 'خارجي' : 'External'}</option>
                    </select>
                    {errors.department && (
                      <div className="invalid-feedback">{errors.department}</div>
                    )}
                  </div>
                </div>

                {user && (
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        {isRTL ? 'الحالة' : 'Status'}
                      </label>
                      <select
                        className={`form-select ${errors.status ? 'is-invalid' : ''}`}
                        value={formData.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        disabled={loading}
                      >
                        <option value="active">{isRTL ? 'نشط' : 'Active'}</option>
                        <option value="inactive">{isRTL ? 'غير نشط' : 'Inactive'}</option>
                        <option value="suspended">{isRTL ? 'معلق' : 'Suspended'}</option>
                      </select>
                      {errors.status && (
                        <div className="invalid-feedback">{errors.status}</div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">
                    {isRTL ? 'اسم الشركة' : 'Company Name'}
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.company_name ? 'is-invalid' : ''}`}
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    disabled={loading}
                  />
                  {errors.company_name && (
                    <div className="invalid-feedback">{errors.company_name}</div>
                  )}
                </div>

                {!user && (
                  <>
                    <div className="mb-3">
                      <label className="form-label">
                        {isRTL ? 'كلمة المرور' : 'Password'} <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          disabled={loading}
                          placeholder={isRTL ? 'أدخل كلمة مرور مؤقتة' : 'Enter temporary password'}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={generatePassword}
                        >
                          <i className="bi bi-shuffle me-1"></i>
                          {isRTL ? 'توليد' : 'Generate'}
                        </button>
                      </div>
                      {errors.password && (
                        <div className="text-danger small mt-1">{errors.password}</div>
                      )}
                    </div>

                    <div className="form-check mb-3">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="sendWelcomeEmail"
                        checked={formData.send_welcome_email}
                        onChange={(e) => handleInputChange('send_welcome_email', e.target.checked)}
                        disabled={loading}
                      />
                      <label className="form-check-label" htmlFor="sendWelcomeEmail">
                        {isRTL ? 'إرسال بريد إلكتروني ترحيبي' : 'Send welcome email'}
                      </label>
                    </div>
                  </>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading && <span className="spinner-border spinner-border-sm me-2"></span>}
                  {user ? (isRTL ? 'حفظ التغييرات' : 'Save Changes') : (isRTL ? 'إضافة مستخدم' : 'Add User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
};

export default AddEditUserModal;