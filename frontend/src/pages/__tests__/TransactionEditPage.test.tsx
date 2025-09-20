/**
 * Comprehensive tests for TransactionEditPage component
 * Tests focus on:
 * - Form submission with all fields including internal_notes
 * - Error handling for validation failures
 * - Status transition dropdown behavior
 * - Due date validation (no past dates)
 * - Navigation after successful save
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter as Router } from 'react-router-dom';
import TransactionEditPage from '../TransactionEditPage';
import apiClient from '../../services/api/client';
import '@testing-library/jest-dom';

// Mock API client
jest.mock('../../services/api/client');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
const mockUseParams = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
}));

// Mock Layout component
jest.mock('../../components/layout/Layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="layout">{children}</div>;
  };
});

describe('TransactionEditPage', () => {
  const mockTransaction = {
    id: 1,
    transaction_id: 'TRX-2025-00021',
    title: 'Test Transaction',
    reference_number: 'REF-001',
    client_name: 'Test Client',
    transaction_type: 'import-license',
    description: 'Test description',
    status: 'draft',
    priority: 'normal',
    due_date: '2025-12-31',
    department: 'Import Department',
    project_id: 'PROJ-001',
    tags: 'test, sample',
    internal_notes: 'Internal notes for testing'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ id: '1' });
    mockApiClient.get.mockResolvedValue({ data: mockTransaction });

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'en'), // Default to English
      },
      writable: true,
    });
  });

  const renderComponent = () => {
    return render(
      <Router>
        <TransactionEditPage />
      </Router>
    );
  };

  describe('Component Loading and Data Fetching', () => {
    it('should load transaction data and populate form fields', async () => {
      renderComponent();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Verify API call
      expect(mockApiClient.get).toHaveBeenCalledWith('/transactions/1/');

      // Check that form fields are populated
      expect(screen.getByDisplayValue('Test Transaction')).toBeInTheDocument();
      expect(screen.getByDisplayValue('REF-001')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Client')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Internal notes for testing')).toBeInTheDocument();
    });

    it('should show loading spinner while fetching data', () => {
      renderComponent();

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should handle API fetch errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Failed to fetch'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Failed to load transaction details')).toBeInTheDocument();
      });
    });

    it('should show error if transaction not found', async () => {
      mockApiClient.get.mockRejectedValue({
        response: { status: 404 }
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Failed to load transaction details')).toBeInTheDocument();
      });
    });
  });

  describe('Form Field Updates', () => {
    beforeEach(async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });

    it('should update title field', async () => {
      const user = userEvent.setup();
      const titleInput = screen.getByDisplayValue('Test Transaction');

      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Transaction Title');

      expect(titleInput).toHaveValue('Updated Transaction Title');
    });

    it('should update internal_notes field', async () => {
      const user = userEvent.setup();
      const notesTextarea = screen.getByDisplayValue('Internal notes for testing');

      await user.clear(notesTextarea);
      await user.type(notesTextarea, 'Updated internal notes with more details');

      expect(notesTextarea).toHaveValue('Updated internal notes with more details');
    });

    it('should update description field', async () => {
      const user = userEvent.setup();
      const descriptionTextarea = screen.getByDisplayValue('Test description');

      await user.clear(descriptionTextarea);
      await user.type(descriptionTextarea, 'Updated description with more details');

      expect(descriptionTextarea).toHaveValue('Updated description with more details');
    });

    it('should update priority dropdown', async () => {
      const user = userEvent.setup();
      const prioritySelect = screen.getByDisplayValue('normal');

      await user.selectOptions(prioritySelect, 'high');

      expect(prioritySelect).toHaveValue('high');
    });

    it('should update due date field', async () => {
      const user = userEvent.setup();
      const dueDateInput = screen.getByDisplayValue('2025-12-31');

      await user.clear(dueDateInput);
      await user.type(dueDateInput, '2026-01-15');

      expect(dueDateInput).toHaveValue('2026-01-15');
    });

    it('should update tags field', async () => {
      const user = userEvent.setup();
      const tagsInput = screen.getByDisplayValue('test, sample');

      await user.clear(tagsInput);
      await user.type(tagsInput, 'updated, tags, comprehensive');

      expect(tagsInput).toHaveValue('updated, tags, comprehensive');
    });
  });

  describe('Form Submission', () => {
    beforeEach(async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });

    it('should submit form with all fields including internal_notes', async () => {
      const user = userEvent.setup();
      mockApiClient.patch.mockResolvedValue({ data: { success: true } });

      // Update multiple fields
      const titleInput = screen.getByDisplayValue('Test Transaction');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Transaction');

      const notesTextarea = screen.getByDisplayValue('Internal notes for testing');
      await user.clear(notesTextarea);
      await user.type(notesTextarea, 'Updated internal notes');

      const prioritySelect = screen.getByDisplayValue('normal');
      await user.selectOptions(prioritySelect, 'high');

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockApiClient.patch).toHaveBeenCalledWith('/transactions/1/', {
          title: 'Updated Transaction',
          reference_number: 'REF-001',
          client_name: 'Test Client',
          transaction_type: 'import-license',
          description: 'Test description',
          status: 'draft',
          priority: 'high',
          department: 'Import Department',
          project_id: 'PROJ-001',
          tags: 'test, sample',
          internal_notes: 'Updated internal notes',
          due_date: '2025-12-31'
        });
      });

      // Should navigate after successful save
      expect(mockNavigate).toHaveBeenCalledWith('/transactions/1');
    });

    it('should handle required field validation', async () => {
      const user = userEvent.setup();

      // Clear required fields
      const titleInput = screen.getByDisplayValue('Test Transaction');
      await user.clear(titleInput);

      const clientNameInput = screen.getByDisplayValue('Test Client');
      await user.clear(clientNameInput);

      // Try to submit
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      // Should not make API call
      expect(mockApiClient.patch).not.toHaveBeenCalled();
    });

    it('should show saving state during submission', async () => {
      const user = userEvent.setup();
      mockApiClient.patch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(saveButton).toBeDisabled();
    });

    it('should handle backend validation errors', async () => {
      const user = userEvent.setup();
      mockApiClient.patch.mockRejectedValue({
        response: {
          data: {
            due_date: ['Due date cannot be in the past'],
            priority: ['Invalid priority level']
          }
        }
      });

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/due_date: Due date cannot be in the past; priority: Invalid priority level/)).toBeInTheDocument();
      });
    });

    it('should handle generic API errors', async () => {
      const user = userEvent.setup();
      mockApiClient.patch.mockRejectedValue({
        response: {
          data: {
            message: 'Permission denied'
          }
        }
      });

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Permission denied')).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      const user = userEvent.setup();
      mockApiClient.patch.mockRejectedValue(new Error('Network error'));

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to update transaction')).toBeInTheDocument();
      });
    });
  });

  describe('Status Transition Validation', () => {
    beforeEach(async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });

    it('should allow valid status transitions', async () => {
      const user = userEvent.setup();
      mockApiClient.patch.mockResolvedValue({ data: { success: true } });

      const statusSelect = screen.getByDisplayValue('draft');
      await user.selectOptions(statusSelect, 'submitted');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockApiClient.patch).toHaveBeenCalledWith(
          '/transactions/1/',
          expect.objectContaining({
            status: 'submitted'
          })
        );
      });
    });

    it('should handle invalid status transitions from backend', async () => {
      const user = userEvent.setup();
      mockApiClient.patch.mockRejectedValue({
        response: {
          data: {
            status: ['Cannot change status from draft to completed']
          }
        }
      });

      const statusSelect = screen.getByDisplayValue('draft');
      await user.selectOptions(statusSelect, 'completed');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/status: Cannot change status from draft to completed/)).toBeInTheDocument();
      });
    });
  });

  describe('Due Date Validation', () => {
    beforeEach(async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });

    it('should accept valid future dates', async () => {
      const user = userEvent.setup();
      mockApiClient.patch.mockResolvedValue({ data: { success: true } });

      const dueDateInput = screen.getByDisplayValue('2025-12-31');
      await user.clear(dueDateInput);
      await user.type(dueDateInput, '2026-06-15');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockApiClient.patch).toHaveBeenCalledWith(
          '/transactions/1/',
          expect.objectContaining({
            due_date: '2026-06-15'
          })
        );
      });
    });

    it('should handle past date validation from backend', async () => {
      const user = userEvent.setup();
      mockApiClient.patch.mockRejectedValue({
        response: {
          data: {
            due_date: ['Due date cannot be in the past']
          }
        }
      });

      const dueDateInput = screen.getByDisplayValue('2025-12-31');
      await user.clear(dueDateInput);
      await user.type(dueDateInput, '2020-01-01');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/due_date: Due date cannot be in the past/)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation and UI Interactions', () => {
    beforeEach(async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });

    it('should navigate back on cancel button click', async () => {
      const user = userEvent.setup();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith('/transactions/1');
    });

    it('should disable buttons during saving', async () => {
      const user = userEvent.setup();
      mockApiClient.patch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      await user.click(saveButton);

      expect(saveButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    it('should dismiss error messages', async () => {
      const user = userEvent.setup();
      mockApiClient.patch.mockRejectedValue({
        response: {
          data: {
            message: 'Test error message'
          }
        }
      });

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Test error message')).toBeInTheDocument();
      });

      const dismissButton = screen.getByLabelText('Close');
      await user.click(dismissButton);

      expect(screen.queryByText('Test error message')).not.toBeInTheDocument();
    });
  });

  describe('Internationalization Support', () => {
    it('should display Arabic labels when language is set to Arabic', async () => {
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(() => 'ar'), // Set to Arabic
        },
        writable: true,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Check for Arabic labels
      expect(screen.getByText('تعديل المعاملة')).toBeInTheDocument(); // Edit Transaction
      expect(screen.getByText('المعلومات الأساسية')).toBeInTheDocument(); // Basic Information
      expect(screen.getByText('ملاحظات داخلية')).toBeInTheDocument(); // Internal Notes
    });
  });

  describe('Form Data Transformation', () => {
    beforeEach(async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });

    it('should transform transaction_type from underscores to hyphens on submit', async () => {
      const user = userEvent.setup();
      mockApiClient.patch.mockResolvedValue({ data: { success: true } });

      // The form should convert import_license to import-license
      const typeSelect = screen.getByDisplayValue('import_license');
      await user.selectOptions(typeSelect, 'export_permit');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockApiClient.patch).toHaveBeenCalledWith(
          '/transactions/1/',
          expect.objectContaining({
            transaction_type: 'export-permit' // Should be hyphenated
          })
        );
      });
    });

    it('should transform status from underscores to hyphens on submit', async () => {
      const user = userEvent.setup();
      mockApiClient.patch.mockResolvedValue({ data: { success: true } });

      const statusSelect = screen.getByDisplayValue('draft');
      await user.selectOptions(statusSelect, 'under_review');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockApiClient.patch).toHaveBeenCalledWith(
          '/transactions/1/',
          expect.objectContaining({
            status: 'under-review' // Should be hyphenated
          })
        );
      });
    });

    it('should handle empty optional fields correctly', async () => {
      const user = userEvent.setup();
      mockApiClient.patch.mockResolvedValue({ data: { success: true } });

      // Clear optional fields
      const referenceInput = screen.getByDisplayValue('REF-001');
      await user.clear(referenceInput);

      const departmentInput = screen.getByDisplayValue('Import Department');
      await user.clear(departmentInput);

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockApiClient.patch).toHaveBeenCalledWith(
          '/transactions/1/',
          expect.objectContaining({
            reference_number: '',
            department: ''
          })
        );
      });
    });
  });

  describe('Component Accessibility', () => {
    beforeEach(async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });

    it('should have proper form labels', () => {
      expect(screen.getByLabelText(/transaction title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/client name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/internal notes/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
    });

    it('should have proper button roles and labels', () => {
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should use proper form structure', () => {
      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getAllByRole('textbox')).toHaveLength(7); // Title, reference, client, description, department, project_id, tags
      expect(screen.getAllByRole('combobox')).toHaveLength(3); // Type, status, priority
    });
  });
});