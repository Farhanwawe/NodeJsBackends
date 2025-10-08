import React, { useEffect, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Loader from './common/Loader';
import PageTitle from './components/PageTitle';
import SignIn from './pages/Authentication/SignIn';
import SignUp from './pages/Authentication/SignUp';
import Calendar from './pages/Calendar';
import Messages from './pages/Messages';
import ViewReports from './pages/Reports';
import Chart from './pages/Chart';
import ECommerce from './pages/Dashboard/ECommerce';
import VipDashboard from './pages/Dashboard/VipDashboard';
import SupportDashboard from './pages/Dashboard/SupportDashboard';
import FormElements from './pages/Form/FormElements';
import FormLayout from './pages/Form/FormLayout';
import Profile from './pages/Profile';
import UserSettings from './pages/UserSettings';
import Settings from './pages/Settings';
import Tables from './pages/UserTables';
import QueryTable from './pages/queryTable';
import ReportTable from './pages/reportTable';
import VipTable from './pages/VipUserTable';
import GameTable from './pages/GameTable';
import BannedUser from './pages/bannedUser';
import AddTable from './pages/Tables';
import GiftsTable from './pages/Gifts';
import Alerts from './pages/UiElements/Alerts';
import Buttons from './pages/UiElements/Buttons'; 
import { UserProvider } from '../src/Auth/UserContext';
import sessionManager from './Auth/sessionManager';
import EventsTable from './pages/Events';
import Eventsetting from './pages/EventSetting'
import GiftsSettings from './pages/GiftsSettings';
import AddGift from './pages/addGifts';
import AddEvent from './pages/addEvent';
import ProtectedRoute from './protectedRoutes';
import VipReward from './pages/RewardVipUser';
import Popups from './pages/PopUps';
import PopupsSettings from './pages/PopUpsSettings';
import AddPopups from './pages/addPopUps';
import PopupSequence from './pages/PopupSequence';
import InAppProduct from './pages/InAppProduct';
import InAppSettings from './pages/InAppSettings';
import AddInApp from './pages/AddInAppProduct';
import InAppPurchase  from './pages/InAppPurchase';
import InAppDisplay from './pages/InAppDisplay';
import UserProfile from './pages/UserProfile';
import VipClub from './pages/VipClub';
import VipClubSetting from './pages/VipclubSetting';
import AddVip from './pages/addVipClub';
import VersionControl from './pages/versionControl'; 
import AddVersion from './pages/addVersion';
import VersionSetting from './pages/VersionSetting';




function App() { 
  const [loading, setLoading] = useState(true);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  useEffect(() => {
    window.scrollTo(0, 0);
    const token = sessionManager.getToken();
    if (!token || !sessionManager.isSessionActive()) {
      navigate('/auth/signin');
    } else {
      const dispaly = sessionManager.getUser();
      setUser(dispaly);
    }
  }, [pathname]);
  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);
  const getHomePage = () => {
    switch (user?.role) {
      case 'Vip':
        return <VipDashboard />;
      case 'SuperAdmin':
        return <ECommerce />;
      case 'Support':
        return <SupportDashboard />;
      default:
        return <ECommerce />;
    }
  };
  return loading ? (
    <Loader />
  ) : (
    
    <UserProvider>
    <Routes>
    <Route
          index
          element={
            <>
              <PageTitle title="Dashboard | Wawe Poker Face" />
              {getHomePage()}
            </>
          }
        />
        <Route
          path="/queryTable"
          element={
            <ProtectedRoute user={user} allowedRoles={['Support', 'SuperAdmin']}>
              <PageTitle title="Query Table | Wawe Poker Face" />
              <QueryTable />
              </ProtectedRoute> 
          }
        />
         <Route
          path="/reportTable"
          element={
            <>
              <PageTitle title="Report Table | Wawe Poker Face" />
              <ReportTable />
            </>
          }
        />
        <Route
          path="/events"
          element={
            <>
              <PageTitle title="Events Table | Wawe Poker Face" />
              <EventsTable />
            </>
          }
        />
            <Route
          path="/Gifts"
          element={
            <>
              <PageTitle title="Gifts Table | Wawe Poker Face" />
              <GiftsTable />
            </>
          }
        />
        <Route
          path="/PopUps"
          element={
            <>
              <PageTitle title="PopUp Table | Wawe Poker Face" />
              <Popups />
            </>
          }
        />
        <Route
          path="/PopUpsSequence"
          element={
            <>
              <PageTitle title="PopUp Table | Wawe Poker Face" />
              <PopupSequence />
            </>
          }
        />
        <Route
          path="/BannedUser"
          element={
            <>
              <PageTitle title="Banned User | Wawe Poker Face" />
              <BannedUser />
            </>
          }
        />
         <Route
          path="/events/:id"
          element={
            <ProtectedRoute user={user} allowedRoles={['Vip', 'SuperAdmin']}>
              <PageTitle title="Events | Wawe Poker Face" />
              <Eventsetting />
              </ProtectedRoute>
          }
        />
        <Route
          path="/version/:id"
          element={
            <ProtectedRoute user={user} allowedRoles={['SuperAdmin']}>
              <PageTitle title="Versions | Wawe Poker Face" />
              <VersionSetting />
              </ProtectedRoute>
          }
        />
        <Route
          path="/addevent"
          element={
            <ProtectedRoute user={user} allowedRoles={['Vip', 'SuperAdmin']}>
              <PageTitle title="Events | Wawe Poker Face" />
              <AddEvent />
              </ProtectedRoute>
          }
        />
        <Route
          path="/addVersion"
          element={
            <ProtectedRoute user={user} allowedRoles={['SuperAdmin']}>
              <PageTitle title="Versions | Wawe Poker Face" />
              <AddVersion />
              </ProtectedRoute>
          }
        />
        <Route
          path="/InAppPurchase"
          element={
            <ProtectedRoute user={user} allowedRoles={['Vip', 'SuperAdmin']}>
              <PageTitle title="InAppPurchase | Wawe Poker Face" />
              <InAppPurchase />
              </ProtectedRoute>
          }
        /><Route
          path="/ViewInAppPurchase/:id"
          element={
            <ProtectedRoute user={user} allowedRoles={['Vip', 'SuperAdmin']}>
              <PageTitle title="InAppPurchase | Wawe Poker Face" />
              <InAppDisplay />
              </ProtectedRoute>
          }
        />
                 <Route
          path="/Gifts/:id"
          element={
            <ProtectedRoute user={user} allowedRoles={['Vip', 'SuperAdmin']}>
              <PageTitle title="Gifts | Wawe Poker Face" />
              <GiftsSettings />
              </ProtectedRoute>
          }
        />
        <Route
          path="/addGifts"
          element={
            <ProtectedRoute user={user} allowedRoles={['Vip', 'SuperAdmin']}>
              <PageTitle title="Gifts | Wawe Poker Face" />
              <AddGift />
              </ProtectedRoute>
          }
        />
          <Route
          path="/Popups/:id"
          element={
            <ProtectedRoute user={user} allowedRoles={['Vip', 'SuperAdmin']}>
              <PageTitle title="PopUps | Wawe Poker Face" />
              <PopupsSettings />
              </ProtectedRoute>
          }
        />
        <Route
          path="/addPopups"
          element={
            <ProtectedRoute user={user} allowedRoles={['Vip', 'SuperAdmin']}>
              <PageTitle title="PopUps | Wawe Poker Face" />
              <AddPopups />
              </ProtectedRoute>
          }
        />
         <Route
          path="/addTable"
          element={
            <ProtectedRoute user={user} allowedRoles={['Vip', 'SuperAdmin']}>
              <PageTitle title="Add New Table | Wawe Poker Face" />
              <AddTable />
              </ProtectedRoute>
          }
        />
        <Route
          path="/gameTable"
          element={
            <ProtectedRoute user={user} allowedRoles={['Vip', 'SuperAdmin']}>
              <PageTitle title="Add New Table | Wawe Poker Face" />
              <GameTable />
              </ProtectedRoute>
          }
        />
        <Route
          path="/VipTable"
          element={
            <ProtectedRoute user={user} allowedRoles={['Vip', 'SuperAdmin']}>
              <PageTitle title="Vip User Table | Wawe Poker Face" />
              <VipTable />
              </ProtectedRoute>
          }
        />
        <Route
          path="/InAppProducts"
          element={
            <ProtectedRoute user={user} allowedRoles={['Vip', 'SuperAdmin']}>
              <PageTitle title="In-App Products Table | Wawe Poker Face" />
              <InAppProduct />
              </ProtectedRoute>
          }
        /><Route
          path="/In-AppSettings/:id"
          element={
            <ProtectedRoute user={user} allowedRoles={['Vip', 'SuperAdmin']}>
              <PageTitle title="In App Settings | Wawe Poker Face" />
              <InAppSettings />
              </ProtectedRoute>
          }
        /><Route
          path="/addInAppProducts"
          element={
            <ProtectedRoute user={user} allowedRoles={['Vip', 'SuperAdmin']}>
              <PageTitle title="In-App Products | Wawe Poker Face" />
              <AddInApp />
              </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <>
              <PageTitle title="Calendar | Wawe Poker Face" />
              <Calendar />
            </>
          }
        />
        <Route
          path="/profile"
          element={
            <>
              <PageTitle title="Profile | Wawe Poker Face" />
              <Profile />
            </>
          }
        />
        <Route
          path="/versionControl"
          element={
            <>
              <PageTitle title="Versions | Wawe Poker Face" />
              <VersionControl />
            </>
          }
        />
        <Route
          path="/forms/form-elements"
          element={
            <>
              <PageTitle title="Form Elements | Wawe Poker Face" />
              <FormElements />
            </>
          }
        />
        <Route
          path="/forms/form-layout"
          element={
            <>
              <PageTitle title="Form Layout | Wawe Poker Face" />
              <FormLayout />
            </>
          }
        />
        <Route
          path="/tables"
          element={
            <>
              <PageTitle title="Tables | Wawe Poker Face" />
              <Tables />
            </>
          }
        />
        <Route
          path="/settings/:userId"
          element={
            <ProtectedRoute user={user} allowedRoles={['Vip', 'SuperAdmin']}>
              <PageTitle title=" UserSettings | Wawe Poker Face" />
              <UserSettings />
              </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute user={user} allowedRoles={['SuperAdmin']}>
              <PageTitle title="Admin Settings | Wawe Poker Face" />
              <Settings />
              </ProtectedRoute>
          }
        />
        <Route
          path="/chart"
          element={
            <>
              <PageTitle title="Basic Chart | Wawe Poker Face" />
              <Chart />
            </>
          }
        />
        <Route
          path="/ui/alerts"
          element={
            <>
              <PageTitle title="Alerts | Wawe Poker Face" />
              <Alerts />
            </>
          }
        />
        <Route
          path="/ui/buttons"
          element={
            <>
              <PageTitle title="Buttons | Wawe Poker Face" />
              <Buttons />
            </>
          }
        />
        <Route
          path="/auth/signin"
          element={
            <>
              <PageTitle title="Signin | Wawe Poker Face" />
              <SignIn />
            </>
          }
        />
        <Route
          path="/auth/signup"
          element={
            <ProtectedRoute user={user} allowedRoles={['Vip','SuperAdmin']}>
              <PageTitle title="Signup | Wawe Poker Face" />
              <SignUp />
              </ProtectedRoute>
          }
        />
          <Route
          path="/messages/:id"
          element={
            <>
              <PageTitle title="Messages | Wawe Poker Face" />
              <Messages />
            </>
          }
        />
        <Route
          path="/userprofile"
          element={
            <>
              <PageTitle title="User Profile | Wawe Poker Face" />
              <UserProfile />
            </>
          }
        />
         <Route
          path="/retrievereport/:id"
          element={
            <>
              <PageTitle title="Messages | Wawe Poker Face" />
              <ViewReports />
            </>
          }
        />
        <Route
          path="/VipClub"
          element={
            <>
              <PageTitle title="VipClub | Wawe Poker Face" />
              <VipClub />
            </>
          }
        />
        <Route
          path="/addVipClub"
          element={
            <>
              <PageTitle title="VipClub | Wawe Poker Face" />
              <AddVip />
            </>
          }
        />
         <Route
          path="/VipClub/:id"
          element={
            <>
              <PageTitle title="VipClub | Wawe Poker Face" />
              <VipClubSetting />
            </>
          }
        />
       <Route
        path="/vip-reward/:userId"
        element={
          <ProtectedRoute user={user} allowedRoles={['Vip', 'SuperAdmin']}>
            <PageTitle title="VIP Reward | Wawe Poker Face" />
            <VipReward />
          </ProtectedRoute>
        }
      />
      </Routes>
    </UserProvider>
  );
}

export default App;