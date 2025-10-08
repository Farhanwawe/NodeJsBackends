import React, { useEffect, useState } from 'react';
import axios from 'axios';
import CardDataStats from '../components/CardDataStats';
import DefaultLayout from '../layout/DefaultLayout';
import PieChart from '../components/Charts/PieChart'; // Import PieChart
import OngoingWorkProgress from './OngoingWorkProgress';

const UserProfile = () => {
  const userId = localStorage.getItem('userId');
  const [stats, setStats] = useState({
    Open: 0,
    inProgress: 0,
    End: 0,
    Completed: 0,
  });
  const [inProgressData, setInProgressData] = useState([]);
  const secretKey = import.meta.env.VITE_API_KEY;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const response = await axios.get(
          secretKey + `/admin/userProfile/${userId}`,
        );

        if (response.status === 200) {
          const { userqueries, userReport } = response.data;
          const combinedData = [...userqueries, ...userReport];

          // Count status types
          const statusCounts = combinedData.reduce(
            (acc, item) => {
              acc[item.status] = (acc[item.status] || 0) + 1;
              return acc;
            },
            { Open: 0, inProgress: 0, End: 0, Completed: 0 },
          );

          setStats(statusCounts);

          // Filter inProgress queries and reports
          const inProgressQueries = userqueries.filter(
            (query) => query.status === 'inProgress',
          );
          const inProgressReports = userReport.filter(
            (report) => report.status === 'inProgress',
          );

          // Fetch additional data for inProgress queries and reports
          const queryDetails = await Promise.all(
            inProgressQueries.map(async (query) => {
              const queryResponse = await axios.get(
                `${secretKey}/admin/retrieveQuery/${query.QuerytId}`,
              );
              return {
                id: queryResponse.data.queryDetails.id,
                userId: queryResponse.data.queryDetails.userId,
                message: queryResponse.data.queryDetails.message,
              };
            }),
          );

          const reportDetails = await Promise.all(
            inProgressReports.map(async (report) => {
              const reportResponse = await axios.get(
                `${secretKey}/admin/retrievereport/${report.reportId}`,
              );
              return {
                id: reportResponse.data.ReportDetails.id,
                userId: reportResponse.data.ReportDetails.userId,
                message: reportResponse.data.ReportDetails.message,
              };
            }),
          );

          // Combine both query and report details
          setInProgressData([...queryDetails, ...reportDetails]);
        } else {
          console.error('Failed to fetch user data');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [userId]);

  return (
    <DefaultLayout>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <CardDataStats title="Open" total={stats.Open} rate="0.5%">
      <svg
    className="fill-primary  transition-all duration-300 ease-in-out transform hover:rotate-180"
    width="48"
    height="48"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      fill="fill-primary"
    />
    <path
      d="M12 2L12 12L20 8"
      stroke="white"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M2 12L12 12L16 20"
      stroke="white"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
</CardDataStats>

<CardDataStats title="In Progress" total={stats.inProgress} rate="1.2%">
<svg
    className="fill-lime-600  transition-all duration-300 ease-in-out transform hover:rotate-90"
    width="48"
    height="48"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      fill="fill-lime-600"
    />
    
    <path
      d="M12 4V12H5"
      stroke=" white"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
</CardDataStats>

<CardDataStats title="End" total={stats.End} rate="0.8%">
<svg className="transition-all duration-300 ease-in-out transform hover:rotate-180" fill="#f00000" width="800px" height="800px" viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg" stroke="#f00000">

<g id="SVGRepo_bgCarrier" stroke-width="0"/>

<g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"/>

<g id="SVGRepo_iconCarrier"> <path d="M797.32 985.882 344.772 1438.43l188.561 188.562 452.549-452.549 452.548 452.549 188.562-188.562-452.549-452.548 452.549-452.549-188.562-188.561L985.882 797.32 533.333 344.772 344.772 533.333z"/> </g>

</svg>
</CardDataStats>

<CardDataStats title="Completed" total={stats.Completed} rate="1.0%">
  <svg
    className="fill-success  transition-all duration-300 ease-in-out transform hover:-rotate-12  "
    width="48"
    height="48"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      fill="fill-success"
    />
    <path
      d="M9 12l2 2l4 -4"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
</CardDataStats>
      </div>
      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        {/* Pie Chart */}
        <div className="col-span-12 md:col-span-6 flex flex-col bg-white p-6 rounded-lg shadow-lg  dark:border-strokedark dark:bg-boxdark">
          <PieChart data={stats} />
        </div>

        {/* Ongoing Work Progress */}
        <div className="col-span-12 md:col-span-6 w-full max-w-4xl mx-auto flex flex-col bg-white p-6 rounded-lg shadow-lg  dark:border-strokedark dark:bg-boxdark">
          <OngoingWorkProgress inProgressData={inProgressData} />
        </div>
      </div>
    </DefaultLayout>
  );
};

export default UserProfile;
