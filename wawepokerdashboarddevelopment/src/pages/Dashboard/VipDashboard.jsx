import React, { useEffect, useState, useContext } from 'react';
import { UserContext } from '../../Auth/UserContext'; 
import sessionManager from '../../Auth/sessionManager';
import { useNavigate } from 'react-router-dom';
import CardDataStats from '../../components/CardDataStats';
import ChartOne from '../../components/Charts/ChartOne';
import ChartTwo from '../../components/Charts/ChartTwo';
import DefaultLayout from '../../layout/DefaultLayout';

const VipDashboard = () => {
  const { user } = useContext(UserContext);
  const [totalUsers, setTotalUsers] = useState(0);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [totalQueries, setTotalQueries] = useState(0);
  const [totalAdmins, setAdmins] = useState(0);
  const [totalVipUsers, setVipUsers] = useState(0);
  const navigate = useNavigate();
  const secretKey = import.meta.env.VITE_API_KEY;
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionManager.getToken();

        if (user) {
          setUsername(user.name);
          setEmail(user.email);
        } else {
          const storedUsername = sessionManager.getUsername();
          const storedEmail = sessionManager.getemail();
          if (storedUsername && storedEmail) {
            setUsername(storedUsername);
            setEmail(storedEmail);
          }
        }

        if (!token || !sessionManager.isSessionActive()) {
          navigate('/auth/signin');
        } else {
          const [totalUsersResponse, totalAdminResponse,totalQueryResponse,totalVipUserResponse] = await Promise.all([
            fetch(secretKey+'/admin/total-users'),
            fetch(secretKey+'/admin/total-admin'),
            fetch(secretKey+'/admin/totalQuery'),
            fetch(secretKey+'/admin/totalVipUser')
          ]);
          const totalQueryData = await totalQueryResponse.json();
          const totalVipUserData = await totalVipUserResponse.json();
          const totalUsersData = await totalUsersResponse.json();
          const totalAdminData = await totalAdminResponse.json();

          if (totalUsersResponse.ok && totalAdminResponse.ok && totalQueryResponse.ok && totalVipUserResponse.ok) {
            setTotalUsers(totalUsersData.totalUsers);
            setAdmins(totalAdminData.totalUsers);
            setTotalQueries(totalQueryData.handle);
            setVipUsers(totalVipUserData.count);

          } else {
            console.error('Failed to fetch data');
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [navigate, user]);
  return (
    <>
    <DefaultLayout>
      <div className="text-3xl font-semibold mb-4">
          Hi, {username}, this is VIP Dashboard
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        <CardDataStats title="Total Users" total={totalUsers.toString()} rate="0.43%" levelUp>
          <svg
            className="fill-primary dark:fill-white"
            width="22"
            height="16"
            viewBox="0 0 22 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11 15.1156C4.19376 15.1156 0.825012 8.61876 0.687512 8.34376C0.584387 8.13751 0.584387 7.86251 0.687512 7.65626C0.825012 7.38126 4.19376 0.918762 11 0.918762C17.8063 0.918762 21.175 7.38126 21.3125 7.65626C21.4156 7.86251 21.4156 8.13751 21.3125 8.34376C21.175 8.61876 17.8063 15.1156 11 15.1156ZM2.26876 8.00001C3.02501 9.27189 5.98126 13.5688 11 13.5688C16.0188 13.5688 18.975 9.27189 19.7313 8.00001C18.975 6.72814 16.0188 2.43126 11 2.43126C5.98126 2.43126 3.02501 6.72814 2.26876 8.00001Z"
              fill=""
            />
            <path
              d="M11 10.9219C9.38438 10.9219 8.07812 9.61562 8.07812 8C8.07812 6.38438 9.38438 5.07812 11 5.07812C12.6156 5.07812 13.9219 6.38438 13.9219 8C13.9219 9.61562 12.6156 10.9219 11 10.9219ZM11 6.625C10.2437 6.625 9.625 7.24375 9.625 8C9.625 8.75625 10.2437 9.375 11 9.375C11.7563 9.375 12.375 8.75625 12.375 8C12.375 7.24375 11.7563 6.625 11 6.625Z"
              fill=""
            />
          </svg>
        </CardDataStats>
        <CardDataStats title="Total Admins" total={totalAdmins.toString()} rate="4.35%" levelUp>
        <svg
          className="fill-primary dark:fill-white"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
            fill=""
          />
        </svg>
        </CardDataStats>
        <CardDataStats title="Total Queries" total={totalQueries.toString()} rate="2.59%" levelUp>
          <svg
            className="fill-primary dark:fill-white"
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M21.1063 18.0469L19.3875 3.23126C19.2157 1.71876 17.9438 0.584381 16.3969 0.584381H5.56878C4.05628 0.584381 2.78441 1.71876 2.57816 3.23126L0.859406 18.0469C0.756281 18.9063 1.03128 19.7313 1.61566 20.2813C2.19991 20.8313 3.01566 21.0688 3.86878 20.8813L4.83441 20.65C4.96253 20.6125 5.10315 20.6125 5.23128 20.65L6.19691 20.8813C7.05003 21.0688 7.86578 20.8313 8.45003 20.2813C9.03441 19.7313 9.30941 18.9063 9.20628 18.0469H12.7938C12.6907 18.9063 12.9657 19.7313 13.55 20.2813C14.1344 20.8313 14.9502 21.0688 15.8032 20.8813L16.7688 20.65C16.8969 20.6125 17.0375 20.6125 17.1657 20.65L18.1313 20.8813C18.9844 21.0688 19.8002 20.8313 20.3844 20.2813C20.9688 19.7313 21.2438 18.9063 21.1407 18.0469C21.1407 18.0125 21.1407 17.9781 21.1063 18.0469ZM11 17.0875C9.79378 17.0875 8.81878 16.1125 8.81878 14.9063C8.81878 13.7001 9.79378 12.7251 11 12.7251C12.2063 12.7251 13.1813 13.7001 13.1813 14.9063C13.1813 16.1125 12.2063 17.0875 11 17.0875ZM16.3875 7.81251H14.6188V5.96251C14.6188 5.21251 14.025 4.61876 13.275 4.61876H8.72503C7.97503 4.61876 7.38128 5.21251 7.38128 5.96251V7.81251H5.61253C5.10003 7.81251 4.68441 8.23126 4.68441 8.74376C4.68441 9.25626 5.10003 9.67501 5.61253 9.67501H16.3875C16.9001 9.67501 17.3157 9.25626 17.3157 8.74376C17.3157 8.23126 16.9001 7.81251 16.3875 7.81251Z"
              fill=""
            />
          </svg>
        </CardDataStats>
        <CardDataStats title="Total Vip Users" total={totalVipUsers.toString()} rate="4.30%" levelUp>
          <svg
            className="fill-primary dark:fill-white"
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10.909 7.56445C10.0913 6.7467 8.90863 6.7467 8.09088 7.56445L3.62676 12.0286C2.80901 12.8464 2.80901 14.0291 3.62676 14.8469L8.09088 19.311C8.90863 20.1287 10.0913 20.1287 10.909 19.311L15.3731 14.8469C16.1909 14.0291 16.1909 12.8464 15.3731 12.0286L10.909 7.56445Z"
              fill=""
            />
          </svg>
        </CardDataStats>
      </div>

      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <ChartOne />
        <ChartTwo />
        </div>
      </DefaultLayout>
    </>
  );
};

export default VipDashboard;
