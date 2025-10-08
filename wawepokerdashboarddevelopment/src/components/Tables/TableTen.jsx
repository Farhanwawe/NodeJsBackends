import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { Link, useNavigate } from 'react-router-dom';
const TableTen = () => {
  const [users, setUsers] = useState([]); // State to store users array
  const [filteredUsers, setFilteredUsers] = useState([]); // State to store filtered users array
  const [filterCriteria, setFilterCriteria] = useState(''); // State to store filter criteria
  const [selectedUsers, setSelectedUsers] = useState([]); // State to store selected users
  const [currentPage, setCurrentPage] = useState(1); // State to store current page
  const [usersPerPage] = useState(10); // State to store number of users per page
  const [filterColumn, setFilterColumn] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const navigate = useNavigate();
  const secretKey = import.meta.env.VITE_API_KEY;

  useEffect(() => {
    // Fetch all users data from your API
    const fetchUsersData = async () => {
      try {
        const response = await axios.get(secretKey+'/admin/getInapp'); // Adjust endpoint as needed
        setUsers(response.data); // Assuming response.data is an array of users
      } catch (error) {
        console.error('Error fetching getInapp data:', error);
      }
    };

    fetchUsersData();
  }, []);

   useEffect(() => {
     if (!filterColumn || !filterValue) {
       setFilteredUsers(users);
     } else {
       const filteredData = users.filter(user =>
         user[filterColumn]?.toString().toLowerCase().includes(filterValue.toLowerCase())
       );
       setFilteredUsers(filteredData);
     }
   }, [users, filterColumn, filterValue]);
 
   const handleFilterChange = (event) => {
     setFilterValue(event.target.value);
   };
 
   const handleFilterKeyPress = (event) => {
     if (event.key === 'Enter') {
       setIsFilterOpen(false);
     }
   };
   const columns = ['productname', 'product_ID', 'productPrice', 'chips', 'spinner'];
  const encryptData = (data) => {
    const secretKey = import.meta.env.VITE_SECRET_KEY; // Updated

    // Log the secret key for debugging purposes

    // Check if the secret key is available
    if (!secretKey) {
      console.error('Secret key is missing or undefined');
      alert('Error: Secret key is not set. Please check your configuration.');
      return null; // Return null or handle the error appropriately
    }

    const ciphertext = CryptoJS.AES.encrypt(data.toString(), secretKey).toString();
    return ciphertext;
  };

  const handleEditClick = (userId) => {
    const encryptedUserId = encryptData(userId);  // Encrypt the userId
    navigate(`/In-AppSettings/${encodeURIComponent(encryptedUserId)}`);  // Navigate with encrypted userId
  };
  const handleAddClick = () => {
  // Encrypt the userId
    navigate(`/addInAppProducts/`);  // Navigate with encrypted userId
  };

  const handleDeleteClick = async userId => {
    try {
      const response = await axios.put(secretKey+`/admin/dropuser/${userId}`);
      if (response.status === 200) {
        // Remove the user from the state
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        setFilteredUsers(prevFilteredUsers => prevFilteredUsers.filter(user => user.id !== userId));
        alert(response.data.message);
      } else {
        alert('Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const paginate = pageNumber => setCurrentPage(pageNumber);

  return (
<div className="rounded-sm border border-stroke bg-white px-4 py-4 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-5 xl:pb-1">
<div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-5">
  <h1 className="text-xl font-semibold text-black dark:text-white">
    In App Purchases
  </h1>
  <div className="flex gap-2">
    <button
    onClick = {handleAddClick}
      className="bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-2 rounded transition duration-300"
    >
      Add New
    </button>

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

  {/* User Data Table */}
  <div className="overflow-x-auto">
    <div className="flex flex-col min-w-[600px]">
      <div className="grid grid-cols-6 bg-gray-2 dark:bg-meta-4 sm:grid-cols-6">
        <div className="p-2 xl:p-4">
          <h5 className="text-sm font-medium uppercase xsm:text-base">
            Product Name
          </h5>
        </div>
        <div className="p-2 xl:p-4 hidden sm:block">
          <h5 className="text-sm font-medium uppercase xsm:text-base">
            Product ID
          </h5>
        </div>
        <div className="p-2 text-center xl:p-4">
          <h5 className="text-sm font-medium uppercase xsm:text-base">
           Product Price
          </h5>
        </div>
        {/* Money column hidden on mobile */}
        <div className="p-2 text-center xl:p-4 ">
          <h5 className="text-sm font-medium uppercase xsm:text-base">
            Chips
          </h5>
        </div>
        <div className="p-2 text-center xl:p-4">
          <h5 className="text-sm font-medium uppercase xsm:text-base">
            Spinners
          </h5>
        </div>
        <div className="p-2 text-center xl:p-4">
          <h5 className="text-sm font-medium uppercase xsm:text-base">
            Actions
          </h5>
        </div>
      </div>

      {/* Render paginated user data */}
      {currentUsers.map((user, index) => (
        <div
          className={`grid grid-cols-6 sm:grid-cols-6 ${
            index === currentUsers.length - 1 ? '' : 'border-b border-stroke dark:border-strokedark'
          } ${selectedUsers.includes(user.id) ? 'bg-blue-100' : ''}`}
          key={user.id}
        >
          <div className="flex items-center p-2 xl:p-4">
            <p className="text-black dark:text-white">{user.productname}</p>
          </div>
          <div className="flex items-center p-2 xl:p-4 hidden sm:block">
            <p className="text-black dark:text-white">
            {user.product_ID && user.product_ID.length > 30
              ? `${user.product_ID.substring(0, 30)}...`
              : user.product_ID || ''}
            </p>
          </div>
          <div className="flex items-center justify-center p-2 xl:p-4">
            <p className="text-black dark:text-white">{user.productPrice}</p>
          </div>
          {/* Money column hidden on mobile */}
          <div className="flex items-center justify-center p-2 xl:p-4">
            <p className="text-meta-3">${user.chips}</p>
          </div>
          <div className="flex items-center justify-center p-2 xl:p-4">
            <p className="text-meta-3">{user.spinner}</p>
          </div>
          <div className="flex items-center justify-center p-2 xl:p-4">
            <button
              className="inline-flex items-center justify-center rounded-md border dark:text-white border-primary py-1 px-2 text-center font-medium text-primary hover:bg-opacity-90 lg:px-2 xl:px-2"
              onClick={() => handleEditClick(user.id)}
            >
              Edit
            </button>
            <button
              className="inline-flex items-center justify-center rounded-md border dark:text-white border-primary py-1 px-2 text-center font-medium text-primary hover:bg-opacity-90 lg:px-2 xl:px-2 ml-2"
              onClick={() => handleDeleteClick(user.id)}
            >
              Delete
            </button>
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