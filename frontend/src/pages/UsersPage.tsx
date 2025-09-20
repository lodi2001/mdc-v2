import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import UserStatisticsCards from '../components/users/UserStatisticsCards';
import UserFilters from '../components/users/UserFilters';
import UsersList from '../components/users/UsersList';
import AddEditUserModal from '../components/users/AddEditUserModal';
import PendingRegistrationsModal from '../components/users/PendingRegistrationsModal';
import UserActivityLogModal from '../components/users/UserActivityLogModal';
import userService from '../services/api/userService';
import { User, UserListResponse, UserStatistics, UserFilter } from '../types/user';

const UsersPage: React.FC = () => {
  const isRTL = localStorage.getItem('language') === 'ar';
  
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [filters, setFilters] = useState<UserFilter>({
    search: '',
    role: '',
    status: '',
    department: '',
    page: 1,
    page_size: 10
  });
  const [pagination, setPagination] = useState({
    total: 0,
    currentPage: 1,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false
  });
  
  // Modal states
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showActivityLogModal, setShowActivityLogModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUserForLog, setSelectedUserForLog] = useState<User | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  
  // Notification state
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // Fetch data on component mount and filter changes
  useEffect(() => {
    fetchUsers();
    fetchStatistics();
  }, [filters.page]);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response: UserListResponse = await userService.getUsers(filters);
      setUsers(response?.results || []);
      setPagination({
        total: response?.count || 0,
        currentPage: filters.page || 1,
        totalPages: Math.ceil((response?.count || 0) / (filters.page_size || 10)),
        hasNext: !!response?.next,
        hasPrevious: !!response?.previous
      });
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    setLoadingStats(true);
    try {
      const stats = await userService.getUserStatistics();
      setStatistics(stats);
      setPendingCount(stats.pending_registrations || 0);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: UserFilter) => {
    setFilters({ ...newFilters, page: 1 });
  };

  const handleApplyFilters = () => {
    fetchUsers();
  };

  // Handle user selection
  const handleSelectUser = (userId: number) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected && users) {
      setSelectedUsers(users.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  // Handle user actions
  const handleAddUser = () => {
    setEditingUser(null);
    setShowAddEditModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowAddEditModal(true);
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(isRTL ? 
      `هل أنت متأكد من حذف المستخدم ${user.first_name} ${user.last_name}؟` : 
      `Are you sure you want to delete ${user.first_name} ${user.last_name}?`
    )) {
      return;
    }

    try {
      await userService.deleteUser(user.id);
      fetchUsers();
      fetchStatistics();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleResetPassword = async (user: User) => {
    if (!window.confirm(isRTL ? 
      `هل أنت متأكد من إعادة تعيين كلمة المرور للمستخدم ${user.first_name} ${user.last_name}؟` : 
      `Are you sure you want to reset password for ${user.first_name} ${user.last_name}?`
    )) {
      return;
    }

    try {
      await userService.resetUserPassword(user.id, true);
      alert(isRTL ? 
        'تم إرسال رابط إعادة تعيين كلمة المرور إلى المستخدم' : 
        'Password reset link has been sent to the user'
      );
    } catch (error) {
      console.error('Failed to reset password:', error);
    }
  };

  const handleViewUser = (user: User) => {
    // TODO: Implement view user details modal
    console.log('View user:', user);
  };

  const handleChangeStatus = async (user: User, status: 'active' | 'inactive' | 'suspended') => {
    try {
      await userService.changeUserStatus(user.id, status);
      
      // Show success message
      const statusText = status === 'active' ? (isRTL ? 'تفعيل' : 'activated') :
                        status === 'suspended' ? (isRTL ? 'تعليق' : 'suspended') :
                        (isRTL ? 'تعطيل' : 'deactivated');
      setSuccessMessage(isRTL ? 
        `تم ${statusText} حساب المستخدم بنجاح` : 
        `User account ${statusText} successfully`
      );
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 5000);
      
      fetchUsers();
      fetchStatistics();
    } catch (error) {
      console.error('Failed to change user status:', error);
      setSuccessMessage(isRTL ? 
        'فشل تغيير حالة المستخدم' : 
        'Failed to change user status'
      );
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 5000);
    }
  };

  const handleSaveUser = () => {
    setShowAddEditModal(false);
    
    // Show success message
    if (editingUser) {
      setSuccessMessage(isRTL ? 'تم تحديث المستخدم بنجاح' : 'User updated successfully');
    } else {
      setSuccessMessage(isRTL ? 'تم إضافة المستخدم بنجاح' : 'User added successfully');
    }
    setShowSuccessAlert(true);
    
    // Hide alert after 5 seconds
    setTimeout(() => {
      setShowSuccessAlert(false);
    }, 5000);
    
    setEditingUser(null);
    fetchUsers();
    fetchStatistics();
  };

  const handlePendingUpdate = () => {
    fetchStatistics();
  };

  const handleManagePermissions = (user: User) => {
    // TODO: Implement permissions modal
    console.log('Manage permissions for:', user);
    setSuccessMessage(isRTL ? 'قريباً: إدارة الصلاحيات' : 'Coming soon: Permissions management');
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 3000);
  };

  const handleViewActivityLog = (user: User) => {
    setSelectedUserForLog(user);
    setShowActivityLogModal(true);
  };

  const handleSendMessage = async (user: User) => {
    // TODO: Implement send message modal
    console.log('Send message to:', user);
    setSuccessMessage(isRTL ? 'قريباً: إرسال رسالة' : 'Coming soon: Send message');
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 3000);
  };

  const handleExportData = async (user: User) => {
    try {
      const blob = await userService.exportUserData(user.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user_${user.id}_data.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setSuccessMessage(isRTL ? 'تم تصدير البيانات بنجاح' : 'Data exported successfully');
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
    } catch (error) {
      console.error('Failed to export user data:', error);
      setSuccessMessage(isRTL ? 'فشل تصدير البيانات' : 'Failed to export data');
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
    }
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  return (
    <Layout>
      <div className="container-fluid p-4">
        {/* Success Alert */}
        {showSuccessAlert && (
          <div className="alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3" 
               style={{ zIndex: 1050, minWidth: '300px' }}
               role="alert">
            <i className="bi bi-check-circle-fill me-2"></i>
            {successMessage}
            <button type="button" 
                    className="btn-close" 
                    onClick={() => setShowSuccessAlert(false)}
                    aria-label="Close"></button>
          </div>
        )}
        
        {/* Page Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>{isRTL ? 'إدارة المستخدمين' : 'User Management'}</h2>
            <p className="text-muted">
              {isRTL ? 'إدارة مستخدمي النظام والأدوار والصلاحيات' : 'Manage system users, roles, and permissions'}
            </p>
          </div>
          <div>
            <button className="btn btn-primary" onClick={handleAddUser}>
              <i className="bi bi-plus-circle me-2"></i>
              <span>{isRTL ? 'إضافة مستخدم جديد' : 'Add New User'}</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <UserStatisticsCards statistics={statistics} loading={loadingStats} />

        {/* Pending Registrations Alert */}
        {pendingCount > 0 && (
          <div className="alert alert-warning d-flex align-items-center mb-4" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            <div className="flex-grow-1">
              <strong>{isRTL ? 'التسجيلات المعلقة' : 'Pending Registrations'}</strong>
              <span className="ms-2">
                {isRTL ? 
                  `لديك ${pendingCount} تسجيل مستخدم بانتظار الموافقة.` : 
                  `You have ${pendingCount} user registration${pendingCount > 1 ? 's' : ''} awaiting approval.`
                }
              </span>
            </div>
            <button 
              className="btn btn-warning btn-sm" 
              onClick={() => setShowPendingModal(true)}
            >
              <i className="bi bi-eye me-1"></i>
              <span>{isRTL ? 'مراجعة' : 'Review'}</span>
            </button>
          </div>
        )}

        {/* Filters */}
        <UserFilters 
          filters={filters}
          onFilterChange={handleFilterChange}
          onApplyFilters={handleApplyFilters}
        />

        {/* Users List */}
        <UsersList
          users={users}
          loading={loading}
          selectedUsers={selectedUsers}
          onSelectUser={handleSelectUser}
          onSelectAll={handleSelectAll}
          onEditUser={handleEditUser}
          onDeleteUser={handleDeleteUser}
          onResetPassword={handleResetPassword}
          onViewUser={handleViewUser}
          onChangeStatus={handleChangeStatus}
          onManagePermissions={handleManagePermissions}
          onViewActivityLog={handleViewActivityLog}
          onSendMessage={handleSendMessage}
          onExportData={handleExportData}
        />

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-4">
            <div className="text-muted">
              {isRTL ? 
                `عرض ${((pagination.currentPage - 1) * (filters.page_size || 10)) + 1}-${Math.min(pagination.currentPage * (filters.page_size || 10), pagination.total)} من ${pagination.total} مستخدم` :
                `Showing ${((pagination.currentPage - 1) * (filters.page_size || 10)) + 1}-${Math.min(pagination.currentPage * (filters.page_size || 10), pagination.total)} of ${pagination.total} users`
              }
            </div>
            <nav>
              <ul className="pagination mb-0">
                <li className={`page-item ${!pagination.hasPrevious ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevious}
                  >
                    {isRTL ? 'السابق' : 'Previous'}
                  </button>
                </li>
                {[...Array(pagination.totalPages)].map((_, index) => {
                  const page = index + 1;
                  if (
                    page === 1 ||
                    page === pagination.totalPages ||
                    (page >= pagination.currentPage - 2 && page <= pagination.currentPage + 2)
                  ) {
                    return (
                      <li 
                        key={page} 
                        className={`page-item ${page === pagination.currentPage ? 'active' : ''}`}
                      >
                        <button 
                          className="page-link" 
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </button>
                      </li>
                    );
                  } else if (
                    page === pagination.currentPage - 3 ||
                    page === pagination.currentPage + 3
                  ) {
                    return <li key={page} className="page-item disabled"><span className="page-link">...</span></li>;
                  }
                  return null;
                })}
                <li className={`page-item ${!pagination.hasNext ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                  >
                    {isRTL ? 'التالي' : 'Next'}
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}

        {/* Modals */}
        <AddEditUserModal
          show={showAddEditModal}
          user={editingUser}
          onClose={() => {
            setShowAddEditModal(false);
            setEditingUser(null);
          }}
          onSave={handleSaveUser}
        />

        <PendingRegistrationsModal
          show={showPendingModal}
          onClose={() => setShowPendingModal(false)}
          onUpdate={handlePendingUpdate}
        />

        <UserActivityLogModal
          show={showActivityLogModal}
          user={selectedUserForLog}
          onClose={() => {
            setShowActivityLogModal(false);
            setSelectedUserForLog(null);
          }}
        />
      </div>
    </Layout>
  );
};

export default UsersPage;
