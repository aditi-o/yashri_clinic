import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Sidebar, { SidebarCtx } from './Sidebar';

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Role-based access: if the route requires a role the user doesn't have, redirect home
  if (roles && !roles.includes(user?.role)) {
    if (user?.role === 'ADMIN')        return <Navigate to="/admin/dashboard" replace />;
    if (user?.role === 'DOCTOR')       return <Navigate to="/doctor-dashboard" replace />;
    if (user?.role === 'RECEPTIONIST') return <Navigate to="/receptionist/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <SidebarCtx.Provider value={{ collapsed, setCollapsed }}>
      <div className="shell">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <div className="shell-main">
          <div className="shell-page anim-up">{children}</div>
        </div>
      </div>
    </SidebarCtx.Provider>
  );
}
