import React, { useState, useEffect } from 'react';
import type { EmailTemplate } from '../../types/emailTemplate';
import emailTemplateService from '../../services/api/emailTemplateService';

interface TemplatePreviewProps {
  template: EmailTemplate | null;
  isRTL: boolean;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ template, isRTL }) => {
  const [previewData, setPreviewData] = useState({
    subject: '',
    html_body: '',
    text_body: ''
  });
  const [previewMode, setPreviewMode] = useState<'html' | 'text'>('html');
  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Get sample data for preview
  const sampleData = emailTemplateService.getSampleData();

  // Update preview when template changes
  useEffect(() => {
    if (template) {
      // Replace variables with sample data
      let subject = template.subject;
      let htmlBody = template.body_html;
      let textBody = template.body_text;

      Object.entries(sampleData).forEach(([key, value]) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        subject = subject.replace(regex, String(value));
        htmlBody = htmlBody.replace(regex, String(value));
        textBody = textBody.replace(regex, String(value));
      });

      setPreviewData({
        subject,
        html_body: htmlBody,
        text_body: textBody
      });
    }
  }, [template]);

  const handleSendTest = async () => {
    if (!template || !testEmail) {
      alert(isRTL ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter an email address');
      return;
    }

    setIsSending(true);
    try {
      await emailTemplateService.testTemplate(template.id, {
        recipient_email: testEmail,
        test_variables: sampleData
      });
      alert(isRTL ? 'تم إرسال البريد التجريبي بنجاح' : 'Test email sent successfully');
      setTestEmail('');
    } catch (error) {
      console.error('Error sending test email:', error);
      alert(isRTL ? 'فشل إرسال البريد التجريبي' : 'Failed to send test email');
    } finally {
      setIsSending(false);
    }
  };

  if (!template) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="text-center py-5 text-muted">
            <i className="bi bi-eye fs-1"></i>
            <p className="mt-3">
              {isRTL ? 'اختر قالبًا للمعاينة' : 'Select a template to preview'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            {isRTL ? 'معاينة' : 'Preview'}
          </h5>
          <div className="btn-group btn-group-sm">
            <button
              className={`btn ${previewMode === 'html' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setPreviewMode('html')}
            >
              HTML
            </button>
            <button
              className={`btn ${previewMode === 'text' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setPreviewMode('text')}
            >
              {isRTL ? 'نص' : 'Text'}
            </button>
          </div>
        </div>
      </div>

      <div className="card-body">
        {/* Test Email Section */}
        <div className="mb-3">
          <label className="form-label">
            {isRTL ? 'إرسال بريد تجريبي' : 'Send Test Email'}
          </label>
          <div className="input-group">
            <input
              type="email"
              className="form-control"
              placeholder={isRTL ? 'البريد الإلكتروني للاختبار' : 'Test email address'}
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
            <button
              className="btn btn-outline-primary"
              onClick={handleSendTest}
              disabled={isSending || !testEmail}
            >
              {isSending ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1"></span>
                  {isRTL ? 'إرسال...' : 'Sending...'}
                </>
              ) : (
                <>
                  <i className="bi bi-send me-1"></i>
                  {isRTL ? 'إرسال' : 'Send'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Email Preview */}
        <div
          className="border rounded p-3"
          style={{ backgroundColor: '#f8f9fa' }}
        >
          <div className="mb-3">
            <strong>{isRTL ? 'من:' : 'From:'}</strong> noreply@mdc-tts.com<br />
            <strong>{isRTL ? 'إلى:' : 'To:'}</strong> {testEmail || 'user@example.com'}<br />
            <strong>{isRTL ? 'الموضوع:' : 'Subject:'}</strong> {previewData.subject}
          </div>
          <hr />

          {previewMode === 'html' ? (
            <div
              className="email-content"
              dangerouslySetInnerHTML={{ __html: previewData.html_body }}
              style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '4px',
                minHeight: '300px'
              }}
            />
          ) : (
            <pre
              className="email-content"
              style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '4px',
                minHeight: '300px',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                fontFamily: 'inherit'
              }}
            >
              {previewData.text_body}
            </pre>
          )}
        </div>

        {/* Sample Data Info */}
        <div className="mt-3">
          <div className="alert alert-info">
            <i className="bi bi-info-circle me-2"></i>
            {isRTL
              ? 'تستخدم المعاينة بيانات عينة لإظهار كيف سيبدو القالب مع البيانات الفعلية.'
              : 'Preview uses sample data to show how the template will look with actual data.'}
          </div>
        </div>

        {/* Sample Variables Display */}
        <details className="mt-3">
          <summary className="text-muted" style={{ cursor: 'pointer' }}>
            {isRTL ? 'عرض البيانات المستخدمة' : 'Show sample data used'}
          </summary>
          <div className="mt-2">
            <table className="table table-sm table-bordered">
              <thead>
                <tr>
                  <th>{isRTL ? 'المتغير' : 'Variable'}</th>
                  <th>{isRTL ? 'القيمة' : 'Value'}</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(sampleData).map(([key, value]) => (
                  <tr key={key}>
                    <td><code>{`{{${key}}}`}</code></td>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </div>
  );
};

export default TemplatePreview;