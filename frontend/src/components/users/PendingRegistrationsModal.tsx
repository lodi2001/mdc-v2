import React, { useState, useEffect } from 'react';
import { PendingRegistration } from '../../types/user';
import userService from '../../services/api/userService';

interface PendingRegistrationsModalProps {
  show: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const PendingRegistrationsModal: React.FC<PendingRegistrationsModalProps> = ({
  show,
  onClose,
  onUpdate
}) => {
  const isRTL = localStorage.getItem('language') === 'ar';
  const [pendingUsers, setPendingUsers] = useState<PendingRegistration[]>([]);
  const [selectedUser, setSelectedUser] = useState<PendingRegistration | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingIds, setProcessingIds] = useState<number[]>([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [userToReject, setUserToReject] = useState<PendingRegistration | null>(null);

  useEffect(() => {
    if (show) {
      fetchPendingRegistrations();
    }
  }, [show]);

  const fetchPendingRegistrations = async () => {
    setLoading(true);
    try {
      const data = await userService.getPendingRegistrations();
      setPendingUsers(data);
    } catch (error) {
      console.error('Failed to fetch pending registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: number) => {
    setProcessingIds([...processingIds, userId]);
    try {
      await userService.approveUser(userId, true);
      setPendingUsers(pendingUsers.filter(u => u.id !== userId));
      onUpdate();
    } catch (error) {
      console.error('Failed to approve user:', error);
    } finally {
      setProcessingIds(processingIds.filter(id => id !== userId));
    }
  };

  const handleReject = async () => {
    if (!userToReject) return;
    
    setProcessingIds([...processingIds, userToReject.id]);
    try {
      await userService.rejectUser(userToReject.id, rejectReason, true);
      setPendingUsers(pendingUsers.filter(u => u.id !== userToReject.id));
      onUpdate();
      setShowRejectModal(false);
      setRejectReason('');
      setUserToReject(null);
    } catch (error) {
      console.error('Failed to reject user:', error);
    } finally {
      setProcessingIds(processingIds.filter(id => id !== userToReject?.id));
    }
  };

  const handleBulkApprove = async () => {
    if (!window.confirm(isRTL ? 
      'هل أنت متأكد من الموافقة على جميع المستخدمين المعلقين؟' : 
      'Are you sure you want to approve all pending users?'
    )) {
      return;
    }

    setLoading(true);
    try {
      const userIds = pendingUsers.map(u => u.id);
      await userService.bulkApproveUsers(userIds, true);
      setPendingUsers([]);
      onUpdate();
    } catch (error) {
      console.error('Failed to bulk approve users:', error);
    } finally {
      setLoading(false);
    }
  };

  const showUserDetails = (user: PendingRegistration) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const initiateReject = (user: PendingRegistration) => {
    setUserToReject(user);
    setShowRejectModal(true);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!show) return null;

  return (
    <>
      {/* Main Modal */}
      <div className="modal fade show d-block" tabIndex={-1} role="dialog">
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {isRTL ? 'التسجيلات المعلقة' : 'Pending Registrations'}
                {pendingUsers.length > 0 && (
                  <span className="badge bg-warning ms-2">{pendingUsers.length}</span>
                )}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
            </div>
            <div className="modal-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : pendingUsers.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-check-circle fs-1 text-success"></i>
                  <p className="mt-3">
                    {isRTL ? 'لا توجد تسجيلات معلقة' : 'No pending registrations'}
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>{isRTL ? 'تاريخ التسجيل' : 'Registration Date'}</th>
                        <th>{isRTL ? 'الاسم الكامل' : 'Full Name'}</th>
                        <th>{isRTL ? 'البريد الإلكتروني' : 'Email'}</th>
                        <th>{isRTL ? 'الشركة' : 'Company'}</th>
                        <th>{isRTL ? 'الهاتف' : 'Phone'}</th>
                        <th>{isRTL ? 'الرقم الوطني' : 'National ID'}</th>
                        <th>{isRTL ? 'الإجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingUsers.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <small>{formatDate(user.registration_date)}</small>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="avatar-sm bg-info text-white rounded-circle d-flex align-items-center justify-content-center me-2">
                                {(user.first_name?.[0] || '').toUpperCase()}{(user.last_name?.[0] || '').toUpperCase()}
                              </div>
                              <div>
                                {user.first_name || ''} {user.last_name || ''}
                              </div>
                            </div>
                          </td>
                          <td>
                            {user.email}
                            {user.is_verified && (
                              <i className="bi bi-patch-check-fill text-primary ms-1" 
                                 title={isRTL ? 'تم التحقق' : 'Verified'}></i>
                            )}
                          </td>
                          <td>{user.company_name}</td>
                          <td>{user.phone}</td>
                          <td>{user.national_id}</td>
                          <td>
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleApprove(user.id)}
                                disabled={processingIds.includes(user.id)}
                                title={isRTL ? 'موافقة' : 'Approve'}
                              >
                                {processingIds.includes(user.id) ? (
                                  <span className="spinner-border spinner-border-sm"></span>
                                ) : (
                                  <i className="bi bi-check-lg"></i>
                                )}
                              </button>
                              <button
                                className="btn btn-sm btn-info"
                                onClick={() => showUserDetails(user)}
                                title={isRTL ? 'عرض التفاصيل' : 'View Details'}
                              >
                                <i className="bi bi-eye"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => initiateReject(user)}
                                disabled={processingIds.includes(user.id)}
                                title={isRTL ? 'رفض' : 'Reject'}
                              >
                                <i className="bi bi-x-lg"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {pendingUsers.length > 0 && (
                <button 
                  className="btn btn-success me-auto" 
                  onClick={handleBulkApprove}
                  disabled={loading}
                >
                  <i className="bi bi-check-all me-2"></i>
                  {isRTL ? 'الموافقة على الكل' : 'Approve All'}
                </button>
              )}
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                {isRTL ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ zIndex: 1051 }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {isRTL ? 'تفاصيل المستخدم' : 'User Details'}
                </h5>
                <button type="button" className="btn-close" 
                        onClick={() => setShowDetailsModal(false)} 
                        aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small">{isRTL ? 'الاسم الكامل' : 'Full Name'}</label>
                    <p className="fw-semibold">{selectedUser.first_name} {selectedUser.last_name}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small">{isRTL ? 'البريد الإلكتروني' : 'Email'}</label>
                    <p className="fw-semibold">
                      {selectedUser.email}
                      {selectedUser.is_verified && (
                        <span className="badge bg-success ms-2">{isRTL ? 'تم التحقق' : 'Verified'}</span>
                      )}
                    </p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small">{isRTL ? 'رقم الهاتف' : 'Phone'}</label>
                    <p className="fw-semibold">{selectedUser.phone}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small">{isRTL ? 'اسم الشركة' : 'Company Name'}</label>
                    <p className="fw-semibold">{selectedUser.company_name}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small">{isRTL ? 'الرقم الوطني/التجاري' : 'National/Commercial ID'}</label>
                    <p className="fw-semibold">{selectedUser.national_id}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small">{isRTL ? 'تاريخ التسجيل' : 'Registration Date'}</label>
                    <p className="fw-semibold">{formatDate(selectedUser.registration_date)}</p>
                  </div>
                  {selectedUser.ip_address && (
                    <div className="col-md-6 mb-3">
                      <label className="text-muted small">{isRTL ? 'عنوان IP' : 'IP Address'}</label>
                      <p className="fw-semibold">{selectedUser.ip_address}</p>
                    </div>
                  )}
                  {selectedUser.user_agent && (
                    <div className="col-12 mb-3">
                      <label className="text-muted small">{isRTL ? 'معلومات المتصفح' : 'User Agent'}</label>
                      <p className="fw-semibold small">{selectedUser.user_agent}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" 
                        onClick={() => setShowDetailsModal(false)}>
                  {isRTL ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && userToReject && (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ zIndex: 1052 }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {isRTL ? 'رفض التسجيل' : 'Reject Registration'}
                </h5>
                <button type="button" className="btn-close" 
                        onClick={() => {
                          setShowRejectModal(false);
                          setRejectReason('');
                          setUserToReject(null);
                        }} 
                        aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <p>
                  {isRTL ? 
                    `هل أنت متأكد من رفض تسجيل ${userToReject.first_name} ${userToReject.last_name}؟` : 
                    `Are you sure you want to reject ${userToReject.first_name} ${userToReject.last_name}'s registration?`
                  }
                </p>
                <div className="mb-3">
                  <label className="form-label">
                    {isRTL ? 'سبب الرفض (اختياري)' : 'Rejection Reason (Optional)'}
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder={isRTL ? 'أدخل سبب الرفض...' : 'Enter rejection reason...'}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" 
                        onClick={() => {
                          setShowRejectModal(false);
                          setRejectReason('');
                          setUserToReject(null);
                        }}>
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="button" className="btn btn-danger" 
                        onClick={handleReject}
                        disabled={processingIds.includes(userToReject.id)}>
                  {processingIds.includes(userToReject.id) && (
                    <span className="spinner-border spinner-border-sm me-2"></span>
                  )}
                  {isRTL ? 'رفض' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="modal-backdrop fade show" style={{ zIndex: showDetailsModal || showRejectModal ? 1050 : 1040 }}></div>
    </>
  );
};

export default PendingRegistrationsModal;