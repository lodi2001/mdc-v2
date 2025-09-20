/**
 * Tests for assignment service focusing on reassignment functionality
 */

import axios from 'axios';
import { assignmentService } from '../assignmentService';
import { 
  mockAssignments, 
  mockAvailableAssignees, 
  mockApiResponses,
  mockUsers 
} from '../../__mocks__/testData';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the API client
jest.mock('../../utils/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn()
  }
}));

import { api } from '../../utils/api';

describe('AssignmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getAvailableAssignees', () => {
    it('should fetch only editors and admins as available assignees', async () => {
      // Mock API response with all user types
      const apiResponse = {
        data: [
          mockUsers.admin,
          mockUsers.editor1,
          mockUsers.editor2,
          mockUsers.client1, // Should be filtered out
          mockUsers.client2  // Should be filtered out
        ]
      };
      
      (api.get as jest.Mock).mockResolvedValue(apiResponse);
      
      const result = await assignmentService.getAvailableAssignees();
      
      // Should call correct endpoint with proper filters
      expect(api.get).toHaveBeenCalledWith('/users/?role__in=editor,admin&is_active=true');
      
      // Result should only include editors and admins
      expect(result).toHaveLength(3);
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({ role: 'admin' }),
        expect.objectContaining({ role: 'editor' }),
        expect.objectContaining({ role: 'editor' })
      ]));
      
      // Should not include clients
      const hasClients = result.some(user => user.role === 'client');
      expect(hasClients).toBe(false);
    });
    
    it('should filter by is_active=true not status=active', async () => {
      // This test verifies the critical bug fix
      const result = await assignmentService.getAvailableAssignees();
      
      // Verify the API was called with is_active=true
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('is_active=true')
      );
      
      // Should NOT be called with status=active
      expect(api.get).not.toHaveBeenCalledWith(
        expect.stringContaining('status=active')
      );
    });
    
    it('should handle API errors gracefully', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      await expect(assignmentService.getAvailableAssignees()).rejects.toThrow('Network error');
    });
  });
  
  describe('reassignTransaction', () => {
    it('should correctly format reassignment API call', async () => {
      (api.post as jest.Mock).mockResolvedValue({
        data: { success: true, message: 'Transaction reassigned successfully' }
      });
      
      await assignmentService.reassignTransaction(123, '2', 'Test reason');
      
      // Should call correct endpoint with numeric ID
      expect(api.post).toHaveBeenCalledWith(
        '/transactions/123/assign/',
        {
          assigned_to: '2',
          reason: 'Test reason'
        }
      );
    });
    
    it('should handle ID extraction for external IDs', async () => {
      (api.post as jest.Mock).mockResolvedValue({
        data: { success: true }
      });
      
      // Test with various ID formats
      await assignmentService.reassignTransaction(456, '3', 'Reassignment');
      
      expect(api.post).toHaveBeenCalledWith(
        '/transactions/456/assign/',
        expect.any(Object)
      );
    });
    
    it('should handle unassignment (null assignee)', async () => {
      (api.post as jest.Mock).mockResolvedValue({
        data: { success: true }
      });
      
      await assignmentService.reassignTransaction(123, null, 'Unassigning');
      
      expect(api.post).toHaveBeenCalledWith(
        '/transactions/123/assign/',
        {
          assigned_to: null,
          reason: 'Unassigning'
        }
      );
    });
    
    it('should reject assignment to client users', async () => {
      (api.post as jest.Mock).mockRejectedValue({
        response: {
          data: {
            success: false,
            message: 'Invalid data provided',
            errors: {
              assigned_to: ['Only admin or editor users can be assigned to transactions']
            }
          }
        }
      });
      
      await expect(
        assignmentService.reassignTransaction(123, '4', 'Invalid assignment')
      ).rejects.toMatchObject({
        response: {
          data: {
            errors: {
              assigned_to: expect.arrayContaining([
                expect.stringContaining('Only admin or editor')
              ])
            }
          }
        }
      });
    });
  });
  
  describe('bulkReassignTransactions', () => {
    it('should correctly format bulk reassignment API call', async () => {
      (api.post as jest.Mock).mockResolvedValue({
        data: { success: true, updated: 3 }
      });
      
      const transactionIds = [101, 102, 103];
      await assignmentService.bulkReassignTransactions(
        transactionIds, 
        '2', 
        'Bulk reassignment'
      );
      
      expect(api.post).toHaveBeenCalledWith(
        '/transactions/bulk-operations/',
        {
          transaction_ids: [101, 102, 103],
          action: 'assign',
          assigned_to: '2',
          reason: 'Bulk reassignment'
        }
      );
    });
    
    it('should use correct action name for bulk assignment', async () => {
      (api.post as jest.Mock).mockResolvedValue({
        data: { success: true }
      });
      
      await assignmentService.bulkReassignTransactions([1, 2], '1', 'Test');
      
      const callArgs = (api.post as jest.Mock).mock.calls[0][1];
      
      // Should use 'assign' not 'update_status' or other actions
      expect(callArgs.action).toBe('assign');
    });
    
    it('should handle bulk unassignment', async () => {
      (api.post as jest.Mock).mockResolvedValue({
        data: { success: true }
      });
      
      await assignmentService.bulkReassignTransactions(
        [1, 2, 3], 
        null, 
        'Bulk unassignment'
      );
      
      expect(api.post).toHaveBeenCalledWith(
        '/transactions/bulk-operations/',
        {
          transaction_ids: [1, 2, 3],
          action: 'assign',
          assigned_to: null,
          reason: 'Bulk unassignment'
        }
      );
    });
    
    it('should reject bulk assignment to client users', async () => {
      (api.post as jest.Mock).mockRejectedValue({
        response: {
          data: {
            success: false,
            errors: {
              assigned_to: ['Invalid user selected']
            }
          }
        }
      });
      
      await expect(
        assignmentService.bulkReassignTransactions([1, 2], '5', 'Invalid')
      ).rejects.toMatchObject({
        response: {
          data: {
            errors: {
              assigned_to: expect.any(Array)
            }
          }
        }
      });
    });
  });
  
  describe('getAssignments', () => {
    it('should fetch assignments with proper filtering', async () => {
      (api.get as jest.Mock).mockResolvedValue({
        data: {
          results: mockAssignments,
          count: mockAssignments.length
        }
      });
      
      const filters = {
        status: ['in_progress'],
        assigned_to: ['2']
      };
      
      await assignmentService.getAssignments(filters, 1, 10);
      
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('/transactions/'),
        expect.objectContaining({
          params: expect.objectContaining({
            status: ['in_progress'],
            assigned_to: ['2'],
            page: 1,
            page_size: 10
          })
        })
      );
    });
    
    it('should properly map assignment data', async () => {
      const mockResponse = {
        data: {
          results: [
            {
              id: 123,
              transaction_id: 'EXT-123',
              assigned_to: mockUsers.editor1,
              client: mockUsers.client1,
              status: 'in_progress',
              priority: 'high'
            }
          ],
          count: 1
        }
      };
      
      (api.get as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await assignmentService.getAssignments({}, 1, 10);
      
      expect(result.assignments).toHaveLength(1);
      expect(result.assignments[0]).toMatchObject({
        id: expect.any(String),
        externalId: 'EXT-123',
        assignedTo: expect.objectContaining({
          role: 'editor'
        }),
        client: expect.objectContaining({
          role: 'client'
        })
      });
    });
  });
  
  describe('API URL Construction', () => {
    it('should not duplicate /api/ prefix in URLs', async () => {
      (api.post as jest.Mock).mockResolvedValue({ data: { success: true } });
      
      await assignmentService.reassignTransaction(123, '1', 'Test');
      
      const calledUrl = (api.post as jest.Mock).mock.calls[0][0];
      
      // Should not have /api/api/ or duplicate prefixes
      expect(calledUrl).not.toMatch(/\/api\/api\//);
      expect(calledUrl).toBe('/transactions/123/assign/');
    });
    
    it('should use correct base path for all endpoints', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: [] });
      (api.post as jest.Mock).mockResolvedValue({ data: { success: true } });
      
      // Test various endpoints
      await assignmentService.getAvailableAssignees();
      expect((api.get as jest.Mock).mock.calls[0][0]).toBe('/users/?role__in=editor,admin&is_active=true');
      
      await assignmentService.reassignTransaction(1, '1', 'Test');
      expect((api.post as jest.Mock).mock.calls[0][0]).toBe('/transactions/1/assign/');
      
      await assignmentService.bulkReassignTransactions([1], '1', 'Test');
      expect((api.post as jest.Mock).mock.calls[1][0]).toBe('/transactions/bulk-operations/');
    });
  });
});