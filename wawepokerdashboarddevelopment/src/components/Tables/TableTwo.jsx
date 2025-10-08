import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TableTwo = () => {
  const [queries, setQueries] = useState([]); // State to store queries array
  const [filteredQueries, setFilteredQueries] = useState([]); // State to store filtered queries array
  const [filterCriteria, setFilterCriteria] = useState(''); // State to store filter criteria
  const [selectedQueryDetails, setSelectedQueryDetails] = useState(null); // State for detailed query info
  const [currentPage, setCurrentPage] = useState(1); // State to store current page
  const [queriesPerPage] = useState(10); // State to store number of queries per page
  const [loadingDetails, setLoadingDetails] = useState(false); // State to handle loading query details
  const [queryStatuses, setQueryStatuses] = useState({}); // State to store query statuses
  const [filterColumn, setFilterColumn] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const navigate = useNavigate();
  const secretKey = import.meta.env.VITE_API_KEY;

  // Fetch all queries
  useEffect(() => {
    const fetchQueriesData = async () => {
      try {
        const response = await axios.get(`${secretKey}/admin/retrieveQuery`);
        setQueries(response.data);
      } catch (error) {
        console.error('Error fetching queries data:', error);
      }
    };
    fetchQueriesData();
  }, []);

  // Fetch statuses for each query
  useEffect(() => {
    const fetchQueryStatuses = async () => {
      try {
        const queryIds = queries.map(item => item.id);
        const response = await axios.post(`${secretKey}/admin/queryStatus`, { queryIds: queryIds });
        setQueryStatuses(response.data.reduce((acc, status) => {
          acc[status.QuerytId] = status.status;
          return acc;
        }, {}));
      } catch (error) {
        console.error('Error fetching query statuses:', error);
      }
    };
    fetchQueryStatuses();
  }, [queries]);

  // Filter queries based on criteria
  useEffect(() => {
    if (!filterColumn || !filterValue) {
      setFilteredQueries(queries);
    } else {
      const filteredData = queries.filter(user =>
        user[filterColumn]?.toString().toLowerCase().includes(filterValue.toLowerCase())
      );
      setFilteredQueries(filteredData);
    }
  }, [queries, filterColumn, filterValue]);

  const handleFilterChange = (event) => {
    setFilterValue(event.target.value);
  };

  const handleFilterKeyPress = (event) => {
    if (event.key === 'Enter') {
      setIsFilterOpen(false);
    }
  };
  const columns = ['userId', 'fullname', 'email', 'phone', 'message', 'assignedUser'];

  const handleQueryDetails = async (queryId) => {
    setLoadingDetails(true);
    try {
      navigate(`/messages/${queryId}`);
    } catch (error) {
      console.error('Error fetching query details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const indexOfLastQuery = currentPage * queriesPerPage;
  const indexOfFirstQuery = indexOfLastQuery - queriesPerPage;
  const currentQueries = filteredQueries.slice(indexOfFirstQuery, indexOfLastQuery);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-800';
      case 'inProgress': return 'bg-yellow-100 text-yellow-800';
      case 'End': return 'bg-red-100 text-red-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="rounded-sm border border-stroke bg-white px-4 py-4 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-5 xl:pb-1">
      <h4 className="mb-4 text-xl font-semibold text-black dark:text-white">Query Information</h4>
      <div className="mb-4 flex flex-wrap gap-4">
        <div className="flex items-center">
          <span className="w-4 h-4 bg-blue-100 border border-blue-800 mr-2"></span>
          <span>Open</span>
        </div>
        <div className="flex items-center">
          <span className="w-4 h-4 bg-yellow-100 border border-yellow-800 mr-2"></span>
          <span>In Progress</span>
        </div>
        <div className="flex items-center">
          <span className="w-4 h-4 bg-red-100 border border-red-800 mr-2"></span>
          <span>End </span>
        </div>
        <div className="flex items-center">
          <span className="w-4 h-4 bg-green-100 border border-green-800 mr-2"></span>
          <span>Completed</span>
        </div>
      </div>
      <button
  className="px-5 py-2 mb-4 text-white bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg shadow-md transition-all duration-300 hover:from-blue-600 hover:to-blue-800 focus:ring-2 focus:ring-blue-300"
  onClick={() => setIsFilterOpen(!isFilterOpen)}
>
  Filter
</button>

{isFilterOpen && (
  <div className="mb-4 flex flex-col sm:flex-row items-center bg-gray-100 p-3 rounded-lg shadow">
  <select
    className="w-full sm:w-auto border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-300 focus:outline-none transition-all mb-3 sm:mb-0 sm:mr-3"
    value={filterColumn}
    onChange={(e) => setFilterColumn(e.target.value)}
  >
    <option value="">Select Column</option>
    {columns.map(col => (
      <option key={col} value={col}>
        {col}
      </option>
    ))}
  </select>
  <input
    type="text"
    className="w-full sm:w-auto border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-300 focus:outline-none transition-all"
    placeholder="Enter value"
    value={filterValue}
    onChange={handleFilterChange}
    onKeyPress={handleFilterKeyPress}
  />
</div>
)}

      <div className="flex flex-col overflow-x-auto">
        <div className="grid min-w-[600px] grid-cols-5 sm:grid-cols-7 bg-gray-2 dark:bg-meta-4">
          <div className="p-2 xl:p-4"><h5 className="text-sm font-medium uppercase">User Id</h5></div>
          <div className="p-2 xl:p-4"><h5 className="text-sm font-medium uppercase">Fullname</h5></div>
          <div className="p-2 xl:p-4"><h5 className="text-sm font-medium uppercase">Email</h5></div>
          <div className="p-2 xl:p-4 hidden sm:block"><h5 className="text-sm font-medium uppercase">Phone</h5></div>
          <div className="p-2 xl:p-4 hidden sm:block"><h5 className="text-sm font-medium uppercase">Message</h5></div>
          <div className="p-2 xl:p-4"><h5 className="text-sm font-medium uppercase">Assigned User</h5></div>
          <div className="p-2 xl:p-4"><h5 className="text-sm font-medium uppercase">Status</h5></div>
        </div>

        {currentQueries.map((query) => (
          <div
            key={query.id}
            className={`grid min-w-[600px] grid-cols-5 sm:grid-cols-7 border-b border-stroke dark:border-strokedark cursor-pointer ${getStatusColor(queryStatuses[query.id])}`}
            onClick={() => handleQueryDetails(query.id)}
          >
            <div className="p-2 xl:p-4">{query.userId}</div>
            <div className="p-2 xl:p-4">{query.fullname}</div>
            <div className="p-2 xl:p-4">{query.email?.length > 10 ? `${query.email.substring(0, 10)}...` : query.email || ''}</div>
            <div className="p-2 xl:p-4 hidden sm:block">{query.phone}</div>
            <div className="p-2 xl:p-4 hidden sm:block">{query.message?.length > 10 ? `${query.message.substring(0, 10)}...` : query.message || ''}</div>
            <div className="p-2 xl:p-4">{query.assignedUser || 'Unassigned'}</div>
            <div className="p-2 xl:p-4">{queryStatuses[query.id] || 'Unknown'}</div>
          </div>
        ))}
      </div>
            {/* Pagination controls */}
            <div className="flex justify-center mt-4">
        {Array.from({ length: Math.ceil(filteredQueries.length / queriesPerPage) }, (_, i) => (
          <button
            key={i + 1}
            className={`mx-1 px-3 py-1 rounded-md ${currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => paginate(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
    
  );
};

export default TableTwo;