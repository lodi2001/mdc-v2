import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { User, getUserInitials, getRoleBadgeClass, getStatusBadgeClass, formatLastActive } from '../../types/user';

interface UsersListProps {
  users: User[];
  loading: boolean;
  selectedUsers: number[];
  onSelectUser: (userId: number) => void;
  onSelectAll: (selected: boolean) => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
  onResetPassword: (user: User) => void;
  onViewUser: (user: User) => void;
  onChangeStatus: (user: User, status: 'active' | 'inactive' | 'suspended') => void;
  onManagePermissions?: (user: User) => void;
  onViewActivityLog?: (user: User) => void;
  onSendMessage?: (user: User) => void;
  onExportData?: (user: User) => void;
}

const UsersList: React.FC<UsersListProps> = ({
  users,
  loading,
  selectedUsers,
  onSelectUser,
  onSelectAll,
  onEditUser,
  onDeleteUser,
  onResetPassword,
  onViewUser,
  onChangeStatus,
  onManagePermissions,
  onViewActivityLog,
  onSendMessage,
  onExportData
}) => {
  const isRTL = localStorage.getItem('language') === 'ar';

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSelectAll(e.target.checked);
  };

  const handleSelectUser = (userId: number) => {
    onSelectUser(userId);
  };

  const getAvatarColor = (role: string): string => {
    const colors: { [key: string]: string } = {
      'admin': 'bg-danger',
      'editor': 'bg-info',
      'client': 'bg-success'
    };
    return colors[role] || 'bg-secondary';
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th><input type="checkbox" className="form-check-input" checked={false} onChange={() => {}} disabled /></th>
                  <th>{isRTL ? 'الاسم' : 'Name'}</th>
                  <th>{isRTL ? 'البريد الإلكتروني' : 'Email'}</th>
                  <th>{isRTL ? 'الدور' : 'Role'}</th>
                  <th>{isRTL ? 'القسم' : 'Department'}</th>
                  <th>{isRTL ? 'الحالة' : 'Status'}</th>
                  <th>{isRTL ? 'آخر نشاط' : 'Last Active'}</th>
                  <th>{isRTL ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((index) => (
                  <tr key={index}>
                    <td><div className="skeleton-loader" style={{ width: '20px', height: '20px' }}></div></td>
                    <td><div className="skeleton-loader" style={{ width: '150px', height: '20px' }}></div></td>
                    <td><div className="skeleton-loader" style={{ width: '180px', height: '20px' }}></div></td>
                    <td><div className="skeleton-loader" style={{ width: '60px', height: '20px' }}></div></td>
                    <td><div className="skeleton-loader" style={{ width: '100px', height: '20px' }}></div></td>
                    <td><div className="skeleton-loader" style={{ width: '60px', height: '20px' }}></div></td>
                    <td><div className="skeleton-loader" style={{ width: '80px', height: '20px' }}></div></td>
                    <td><div className="skeleton-loader" style={{ width: '30px', height: '20px' }}></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="bi bi-people fs-1 text-muted"></i>
          <p className="text-muted mt-3">
            {isRTL ? 'لم يتم العثور على مستخدمين' : 'No users found'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-hover table-mobile-card">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={(users && selectedUsers.length === users.length && users.length > 0) || false}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>{isRTL ? 'الاسم' : 'Name'}</th>
                <th>{isRTL ? 'البريد الإلكتروني' : 'Email'}</th>
                <th>{isRTL ? 'الدور' : 'Role'}</th>
                <th>{isRTL ? 'القسم' : 'Department'}</th>
                <th>{isRTL ? 'الحالة' : 'Status'}</th>
                <th>{isRTL ? 'آخر نشاط' : 'Last Active'}</th>
                <th>{isRTL ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td data-label="">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                    />
                  </td>
                  <td data-label={isRTL ? 'الاسم' : 'Name'}>
                    <div className="d-flex align-items-center">
                      <div className={`avatar-sm ${getAvatarColor(user.role)} text-white rounded-circle d-flex align-items-center justify-content-center me-2`}>
                        {getUserInitials(user)}
                      </div>
                      <div>
                        <div className="fw-semibold">
                          {user.full_name || `${user.first_name} ${user.last_name}` || user.username}
                        </div>
                        <small className="text-muted">ID: USR{user.id.toString().padStart(3, '0')}</small>
                      </div>
                    </div>
                  </td>
                  <td data-label={isRTL ? 'البريد الإلكتروني' : 'Email'}>
                    {user.email}
                    {user.is_verified && (
                      <i className="bi bi-patch-check-fill text-primary ms-1" title={isRTL ? 'تم التحقق' : 'Verified'}></i>
                    )}
                  </td>
                  <td data-label={isRTL ? 'الدور' : 'Role'}>
                    <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                      {user.role === 'admin' && (isRTL ? 'مدير' : 'Admin')}
                      {user.role === 'editor' && (isRTL ? 'محرر' : 'Editor')}
                      {user.role === 'client' && (isRTL ? 'عميل' : 'Client')}
                    </span>
                  </td>
                  <td data-label={isRTL ? 'القسم' : 'Department'}>
                    {user.department ? (
                      <span>
                        {user.department === 'engineering' && (isRTL ? 'الهندسة' : 'Engineering')}
                        {user.department === 'operations' && (isRTL ? 'العمليات' : 'Operations')}
                        {user.department === 'management' && (isRTL ? 'الإدارة' : 'Management')}
                        {user.department === 'architecture' && (isRTL ? 'العمارة' : 'Architecture')}
                        {user.department === 'legal' && (isRTL ? 'القانونية' : 'Legal')}
                        {user.department === 'finance' && (isRTL ? 'المالية' : 'Finance')}
                        {user.department === 'external' && (isRTL ? 'خارجي' : 'External')}
                        {!['engineering', 'operations', 'management', 'architecture', 'legal', 'finance', 'external'].includes(user.department) && user.department}
                      </span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td data-label={isRTL ? 'الحالة' : 'Status'}>
                    <span className={`badge ${getStatusBadgeClass(user.status)}`}>
                      {user.status === 'active' && (isRTL ? 'نشط' : 'Active')}
                      {user.status === 'inactive' && (isRTL ? 'غير نشط' : 'Inactive')}
                      {user.status === 'suspended' && (isRTL ? 'معلق' : 'Suspended')}
                      {user.status === 'pending' && (isRTL ? 'قيد الانتظار' : 'Pending')}
                    </span>
                  </td>
                  <td data-label={isRTL ? 'آخر نشاط' : 'Last Active'}>
                    {formatLastActive(user.last_login)}
                  </td>
                  <td>
                    <Dropdown align="end">
                      <Dropdown.Toggle 
                        variant="outline-secondary" 
                        size="sm"
                        id={`dropdown-${user.id}`}
                      >
                        <i className="bi bi-three-dots"></i>
                      </Dropdown.Toggle>

                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => onViewUser(user)}>
                          <i className="bi bi-eye me-2"></i>
                          {isRTL ? 'عرض' : 'View'}
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => onEditUser(user)}>
                          <i className="bi bi-pencil me-2"></i>
                          {isRTL ? 'تعديل' : 'Edit'}
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => onResetPassword(user)}>
                          <i className="bi bi-key me-2"></i>
                          {isRTL ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => onManagePermissions?.(user)}>
                          <i className="bi bi-shield-lock me-2"></i>
                          {isRTL ? 'الصلاحيات' : 'Permissions'}
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item onClick={() => onViewActivityLog?.(user)}>
                          <i className="bi bi-clock-history me-2"></i>
                          {isRTL ? 'سجل النشاط' : 'Activity Log'}
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => onSendMessage?.(user)}>
                          <i className="bi bi-envelope me-2"></i>
                          {isRTL ? 'إرسال رسالة' : 'Send Message'}
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => onExportData?.(user)}>
                          <i className="bi bi-download me-2"></i>
                          {isRTL ? 'تصدير البيانات' : 'Export Data'}
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        {user.status === 'active' ? (
                          <Dropdown.Item onClick={() => onChangeStatus(user, 'suspended')}>
                            <i className="bi bi-pause-circle me-2"></i>
                            {isRTL ? 'تعليق الحساب' : 'Suspend Account'}
                          </Dropdown.Item>
                        ) : (
                          <Dropdown.Item onClick={() => onChangeStatus(user, 'active')}>
                            <i className="bi bi-play-circle me-2"></i>
                            {isRTL ? 'تفعيل الحساب' : 'Activate Account'}
                          </Dropdown.Item>
                        )}
                        <Dropdown.Divider />
                        <Dropdown.Item className="text-danger" onClick={() => onDeleteUser(user)}>
                          <i className="bi bi-trash me-2"></i>
                          {isRTL ? 'حذف' : 'Delete'}
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsersList;