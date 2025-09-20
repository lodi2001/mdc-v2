import React from 'react';
import Layout from '../components/layout/Layout';

const SettingsPage: React.FC = () => {
  return (
    <Layout>
      <div className="container-fluid p-4">
        <div className="page-header mb-4">
          <h2 className="page-title">System Settings</h2>
          <p className="text-muted mb-0">Configure system settings</p>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-muted text-center py-5">System Settings interface will be displayed here</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
