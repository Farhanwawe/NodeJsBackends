import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { useParams, useNavigate } from 'react-router-dom';

const TableTen = () => {
  const { id } = useParams();
  const [users, setUsers] = useState([]); // All users data
  const [filteredUsers, setFilteredUsers] = useState([]); // Users after applying filters
  const [filterCriteria, setFilterCriteria] = useState(''); // Text search filter
  const [selectedColumn, setSelectedColumn] = useState('all'); // Column to search on ('all', 'userId', 'productName', etc.)
  const [selectedUsers, setSelectedUsers] = useState([]); // For any row selection (if needed)
  const [currentPage, setCurrentPage] = useState(1); // Current page for pagination
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [usersPerPage] = useState(10); // Users per page

  // New states for date filtering:
  // dateFilter options: 'all', 'lastWeek', 'lastMonth', 'custom'
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const navigate = useNavigate();
  const secretKey = import.meta.env.VITE_API_KEY;

  const decryptUserId = (encryptedId) => {
    try {
      const secretKey = import.meta.env.VITE_SECRET_KEY;
      const bytes = CryptoJS.AES.decrypt(encryptedId, secretKey);
      const decryptedId = bytes.toString(CryptoJS.enc.Utf8);
      return decryptedId;
    } catch (error) {
      console.error('Error decrypting userId:', error);
      return null;
    }
  };

  useEffect(() => {
    // Fetch all users data from your API
    const fetchUsersData = async () => {
      try {
        const decryptedId = decryptUserId(id);
        const response = await axios.get(`${secretKey}/admin/inapp-purchases/${decryptedId}`);
        setUsers(response.data.mergedData); // Assuming response.data.mergedData is an array of users
      } catch (error) {
        console.error('Error fetching in-app purchase data:', error);
      }
    };

    fetchUsersData();
  }, [id, secretKey]);

  // Combined filtering: text search (using the selected column) and date range
  useEffect(() => {
    const applyFilter = () => {
      let filteredData = [...users];

      // --- Apply text-based filter using the selected column ---
      if (filterCriteria) {
       if (selectedColumn === 'userId') {
          filteredData = filteredData.filter(user =>
            user.userId && user.userId.toString().includes(filterCriteria)
          );
        } else if (selectedColumn === 'productName') {
          filteredData = filteredData.filter(user =>
            user.product &&
            user.product.productname &&
            user.product.productname.toLowerCase().includes(filterCriteria.toLowerCase())
          );
        }  else if (selectedColumn === 'productPrice') {
          filteredData = filteredData.filter(user =>
            user.productPrice && user.productPrice.toString().includes(filterCriteria)
          );
        } else if (selectedColumn === 'purchaseDate') {
          filteredData = filteredData.filter(user =>
            user.createdAt &&
            new Date(user.createdAt)
              .toLocaleString()
              .toLowerCase()
              .includes(filterCriteria.toLowerCase())
          );
        }
      }

      // --- Apply date filter ---
      if (dateFilter !== 'all') {
        const now = new Date();
        if (dateFilter === 'lastWeek') {
          const lastWeek = new Date();
          lastWeek.setDate(now.getDate() - 7);
          filteredData = filteredData.filter(user => new Date(user.createdAt) >= lastWeek);
        } else if (dateFilter === 'lastMonth') {
          const lastMonth = new Date();
          lastMonth.setMonth(now.getMonth() - 1);
          filteredData = filteredData.filter(user => new Date(user.createdAt) >= lastMonth);
        } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
          const start = new Date(customStartDate);
          const end = new Date(customEndDate);
          // Ensure the entire end day is included
          end.setHours(23, 59, 59, 999);
          filteredData = filteredData.filter(user => {
            const purchaseDate = new Date(user.createdAt);
            return purchaseDate >= start && purchaseDate <= end;
          });
        }
      }
      setFilteredUsers(filteredData);
      setCurrentPage(1); // Reset pagination when filters change
    };

    applyFilter();
  }, [users, filterCriteria, selectedColumn, dateFilter, customStartDate, customEndDate]);

  const handleFilterChange = event => {
    setFilterCriteria(event.target.value);
  };

  const handleColumnChange = event => {
    setSelectedColumn(event.target.value);
  };

  const handleDateFilterChange = (event) => {
    setDateFilter(event.target.value);
    // Reset custom dates if the user changes the filter type
    if (event.target.value !== 'custom') {
      setCustomStartDate('');
      setCustomEndDate('');
    }
  };

  const handleCustomStartDateChange = (event) => {
    setCustomStartDate(event.target.value);
  };
  const handleFilterKeyPress = (event) => {
    if (event.key === 'Enter') {
      setIsFilterOpen(false);
    }
  };
  const handleCustomEndDateChange = (event) => {
    setCustomEndDate(event.target.value);
  };

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const paginate = pageNumber => setCurrentPage(pageNumber);

  // Calculate product price sums:
  const totalPriceSum = users.reduce(
    (acc, user) => acc + Number(user.productPrice || 0),
    0
  );
  const filteredPriceSum = filteredUsers.reduce(
    (acc, user) => acc + Number(user.productPrice || 0),
    0
  );

  return (
    <div className="rounded-sm border border-stroke bg-white px-4 py-4 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-5 xl:pb-1">
      {/* Header, Date Filter Controls and Column Filter */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-5">
        <h1 className="text-xl font-semibold text-black dark:text-white">
          In App Purchases
        </h1>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center">
            <label htmlFor="dateFilter" className="mr-2">Date Filter:</label>
            <select
              id="dateFilter"
              className="rounded-sm border border-stroke px-3 py-2 dark:border-strokedark dark:bg-meta-4"
              value={dateFilter}
              onChange={handleDateFilterChange}
            >
              <option value="all">All</option>
              <option value="lastWeek">Last Week</option>
              <option value="lastMonth">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          {dateFilter === 'custom' && (
            <div className="flex gap-2">
              <input
                type="date"
                className="rounded-sm border border-stroke px-3 py-2 dark:border-strokedark dark:bg-meta-4"
                value={customStartDate}
                onChange={handleCustomStartDateChange}
              />
              <input
                type="date"
                className="rounded-sm border border-stroke px-3 py-2 dark:border-strokedark dark:bg-meta-4"
                value={customEndDate}
                onChange={handleCustomEndDateChange}
              />
            </div>
          )}
        </div>
      </div>

      {/* Column Filter and Text Filter */}
      <button
  className="px-5 py-2 mb-4 text-white bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg shadow-md transition-all duration-300 hover:from-blue-600 hover:to-blue-800 focus:ring-2 focus:ring-blue-300"
  onClick={() => setIsFilterOpen(!isFilterOpen)}
>
  Filter
</button>
{isFilterOpen && (
      <div className="mb-4 flex flex-col sm:flex-row items-center bg-gray-100 p-3 rounded-lg shadow">
        <select
          value={selectedColumn}
          onChange={handleColumnChange}
          className="w-full sm:w-auto border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-300 focus:outline-none transition-all mb-3 sm:mb-0 sm:mr-3"
        >
         <option value="">Select Column</option>
          <option value="userId">UserID</option>
          <option value="productName">Product Name</option>
          <option value="productPrice">Product Price</option>
          <option value="purchaseDate">Purchase Date</option>
        </select>
        <input
          type="text"
          className="w-full sm:w-auto border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-300 focus:outline-none transition-all"
          placeholder="Enter value"
          value={filterCriteria}
          onChange={handleFilterChange}
          onKeyPress={handleFilterKeyPress}
        />
      </div>
    )}
      {/* Price Sum Displays */}
      <div className="mb-4 p-4 bg-gray-100">
  <p className="text-lg font-semibold text-gray-700">
    🛒 Total Product Price: 
    <span className="text-blue-600"> ${totalPriceSum.toFixed(2)}</span>
  </p>
  <p className="text-lg font-semibold text-gray-700">
    🔍 Filtered Product Price: 
    <span className="text-green-600"> ${filteredPriceSum.toFixed(2)}</span>
  </p>
</div>

      {/* User Data Table */}
      <div className="overflow-x-auto w-full">
  <div className="min-w-[600px]">
    <div className="grid grid-cols-4 sm:grid-cols-4  bg-gray-2 dark:bg-meta-4">
      <div className="p-2 xl:p-4">
        <h5 className="text-xs sm:text-sm font-medium uppercase">UserID</h5>
      </div>
      <div className="p-2 xl:p-4">
        <h5 className="text-xs sm:text-sm font-medium uppercase">productName</h5>
      </div>
      <div className=" p-2 xl:p-4">
        <h5 className="text-xs sm:text-sm font-medium uppercase">productPrice</h5>
      </div>
      <div className="p-2 xl:p-4">
        <h5 className="text-xs sm:text-sm font-medium uppercase">purchaseDate</h5>
      </div>
    </div>

    {/* Render paginated user data */}
    {currentUsers.map((user, index) => (
      <div
        key={user.id}
        className={`grid grid-cols-4 sm:grid-cols-4 min-w-[600px] ${
          index === currentUsers.length - 1
            ? ''
            : 'border-b border-stroke dark:border-strokedark'
        } ${selectedUsers.includes(user.id) ? 'bg-blue-100' : ''}`}
      >
        <div className="p-2 xl:p-4">
          <p className="text-black dark:text-white">{user.userId}</p>
        </div>
        <div className="p-2 xl:p-4">
          <p className="text-black dark:text-white">
            {user.product && user.product.productname}
          </p>
        </div>
        <div className=" p-2 xl:p-4">
          <p className="text-meta-3">${user.productPrice}</p>
        </div>
        <div className="p-2 xl:p-4">
          <p className="text-black">{new Date(user.createdAt).toLocaleString()}</p>
        </div>
      </div>
    ))}
  </div>
</div>

      {/* Pagination controls */}
      <div className="flex justify-center mt-4">
        {Array.from({ length: Math.ceil(filteredUsers.length / usersPerPage) }, (_, i) => (
          <button
            key={i + 1}
            className={`mx-1 px-3 py-1 rounded-md ${
              currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
            onClick={() => paginate(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TableTen;
