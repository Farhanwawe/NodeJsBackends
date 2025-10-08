import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const OngoingWorkProgress = ({ inProgressData }) => {
  const [userDetails, setUserDetails] = useState({});
  const [labeledData, setLabeledData] = useState([]);
  const secretKey = import.meta.env.VITE_API_KEY;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserDetails = async (userId) => {
      try {
        const response = await fetch(secretKey + `/admin/users/${userId}`);
        const data = await response.json();
        setUserDetails((prev) => ({ ...prev, [userId]: data }));
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    // Label data and fetch user details
    const processInProgressData = () => {
      const labeled = inProgressData.map((item) => {
        const lowerMessage = item.message.toLowerCase();
        const label =
          lowerMessage.includes('query') ||
          lowerMessage.includes('question') ||
          lowerMessage.includes('help')
            ? 'query'
            : lowerMessage.includes('report') ||
              lowerMessage.includes('issue') ||
              lowerMessage.includes('bug')
            ? 'report'
            : 'query'; // Default to 'query'

        // Fetch user details for each userId
        if (!userDetails[item.userId]) {
          fetchUserDetails(item.userId);
        }

        return { ...item, label };
      });

      setLabeledData(labeled);
    };

    processInProgressData();
  }, [inProgressData, userDetails]);

  const handleRedirect = (item) => {
    if (item.label === 'query') {
      navigate(`/messages/${item.id}`);
    } else if (item.label === 'report') {
      navigate(`/retrievereport/${item.id}`);
    }
  };

  return (
    <div className="p-6 w-full">
      <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Ongoing Activity
      </h3>

      {labeledData.length > 0 ? (
        <div className="overflow-y-auto max-h-96 w-full scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-strokedark dark:scrollbar-track-boxdark">
          <ul className="space-y-4 pr-2">
            {labeledData.map((item) => (
              <li
                key={item.id}
                className="p-4 rounded-lg bg-gradient-to-r dark:from-boxdark dark:via-boxdark-2 dark:to-strokedark shadow-md hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 cursor-pointer"
                onClick={() => handleRedirect(item)}
              >
                <div className="flex items-center space-x-4 overflow-hidden">
                  {/* Profile Image */}
                  <img
                    src={
                      userDetails[item.userId]?.profileImageLink ||
                      '/default-profile.png'
                    }
                    alt="User Profile"
                    className="w-10 h-10 rounded-full border-2 border-gray-300 dark:border-strokedark"
                  />
                  {/* User Details */}
                  <div className="flex flex-col space-y-1 overflow-hidden">
                    <p className="text-gray-900 dark:text-white font-medium text-lg truncate">
                      <strong className="text-blue-600 dark:text-meta-5">
                        {userDetails[item.userId]?.name || 'Unknown User'}
                      </strong>
                    </p>
                    <p className="text-gray-800 dark:text-gray-300 truncate">
                      {item.message}
                    </p>
                    {/* Label */}
                    <span
                      className={`text-sm font-semibold ${
                        item.label === 'query'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {item.label === 'query' ? 'Query' : 'Report'}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">No ongoing activity.</p>
      )}
    </div>
  );
};

export default OngoingWorkProgress;