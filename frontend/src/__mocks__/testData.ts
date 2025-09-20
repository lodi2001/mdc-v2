/**
 * Mock test data for frontend tests
 */

import { Assignment, AssignedUser } from '../types/assignment';

// Mock users - matching backend test fixtures
export const mockUsers = {
  admin: {
    id: '1',
    username: 'admin_user',
    name: 'Admin User',
    email: 'admin@test.com',
    role: 'admin' as const,
    department: 'Management',
    avatar: '',
    firstName: 'Admin',
    lastName: 'User'
  },
  editor1: {
    id: '2',
    username: 'editor1',
    name: 'Editor One',
    email: 'editor1@test.com',
    role: 'editor' as const,
    department: 'Operations',
    avatar: '',
    firstName: 'Editor',
    lastName: 'One'
  },
  editor2: {
    id: '3',
    username: 'editor2',
    name: 'Editor Two',
    email: 'editor2@test.com',
    role: 'editor' as const,
    department: 'Operations',
    avatar: '',
    firstName: 'Editor',
    lastName: 'Two'
  },
  client1: {
    id: '4',
    username: 'client1',
    name: 'Client One',
    email: 'client1@test.com',
    role: 'client' as const,
    department: '',
    avatar: '',
    firstName: 'Client',
    lastName: 'One'
  },
  client2: {
    id: '5',
    username: 'client2',
    name: 'Client Two',
    email: 'client2@test.com',
    role: 'client' as const,
    department: '',
    avatar: '',
    firstName: 'Client',
    lastName: 'Two'
  }
};

// Mock assignments
export const mockAssignments: Assignment[] = [
  {
    id: 'EXT-101',
    externalId: 'EXT-101',
    clientName: 'Test Client 1',
    clientId: 4,
    type: 'Import',
    description: 'Test transaction assigned to editor1',
    status: 'in_progress',
    priority: 'high',
    assignedTo: mockUsers.editor1 as AssignedUser,
    assignedDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    progress: 50,
    commentsCount: 2,
    attachmentsCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'EXT-102',
    externalId: 'EXT-102',
    clientName: 'Test Client 2',
    clientId: 5,
    type: 'Export',
    description: 'Test transaction assigned to editor2',
    status: 'pending',
    priority: 'medium',
    assignedTo: mockUsers.editor2 as AssignedUser,
    assignedDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    progress: 0,
    commentsCount: 0,
    attachmentsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'EXT-103',
    externalId: 'EXT-103',
    clientName: 'Test Client 1',
    clientId: 4,
    type: 'Import',
    description: 'Unassigned test transaction',
    status: 'pending',
    priority: 'low',
    assignedTo: undefined,
    assignedDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    progress: 0,
    commentsCount: 0,
    attachmentsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Mock available assignees (should NOT include clients)
export const mockAvailableAssignees: AssignedUser[] = [
  mockUsers.admin as AssignedUser,
  mockUsers.editor1 as AssignedUser,
  mockUsers.editor2 as AssignedUser
  // Note: client1 and client2 are intentionally excluded
];

// Mock API responses
export const mockApiResponses = {
  getAssignments: {
    success: true,
    data: mockAssignments,
    total: mockAssignments.length,
    page: 1,
    pageSize: 10
  },
  
  getAvailableAssignees: {
    success: true,
    data: mockAvailableAssignees
  },
  
  reassignSuccess: {
    success: true,
    message: 'Transaction reassigned successfully'
  },
  
  reassignError: {
    success: false,
    message: 'Invalid data provided',
    errors: {
      assigned_to: ['Only admin or editor users can be assigned to transactions']
    }
  },
  
  bulkReassignSuccess: {
    success: true,
    message: 'Bulk reassignment completed successfully',
    updated: 3
  }
};

// Helper function to extract numeric ID from external ID
export function extractTransactionId(externalId: string): number {
  // Handle formats like 'EXT-123' or just '123'
  const match = externalId.match(/\d+$/);
  return match ? parseInt(match[0], 10) : 0;
}

// Mock filter options
export const mockFilterOptions = {
  statuses: [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'in_review', label: 'In Review' },
    { value: 'completed', label: 'Completed' }
  ],
  priorities: [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ]
};