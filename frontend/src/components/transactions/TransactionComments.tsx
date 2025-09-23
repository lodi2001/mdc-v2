import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../../services/api/client';
import { Comment, CommentInput } from '../../types/comment';

interface TransactionCommentsProps {
  transactionId: string;
  isRTL: boolean;
}

const TransactionComments: React.FC<TransactionCommentsProps> = ({ transactionId, isRTL }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const commentThreadRef = useRef<HTMLDivElement>(null);

  // Get user info from localStorage
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userRole = user?.role || 'client';
  const canComment = user?.can_comment || false;
  const isEditorOrAdmin = userRole === 'editor' || userRole === 'admin';

  useEffect(() => {
    fetchComments();
  }, [transactionId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/transactions/${transactionId}/comments/`);
      setComments(response.data.data || []);
    } catch (err: any) {
      console.error('Error fetching comments:', err);
      setError(isRTL ? 'فشل تحميل التعليقات' : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    const commentData: CommentInput = {
      content: newComment.trim(),
      is_internal: isInternal
    };

    try {
      setSubmitting(true);
      const response = await apiClient.post(`/transactions/${transactionId}/comments/`, commentData);

      if (response.data.success) {
        // Add new comment to the list
        setComments([response.data.data, ...comments]);
        setNewComment('');
        setIsInternal(false);

        // Scroll to top to show new comment
        if (commentThreadRef.current) {
          commentThreadRef.current.scrollTop = 0;
        }
      }
    } catch (err: any) {
      console.error('Error posting comment:', err);
      alert(isRTL ? 'فشل إرسال التعليق' : 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return isRTL ? `منذ ${diffMins} دقيقة` : `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return isRTL ? `منذ ${diffHours} ساعة` : `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return isRTL ? `منذ ${diffDays} يوم` : `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">{isRTL ? 'جاري التحميل...' : 'Loading...'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert alert-danger">{error}</div>
        </div>
      </div>
    );
  }

  // Check if user can add comments
  const canAddComment = isEditorOrAdmin || (userRole === 'client' && canComment);

  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title mb-4">
          {isRTL ? 'التعليقات' : 'Comments'}
          {comments.length > 0 && (
            <span className="badge bg-secondary ms-2">{comments.length}</span>
          )}
        </h5>

        {/* Comments Thread */}
        <div
          ref={commentThreadRef}
          className="comment-thread mb-4"
          style={{ maxHeight: '400px', overflowY: 'auto' }}
        >
          {comments.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="bi bi-chat-dots fs-1"></i>
              <p>{isRTL ? 'لا توجد تعليقات بعد' : 'No comments yet'}</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={`comment-item mb-3 pb-3 ${isRTL ? 'border-end' : 'border-start'} border-3`}
                style={{
                  paddingLeft: isRTL ? '0' : '15px',
                  paddingRight: isRTL ? '15px' : '0',
                  borderColor: comment.is_internal ? '#ffc107' : '#e9ecef'
                }}
              >
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="d-flex align-items-center">
                    <div className="avatar-circle me-2" style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#007bff',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}>
                      {comment.user_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <strong>{comment.user_name}</strong>
                      {comment.is_internal && (
                        <span className="badge bg-warning text-dark ms-2">
                          {isRTL ? 'داخلي' : 'Internal'}
                        </span>
                      )}
                    </div>
                  </div>
                  <small className="text-muted">
                    {formatDate(comment.created_at)}
                  </small>
                </div>
                <p className="mb-0 ps-5" style={{ whiteSpace: 'pre-wrap' }}>
                  {comment.content}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Section */}
        {canAddComment ? (
          <div className="border-top pt-3">
            <div className="mb-3">
              <textarea
                className="form-control"
                rows={3}
                placeholder={isRTL ? 'اكتب تعليقاً...' : 'Write a comment...'}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={submitting}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>

            {isEditorOrAdmin && (
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="internalComment"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  disabled={submitting}
                />
                <label className="form-check-label" htmlFor="internalComment">
                  {isRTL ? 'تعليق داخلي (لن يراه العميل)' : 'Internal comment (client will not see this)'}
                </label>
              </div>
            )}

            <button
              className="btn btn-primary"
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  {isRTL ? 'جاري الإرسال...' : 'Sending...'}
                </>
              ) : (
                <>
                  <i className="bi bi-send me-2"></i>
                  {isRTL ? 'إرسال' : 'Send'}
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="border-top pt-3">
            <div className="alert alert-info mb-0">
              <i className="bi bi-info-circle me-2"></i>
              {userRole === 'client'
                ? (isRTL ? 'ليس لديك صلاحية إضافة تعليقات' : 'You do not have permission to add comments')
                : (isRTL ? 'يمكنك عرض التعليقات فقط' : 'You can only view comments')
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionComments;