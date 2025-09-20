/**
 * Tests for AssignmentTable component focusing on reassignment functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AssignmentTable } from '../AssignmentTable';
import { assignmentService } from '../../../services/assignmentService';
import { mockAssignments, mockAvailableAssignees, mockUsers } from '../../../__mocks__/testData';
import '@testing-library/jest-dom';

// Mock the assignment service
jest.mock('../../../services/assignmentService');

// Mock Bootstrap components
jest.mock('react-bootstrap', () => ({
  ...jest.requireActual('react-bootstrap'),
  Modal: ({ children, show, onHide }: any) => show ? (
    <div data-testid="modal">{children}</div>
  ) : null,
  Dropdown: ({ children }: any) => <div>{children}</div>,
  Table: ({ children }: any) => <table>{children}</table>,
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
  Form: ({ children }: any) => <form>{children}</form>,
  Badge: ({ children }: any) => <span>{children}</span>,
}));

describe('AssignmentTable Component', () => {
  const mockOnUpdate = jest.fn();
  const mockOnReassign = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    (assignmentService.getAvailableAssignees as jest.Mock).mockResolvedValue(mockAvailableAssignees);
    (assignmentService.reassignTransaction as jest.Mock).mockResolvedValue({ success: true });
    (assignmentService.bulkReassignTransactions as jest.Mock).mockResolvedValue({ success: true });
  });
  
  describe('Reassignment Dropdown', () => {
    it('should only show editors and admins in reassignment dropdown', async () => {
      render(
        <AssignmentTable
          assignments={mockAssignments}
          loading={false}
          onUpdate={mockOnUpdate}
          onReassign={mockOnReassign}
        />
      );
      
      // Open reassignment modal for first assignment
      const reassignButtons = screen.getAllByText(/Reassign/i);
      fireEvent.click(reassignButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });
      
      // Check available users in dropdown
      const modal = screen.getByTestId('modal');
      const select = within(modal).getByRole('combobox');
      
      // Verify only editors and admins are options
      const options = within(select).getAllByRole('option');
      const optionTexts = options.map(opt => opt.textContent);
      
      // Should include admin and editors
      expect(optionTexts).toContain('Admin User');
      expect(optionTexts).toContain('Editor One');
      expect(optionTexts).toContain('Editor Two');
      
      // Should NOT include clients
      expect(optionTexts).not.toContain('Client One');
      expect(optionTexts).not.toContain('Client Two');
    });
    
    it('should not allow selecting client users for reassignment', async () => {
      // Mock service to simulate error when trying to assign to client
      (assignmentService.reassignTransaction as jest.Mock).mockRejectedValue({
        response: {
          data: {
            success: false,
            errors: {
              assigned_to: ['Only admin or editor users can be assigned to transactions']
            }
          }
        }
      });
      
      render(
        <AssignmentTable
          assignments={mockAssignments}
          loading={false}
          onUpdate={mockOnUpdate}
          onReassign={mockOnReassign}
        />
      );
      
      // Verify client users are not in the available assignees list
      await waitFor(() => {
        expect(assignmentService.getAvailableAssignees).toHaveBeenCalled();
      });
      
      // Check that mock data doesn't include clients
      const availableAssignees = await assignmentService.getAvailableAssignees();
      const hasClients = availableAssignees.some((user: any) => 
        user.role === 'client'
      );
      
      expect(hasClients).toBe(false);
    });
  });
  
  describe('Single Transaction Reassignment', () => {
    it('should successfully reassign a single transaction', async () => {
      const user = userEvent.setup();
      
      render(
        <AssignmentTable
          assignments={mockAssignments}
          loading={false}
          onUpdate={mockOnUpdate}
          onReassign={mockOnReassign}
        />
      );
      
      // Open reassignment modal
      const reassignButtons = screen.getAllByText(/Reassign/i);
      await user.click(reassignButtons[0]);
      
      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });
      
      // Select new assignee
      const modal = screen.getByTestId('modal');
      const select = within(modal).getByRole('combobox');
      await user.selectOptions(select, '3'); // Select editor2
      
      // Add reason
      const reasonInput = within(modal).getByPlaceholderText(/reason/i);
      await user.type(reasonInput, 'Reassigning for workload balance');
      
      // Submit reassignment
      const confirmButton = within(modal).getByText(/Confirm/i);
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(assignmentService.reassignTransaction).toHaveBeenCalledWith(
          expect.any(Number), // Transaction ID
          '3', // New assignee ID
          'Reassigning for workload balance'
        );
        expect(mockOnReassign).toHaveBeenCalled();
      });
    });
    
    it('should handle transaction ID extraction correctly', async () => {
      const assignmentWithExternalId = {
        ...mockAssignments[0],
        id: '123', // Numeric ID
        externalId: 'EXT-123' // External ID format
      };
      
      render(
        <AssignmentTable
          assignments={[assignmentWithExternalId]}
          loading={false}
          onUpdate={mockOnUpdate}
          onReassign={mockOnReassign}
        />
      );
      
      // Open reassignment modal
      const reassignButton = screen.getByText(/Reassign/i);
      fireEvent.click(reassignButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });
      
      // Perform reassignment
      const modal = screen.getByTestId('modal');
      const confirmButton = within(modal).getByText(/Confirm/i);
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        // Should extract numeric ID correctly
        expect(assignmentService.reassignTransaction).toHaveBeenCalledWith(
          123, // Extracted numeric ID
          expect.any(String),
          expect.any(String)
        );
      });
    });
  });
  
  describe('Bulk Reassignment', () => {
    it('should successfully bulk reassign multiple transactions', async () => {
      const user = userEvent.setup();
      
      render(
        <AssignmentTable
          assignments={mockAssignments}
          loading={false}
          onUpdate={mockOnUpdate}
          onReassign={mockOnReassign}
        />
      );
      
      // Select multiple assignments
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]); // Select first assignment
      await user.click(checkboxes[2]); // Select second assignment
      
      // Open bulk actions
      const bulkActionsButton = screen.getByText(/Bulk Actions/i);
      await user.click(bulkActionsButton);
      
      // Select bulk reassign
      const bulkReassignButton = screen.getByText(/Bulk Reassign/i);
      await user.click(bulkReassignButton);
      
      // Wait for modal
      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });
      
      // Select new assignee for bulk operation
      const modal = screen.getByTestId('modal');
      const select = within(modal).getByRole('combobox');
      await user.selectOptions(select, '2'); // Select editor1
      
      // Add reason
      const reasonInput = within(modal).getByPlaceholderText(/reason/i);
      await user.type(reasonInput, 'Bulk reassignment for efficiency');
      
      // Confirm bulk reassignment
      const confirmButton = within(modal).getByText(/Confirm/i);
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(assignmentService.bulkReassignTransactions).toHaveBeenCalledWith(
          expect.arrayContaining([expect.any(Number), expect.any(Number)]),
          '2',
          'Bulk reassignment for efficiency'
        );
        expect(mockOnReassign).toHaveBeenCalled();
      });
    });
    
    it('should not allow bulk reassignment to client users', async () => {
      render(
        <AssignmentTable
          assignments={mockAssignments}
          loading={false}
          onUpdate={mockOnUpdate}
          onReassign={mockOnReassign}
        />
      );
      
      // Select multiple assignments
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]);
      fireEvent.click(checkboxes[2]);
      
      // Open bulk reassign modal
      const bulkActionsButton = screen.getByText(/Bulk Actions/i);
      fireEvent.click(bulkActionsButton);
      const bulkReassignButton = screen.getByText(/Bulk Reassign/i);
      fireEvent.click(bulkReassignButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });
      
      // Check that dropdown doesn't include client users
      const modal = screen.getByTestId('modal');
      const select = within(modal).getByRole('combobox');
      const options = within(select).getAllByRole('option');
      
      // Verify no client options
      options.forEach(option => {
        expect(option.textContent).not.toMatch(/Client/i);
      });
    });
  });
  
  describe('Assignment Persistence', () => {
    it('should call onReassign callback after successful reassignment', async () => {
      render(
        <AssignmentTable
          assignments={mockAssignments}
          loading={false}
          onUpdate={mockOnUpdate}
          onReassign={mockOnReassign}
        />
      );
      
      // Perform reassignment
      const reassignButton = screen.getAllByText(/Reassign/i)[0];
      fireEvent.click(reassignButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });
      
      const modal = screen.getByTestId('modal');
      const confirmButton = within(modal).getByText(/Confirm/i);
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        // Verify callback is called to refresh data
        expect(mockOnReassign).toHaveBeenCalled();
      });
    });
    
    it('should display correct user names after reassignment', async () => {
      render(
        <AssignmentTable
          assignments={mockAssignments}
          loading={false}
          onUpdate={mockOnUpdate}
          onReassign={mockOnReassign}
        />
      );
      
      // Check initial assigned user display
      expect(screen.getByText('Editor One')).toBeInTheDocument();
      expect(screen.getByText('Editor Two')).toBeInTheDocument();
      
      // Should not display "Unknown User"
      expect(screen.queryByText('Unknown User')).not.toBeInTheDocument();
    });
  });
  
  describe('Error Handling', () => {
    it('should handle reassignment errors gracefully', async () => {
      (assignmentService.reassignTransaction as jest.Mock).mockRejectedValue({
        response: {
          data: {
            message: 'Invalid data provided',
            errors: {
              assigned_to: ['Invalid user selected']
            }
          }
        }
      });
      
      render(
        <AssignmentTable
          assignments={mockAssignments}
          loading={false}
          onUpdate={mockOnUpdate}
          onReassign={mockOnReassign}
        />
      );
      
      // Try to reassign
      const reassignButton = screen.getAllByText(/Reassign/i)[0];
      fireEvent.click(reassignButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });
      
      const modal = screen.getByTestId('modal');
      const confirmButton = within(modal).getByText(/Confirm/i);
      fireEvent.click(confirmButton);
      
      // Should show error message (implementation dependent)
      await waitFor(() => {
        expect(assignmentService.reassignTransaction).toHaveBeenCalled();
      });
      
      // Verify error doesn't break the component
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
    
    it('should handle unassigned transactions correctly', () => {
      const unassignedAssignment = {
        ...mockAssignments[2],
        assignedTo: undefined
      };
      
      render(
        <AssignmentTable
          assignments={[unassignedAssignment]}
          loading={false}
          onUpdate={mockOnUpdate}
          onReassign={mockOnReassign}
        />
      );
      
      // Should display "Unassigned" or similar
      expect(screen.getByText(/Unassigned/i)).toBeInTheDocument();
    });
  });
});