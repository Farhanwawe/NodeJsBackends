import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const GiftsTable = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filteredEvents, setFilteredEvents] = useState([]); // State to store filtered events array
    const [filterCriteria, setFilterCriteria] = useState(''); // State to store filter criteria
    const [currentPage, setCurrentPage] = useState(1); // State to store current page
    const [eventsPerPage] = useState(10);
    const [filterColumn, setFilterColumn] = useState('');
    const [filterValue, setFilterValue] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const navigate = useNavigate();
    const secretKey = import.meta.env.VITE_API_KEY;
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await axios.get(secretKey+'/admin/getGifts');
                setEvents(response.data);
            } catch (error) {
                setError('Error fetching events');
                console.error('Error fetching events:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    useEffect(() => {
      if (!filterColumn || !filterValue) {
          setFilteredEvents(events);
      } else {
        const filteredData = events.filter(user =>
          user[filterColumn]?.toString().toLowerCase().includes(filterValue.toLowerCase())
        );
        setFilteredEvents(filteredData);
      }
    }, [events, filterColumn, filterValue]);
  
    const handleFilterChange = (event) => {
      setFilterValue(event.target.value);
    };
  
    const handleFilterKeyPress = (event) => {
      if (event.key === 'Enter') {
        setIsFilterOpen(false);
      }
    };
    const columns = ['GiftName', 'GiftPrice', 'Enabled', 'ImageURL'];

    const handleAddEvent = () => {
        navigate('/addGifts');
    };
    const handleEditEvent = (eventId) => {
        navigate(`/Gifts/${eventId}`);
    };
    if (loading) {
        return <div className="text-center py-10">Loading...</div>;
    }

    if (error) {
        return <div className="text-center py-10 text-red-500">{error}</div>;
    }

    const indexOfLastEvent = currentPage * eventsPerPage;
    const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
    const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);

    const paginate = pageNumber => setCurrentPage(pageNumber);

    return (
        <div className="rounded-sm border border-stroke bg-white px-4 py-4 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-5 xl:pb-1">
        <div className="flex justify-between items-center mb-5">
                <h1 className="mb-4 text-xl font-semibold text-black dark:text-white">Gifts</h1>
                <button 
                    onClick={handleAddEvent} 
                    className="bg-green-500 text-white px-4 py-2 rounded"
                >
                    Add Gifts
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
        
          {/* Responsive container with horizontal scroll */}
          <div className="flex flex-col overflow-x-auto">
            <div className="grid min-w-[600px] grid-cols-5 bg-gray-2 dark:bg-meta-4 sm:grid-cols-5">
              <div className="p-2 xl:p-4">
                <h5 className="text-sm font-medium uppercase xsm:text-base">Name</h5>
              </div>
              <div className="p-2 xl:p-4">
                <h5 className="text-sm font-medium uppercase xsm:text-base">Price</h5>
              </div>
              <div className="p-2 xl:p-4">
                <h5 className="text-sm font-medium uppercase xsm:text-base">Enabled</h5>
              </div>
              <div className="p-2 xl:p-4 ">
                <h5 className="text-sm font-medium uppercase xsm:text-base">Image URL</h5>
              </div>
              <div className="p-2 xl:p-4 ">
                <h5 className="text-sm font-medium uppercase xsm:text-base">Actions</h5>
              </div>
            </div>
        
            {/* Render paginated query data */}
            {currentEvents.map((events, index) => (
                <div
                        className={`grid min-w-[600px] grid-cols-5 sm:grid-cols-5 ${
                            index === currentEvents.length - 1 ? '' : 'border-b border-stroke dark:border-strokedark'
                        }`}
                        key={events.GiftId}
                    >
                <div className="flex items-center p-2 xl:p-4">
                  <p className="text-black dark:text-white">{events.GiftName}</p>
                </div>
                <div className="flex items-center p-2 xl:p-4">
                  <p className="text-black dark:text-white">{events.GiftPrice}</p>
                </div>
                <div className="flex items-center p-2 xl:p-4 ">
                <p className="text-meta-3">{events.Enabled?"True":"False"}</p>
                </div>
                <div className="flex items-center p-2 xl:p-4 ">
                  <p className="text-black dark:text-white">
                    {events.ImageURL && events.ImageURL.length > 30
                      ? `${events.ImageURL.substring(0, 30)}...`
                      : events.ImageURL || ''}
                  </p>
                </div>
                <div className="flex items-center p-2 xl:p-4">
                <button
                                className="inline-flex items-center justify-center rounded-md border dark:text-white border-primary py-1 px-2 text-center font-medium text-primary hover:bg-opacity-90 lg:px-2 xl:px-2"
                                onClick={() => handleEditEvent(events.GiftId)}
                            >
                                Edit
                            </button>
                          
                </div>
              </div>
            ))}
          </div>
        
          {/* Pagination controls */}
          <div className="flex justify-center mt-4">
                {Array.from({ length: Math.ceil(filteredEvents.length / eventsPerPage) }, (_, i) => (
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
}

export default GiftsTable;