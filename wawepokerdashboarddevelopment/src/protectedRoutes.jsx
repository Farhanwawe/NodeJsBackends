import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ user, allowedRoles, children }) => {
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default ProtectedRoute;