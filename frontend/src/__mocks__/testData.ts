/**
 * Mock test data for frontend tests
 */

import { Assignment, AssignedUser } from '../types/assignment';

// Mock users - matching backend test fixtures
export const mockUsers = {
  admin: {
    id: 1,  // Changed to number to match AssignedUser type
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
    id: 2,  // Changed to number
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
    id: 3,  // Changed to number
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
    id: 4,  // Changed to number
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
    id: 5,  // Changed to number
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
    transactionId: 'TRX-2025-00101',  // Changed from externalId
    referenceNumber: 'REF-101',  // Added referenceNumber
    title: 'Test Import Transaction',  // Added title
    clientName: 'Test Client 1',
    clientId: 4,
    type: 'Import',
    description: 'Test transaction assigned to editor1',
    status: 'in_progress',
    priority: 'high',
    assignedTo: {
      id: mockUsers.editor1.id,
      username: mockUsers.editor1.username,
      firstName: mockUsers.editor1.firstName,
      lastName: mockUsers.editor1.lastName,
      email: mockUsers.editor1.email,
      avatar: mockUsers.editor1.avatar
    },
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
    transactionId: 'TRX-2025-00102',  // Changed from externalId
    referenceNumber: 'REF-102',  // Added referenceNumber
    title: 'Test Export Transaction',  // Added title
    clientName: 'Test Client 2',
    clientId: 5,
    type: 'Export',
    description: 'Test transaction assigned to editor2',
    status: 'pending',
    priority: 'medium',
    assignedTo: {
      id: mockUsers.editor2.id,
      username: mockUsers.editor2.username,
      firstName: mockUsers.editor2.firstName,
      lastName: mockUsers.editor2.lastName,
      email: mockUsers.editor2.email,
      avatar: mockUsers.editor2.avatar
    },
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
    transactionId: 'TRX-2025-00103',  // Changed from externalId
    referenceNumber: 'REF-103',  // Added referenceNumber
    title: 'Unassigned Import Task',  // Added title
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
  {
    id: mockUsers.admin.id,
    username: mockUsers.admin.username,
    firstName: mockUsers.admin.firstName,
    lastName: mockUsers.admin.lastName,
    email: mockUsers.admin.email,
    avatar: mockUsers.admin.avatar
  },
  {
    id: mockUsers.editor1.id,
    username: mockUsers.editor1.username,
    firstName: mockUsers.editor1.firstName,
    lastName: mockUsers.editor1.lastName,
    email: mockUsers.editor1.email,
    avatar: mockUsers.editor1.avatar
  },
  {
    id: mockUsers.editor2.id,
    username: mockUsers.editor2.username,
    firstName: mockUsers.editor2.firstName,
    lastName: mockUsers.editor2.lastName,
    email: mockUsers.editor2.email,
    avatar: mockUsers.editor2.avatar
  }
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