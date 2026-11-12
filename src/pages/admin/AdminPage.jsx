// pages/admin/AdminPage.jsx - Centralized entry coordinator for /admin
import React from 'react';
import { useAdmin } from '../../context/AdminContext';
import AdminLogin from './AdminLogin';
import AdminDashboardLayout from '../../components/admin/AdminDashboardLayout';

export default function AdminPage() {
  const { isAuthenticated } = useAdmin();

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  return <AdminDashboardLayout />;
}

