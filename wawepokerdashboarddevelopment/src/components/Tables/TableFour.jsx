import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {  useNavigate } from 'react-router-dom';

const TableOne = () => {
  const [report, setreport] = useState([]); // State to store report array
  const [filteredreport, setFilteredreport] = useState([]); // State to store filtered report array
  const [filterCriteria, setFilterCriteria] = useState(''); // State to store filter criteria
  const [selectedreport, setSelectedreport] = useState([]); // State to store selected report
  const [currentPage, setCurrentPage] = useState(1); // State to store current page
  const [reportPerPage] = useState(10); // State to store number of report per page
  const [filterColumn, setFilterColumn] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const navigate = useNavigate();
  const [queryStatuses, setQueryStatuses] = useState({});
  const secretKey = import.meta.env.VITE_API_KEY;

  useEffect(() => {
    // Fetch all report data from your API
    const fetchreportData = async () => {
      try {
        const response = await axios.get(secretKey+'/admin/retrievereport');
        setreport(response.data); 
      } catch (error) {
        console.error('Error fetching report data:', error);
      }
    };

    fetchreportData();
  }, []);

 useEffect(() => {
     if (!filterColumn || !filterValue) {
      setFilteredreport(report);
     } else {
       const filteredData = report.filter(user =>
         user[filterColumn]?.toString().toLowerCase().includes(filterValue.toLowerCase())
       );
       setFilteredreport(filteredData);
     }
   }, [report, filterColumn, filterValue]);
 
   const handleFilterChange = (event) => {
     setFilterValue(event.target.value);
   };
 
   const handleFilterKeyPress = (event) => {
     if (event.key === 'Enter') {
       setIsFilterOpen(false);
     }
   };
   const columns = ['userId', 'ReportedId','ReportFilter', 'email', 'assignedUser'];
  useEffect(() => {
    const fetchQueryStatuses = async () => {
      try {
        const queryIds = report.map(item => item.id);
        const response = await axios.post(`${secretKey}/admin/reportStatus`, { queryIds: queryIds });
        setQueryStatuses(response.data.reduce((acc, status) => {
          acc[status.reportId] = status.status;
          return acc;
        }, {}));
      } catch (error) {
        console.error('Error fetching query statuses:', error);
      }
    };
    fetchQueryStatuses();
  }, [report]);


  const handleEditClick = reportId => {
    navigate(`/retrievereport/${reportId}`); // Navigate to settings page with report ID
  };
  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-800';
      case 'inProgress': return 'bg-yellow-100 text-yellow-800';
      case 'End': return 'bg-red-100 text-red-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  // Pagination logic
  const indexOfLastreport = currentPage * reportPerPage;
  const indexOfFirstreport = indexOfLastreport - reportPerPage;
  const currentreport = filteredreport.slice(indexOfFirstreport, indexOfLastreport);

  const paginate = pageNumber => setCurrentPage(pageNumber);

  return (
    <div className="rounded-sm border border-stroke bg-white px-4 py-4 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-5 xl:pb-1">
      <h4 className="mb-4 text-xl font-semibold text-black dark:text-white">
        report Information
      </h4>
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
      {/* Filter input */}
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

<div className="overflow-x-auto w-full">
  <div className="min-w-[600px] flex flex-col">
    <div className="grid grid-cols-6 bg-gray-2 dark:bg-meta-4 sm:grid-cols-7">
      <div className="p-2 xl:p-4">
        <h5 className="text-sm font-medium uppercase xsm:text-base">
          User Id
        </h5>
      </div>
      <div className="p-2 xl:p-4">
        <h5 className="text-sm font-medium uppercase xsm:text-base">
          Reported Id
        </h5>
      </div>
      <div className="p-2 xl:p-4">
        <h5 className="text-sm font-medium uppercase xsm:text-base">
          Report Type
        </h5>
      </div>
      <div className="p-2 hidden sm:flex xl:p-4">
        <h5 className="text-sm font-medium uppercase xsm:text-base">
          Email
        </h5>
      </div>
      <div className="p-2 text-center xl:p-4">
        <h5 className="text-sm font-medium uppercase xsm:text-base">
          Assigned User
        </h5>
      </div>
      <div className="p-2 text-center xl:p-4">
        <h5 className="text-sm font-medium uppercase xsm:text-base">
          Status
        </h5>
      </div>
      <div className="p-2 text-center xl:p-4">
        <h5 className="text-sm font-medium uppercase xsm:text-base">
          Actions
        </h5>
      </div>
    </div>

    {/* Render paginated report data */}
    {currentreport.map((report, index) => (
      <div
        key={report.id}
        className={`grid grid-cols-6 sm:grid-cols-7 ${
          index === currentreport.length - 1
            ? ''
            : 'border-b border-stroke dark:border-strokedark'
        } ${selectedreport.includes(report.id) ? 'bg-blue-100' : ''} ${getStatusColor(queryStatuses[report.id])}`}
      >
        <div className="flex items-center p-2 xl:p-4">
          <p className="text-black dark:text-white">{report.userId}</p>
        </div>
        <div className="flex items-center p-2 xl:p-4">
          <p className="text-black dark:text-white">{report.ReportedId}</p>
        </div>
        <div className="flex items-center p-2 xl:p-4">
          <p className="text-black dark:text-white">{report.ReportFilter}</p>
        </div>
        <div className="flex items-center hidden sm:flex p-2 xl:p-4">
          <p className="text-black dark:text-white">
            {report.email?.length > 10 ? `${report.email.substring(0, 10)}...` : report.email || ''}
          </p>
        </div>
        <div className="flex justify-center text-center p-2 xl:p-4">
          <p className="text-black dark:text-white">
            {report.assignedUser ? report.assignedUser : 'Unassigned'}
          </p>
        </div>
        <div className="flex justify-center text-center p-2 xl:p-4">
          <p className="text-black dark:text-white">{queryStatuses[report.id] || 'Unknown'}</p>
        </div>
        <div className="flex items-center justify-center p-2 xl:p-4">
          <button
            className="inline-flex items-center justify-center rounded-md border border-primary py-1 px-2 text-center font-medium dark:text-white text-primary hover:bg-opacity-90 lg:px-2 xl:px-2"
            onClick={() => handleEditClick(report.id)}
          >
            View
          </button>
        </div>
      </div>
    ))}
  </div>
</div>

      {/* Pagination controls */}
      <div className="flex justify-center mt-4">
        {Array.from({ length: Math.ceil(filteredreport.length / reportPerPage) }, (_, i) => (
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

export default TableOne;