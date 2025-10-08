import React, { useState,useContext } from 'react';
import Header from '../components/Header/index';
import Sidebar from '../components/Sidebar/index';
import AdminSidebar from '../components/Sidebar/AdminSidebar';
import SupportSidebar from '../components/Sidebar/SupportSidebar';
import { UserContext } from '../Auth/UserContext';
const DefaultLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useContext(UserContext);
  const renderSidebar = () => {
    switch (user.role) {
      case 'Vip':
        return <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />;
      case 'Support':
        return <SupportSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />;
      case 'SuperAdmin':
        return <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />;
      default:
        return null;
    }
  };
  return (
    <div className="dark:bg-boxdark-2 dark:text-bodydark">
      {/* <!-- ===== Page Wrapper Start ===== --> */}
      <div className="flex h-screen overflow-hidden">
        {/* <!-- ===== Sidebar Start ===== --> */}
        {renderSidebar()}
        {/* <!-- ===== Sidebar End ===== --> */}

        {/* <!-- ===== Content Area Start ===== --> */}
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {/* <!-- ===== Header Start ===== --> */}
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          {/* <!-- ===== Header End ===== --> */}

          {/* <!-- ===== Main Content Start ===== --> */}
          <main>
            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
              {children}
            </div>
          </main>
          {/* <!-- ===== Main Content End ===== --> */}
        </div>
        {/* <!-- ===== Content Area End ===== --> */}
      </div>
      {/* <!-- ===== Page Wrapper End ===== --> */}
    </div>
  );
};

export default DefaultLayout;