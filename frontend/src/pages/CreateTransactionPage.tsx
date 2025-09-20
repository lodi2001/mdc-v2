import React from 'react';
import Layout from '../components/layout/Layout';
import TransactionWizard from '../components/transactions/TransactionWizard';

const CreateTransactionPage: React.FC = () => {
  const isRTL = localStorage.getItem('language') === 'ar';

  return (
    <Layout>
      <div className="container-fluid p-4">
        <div className="page-header mb-4">
          <h2 className="page-title">
            {isRTL ? 'إنشاء معاملة جديدة' : 'Create New Transaction'}
          </h2>
          <p className="text-muted mb-0">
            {isRTL 
              ? 'املأ المعلومات المطلوبة لإنشاء معاملة جديدة'
              : 'Fill in the required information to create a new transaction'
            }
          </p>
        </div>

        <TransactionWizard />
      </div>
    </Layout>
  );
};

export default CreateTransactionPage;
