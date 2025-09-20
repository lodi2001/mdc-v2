import React from 'react';
import { Link } from 'react-router-dom';

interface Transaction {
  id: string;
  reference_number: string;
  transaction_id: string;
  client: string;
  type: string;
  description: string;
  priority?: string;
  status: string;
  creation_date: string;
  comments_count: number;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  showAllLink?: boolean;
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ 
  transactions, 
  showAllLink = true 
}) => {
  const getStatusBadge = (status: string) => {
    const statusClasses: { [key: string]: string } = {
      'Completed': 'bg-success',
      'Pending': 'bg-warning',
      'In Progress': 'bg-info',
      'Approved': 'bg-primary',
      'Rejected': 'bg-danger',
    };
    return statusClasses[status] || 'bg-secondary';
  };

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="card-title mb-0">Recent Transactions</h5>
        {showAllLink && (
          <Link to="/transactions" className="btn btn-sm btn-link">
            View All
          </Link>
        )}
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>Reference Number</th>
                <th>Transaction ID</th>
                <th>Client</th>
                <th>Type</th>
                <th>Description</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Creation Date</th>
                <th>Comments</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-4">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{transaction.reference_number}</td>
                    <td>{transaction.transaction_id}</td>
                    <td>{transaction.client}</td>
                    <td>{transaction.type}</td>
                    <td>{transaction.description}</td>
                    <td>{transaction.priority || '-'}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td>{transaction.creation_date}</td>
                    <td>
                      <button 
                        className="btn btn-sm btn-link p-0" 
                        data-bs-toggle="tooltip" 
                        title={`${transaction.comments_count} comments`}
                      >
                        <i className="bi bi-chat-dots"></i> {transaction.comments_count}
                      </button>
                    </td>
                    <td>
                      <Link 
                        to={`/transactions/${transaction.id}`}
                        className="btn btn-sm btn-link p-0"
                      >
                        <i className="bi bi-eye"></i>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RecentTransactions;