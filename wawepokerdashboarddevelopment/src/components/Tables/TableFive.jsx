import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const GameTable = () => {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filteredtable, setfilteredtable] = useState([]); // State to store filtered users array
    const [filterCriteria, setFilterCriteria] = useState(''); // State to store filter criteria
    const [currentPage, setCurrentPage] = useState(1); // State to store current page
    const [tablePerPage] = useState(10);
    const [filterColumn, setFilterColumn] = useState('');
    const [filterValue, setFilterValue] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const history = useNavigate();
    const secretKey = import.meta.env.VITE_API_KEY;
  
    useEffect(() => {
      const fetchTables = async () => {
        try {
          const response = await axios.get(secretKey+'/admin/getTables');
          setTables(response.data);
        } catch (error) {
          setError('Error fetching tables');
          console.error('Error fetching tables:', error);
        } finally {
          setLoading(false);
        }
      };
  
      fetchTables();
    }, []);
    useEffect(() => {
        if (!filterColumn || !filterValue) {
          setfilteredtable(tables);
        } else {
          const filteredData = tables.filter(user =>
            user[filterColumn]?.toString().toLowerCase().includes(filterValue.toLowerCase())
          );
          setfilteredtable(filteredData);
        }
      }, [tables, filterColumn, filterValue]);
    
      const handleFilterChange = (event) => {
        setFilterValue(event.target.value);
      };
    
      const handleFilterKeyPress = (event) => {
        if (event.key === 'Enter') {
          setIsFilterOpen(false);
        }
      };
      const columns = ['typeName', 'buyIn','max_seats', 'minBet', 'type','sequence','display'];
    const handleAddTable = () => {
        history('/addtable');
      };
  
    if (loading) {
      return <div className="text-center py-10">Loading...</div>;
    }
  
    if (error) {
      return <div className="text-center py-10 text-red-500">{error}</div>;
    }
    const indexOfLasttable = currentPage * tablePerPage;
    const indexOfFirstreport = indexOfLasttable - tablePerPage;
    const currenttable = filteredtable.slice(indexOfFirstreport, indexOfLasttable);
  
    const paginate = pageNumber => setCurrentPage(pageNumber);
    return (
        <div className="rounded-sm border border-stroke bg-white px-4 py-4 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-5 xl:pb-1">
       <div className="flex justify-between items-center mb-5">
        <h1 className="mb-4 text-xl font-semibold text-black dark:text-white">Tables</h1>
        <button 
          onClick={handleAddTable} 
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Add Table
        </button>
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
  <div className="min-w-[800px]">
    <div className="flex flex-col">
      <div className="grid grid-cols-8 bg-gray-2 dark:bg-meta-4 sm:grid-cols-8">
        <div className="p-2 xl:p-4">
          <h5 className="text-sm font-medium uppercase xsm:text-base">
            Name Type
          </h5>
        </div>
        <div className="p-2 xl:p-4">
          <h5 className="text-sm font-medium uppercase xsm:text-base">
            Buy In
          </h5>
        </div>
        <div className="p-2 text-center xl:p-4">
          <h5 className="text-sm font-medium uppercase xsm:text-base">
            Max Seats
          </h5>
        </div>
        <div className="p-2 text-center xl:p-4">
          <h5 className="text-sm font-medium uppercase xsm:text-base">
            Minimum Bet
          </h5>
        </div>
        <div className="p-2 text-center xl:p-4">
          <h5 className="text-sm font-medium uppercase xsm:text-base">
            Table Type
          </h5>
        </div>
        <div className="p-2 text-center xl:p-4">
          <h5 className="text-sm font-medium uppercase xsm:text-base">
            Sequence
          </h5>
        </div>
        <div className="p-2 text-center xl:p-4">
          <h5 className="text-sm font-medium uppercase xsm:text-base">
            Display
          </h5>
        </div>
        <div className="p-2 text-center xl:p-4">
          <h5 className="text-sm font-medium uppercase xsm:text-base">
            Actions
          </h5>
        </div>
      </div>

      {/* Render paginated table data */}
      {currenttable.map((table, index) => (
        <div
          key={table.id}
          className={`grid grid-cols-8 sm:grid-cols-8 ${
            index === currenttable.length - 1
              ? ''
              : 'border-b border-stroke dark:border-strokedark'
          }`}
        >
          <div className="flex items-center p-2 xl:p-4">
            <p className="text-black dark:text-white">{table.typeName}</p>
          </div>
          <div className="flex items-center p-2 xl:p-4">
            <p className="text-black dark:text-white">{table.buyIn}</p>
          </div>
          <div className="flex items-center justify-center p-2 xl:p-4">
            <p className="text-black dark:text-white">{table.max_seats}</p>
          </div>
          <div className="flex items-center justify-center p-2 xl:p-4">
            <p className="text-meta-3">{table.minBet}</p>
          </div>
          <div className="flex items-center justify-center p-2 xl:p-4">
            <p className="text-meta-3">{table.type}</p>
          </div>
          <div className="flex items-center justify-center p-2 xl:p-4">
            <p className="text-meta-3">{table.sequence}</p>
          </div>
          <div className="flex items-center justify-center p-2 xl:p-4">
            <p className="text-meta-3">{table.display ? "True" : "False"}</p>
          </div>
          <div className="flex items-center justify-center p-2 xl:p-4">
            <button
              className="inline-flex items-center justify-center rounded-md border dark:text-white border-primary py-1 px-2 text-center font-medium text-primary hover:bg-opacity-90 lg:px-2 xl:px-2"
            >
              Edit
            </button>
            <button
              className="inline-flex items-center justify-center rounded-md border dark:text-white border-primary py-1 px-2 text-center font-medium text-primary hover:bg-opacity-90 lg:px-2 xl:px-2 ml-2"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
</div>
  
        {/* Pagination controls */}
        <div className="flex justify-center mt-4">
          {Array.from({ length: Math.ceil(filteredtable.length / tablePerPage) }, (_, i) => (
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
     
 
    );}

export default GameTable;