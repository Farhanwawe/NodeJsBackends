import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PopUpsTable = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [filterCriteria, setFilterCriteria] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(10);
  const [activeSection, setActiveSection] = useState('noTimer'); // "noTimer" or "withTimer"
  const navigate = useNavigate();
  const secretKey = import.meta.env.VITE_API_KEY;

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get(secretKey + '/admin/getPopups');
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
    const applyFilter = () => {
      let filteredData = events;

      if (filterCriteria) {
        const criteria = filterCriteria.toLowerCase();
        const isBooleanCriteria = criteria === 'true' || criteria === 'false';
        const isActive = criteria === 'true';

        filteredData = events.filter(
          (event) =>
            event.name?.toLowerCase().includes(criteria) ||
            event.Rewards?.toString().includes(criteria) ||
            event.DontReward?.toString().includes(criteria) ||
            (isBooleanCriteria && event.isVisible === isActive),
        );
      }

      if (activeSection === 'noTimer') {
        filteredData = filteredData.filter(
          (event) => !event.startTime || !event.endTime,
        );
      } else if (activeSection === 'withTimer') {
        filteredData = filteredData.filter(
          (event) => event.startTime && event.endTime,
        );
      }

      setFilteredEvents(filteredData);
    };

    applyFilter();
  }, [events, filterCriteria, activeSection]);

  const handleFilterChange = (event) => {
    setFilterCriteria(event.target.value);
  };

  const handleAddEvent = () => {
    navigate('/addPopups');
  };
  const handlesequence = () => {
    navigate('/PopUpsSequence');
  };

  const handleEditEvent = (eventId) => {
    navigate(`/Popups/${eventId}`);
  };

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = filteredEvents.slice(
    indexOfFirstEvent,
    indexOfLastEvent,
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="rounded-sm border border-stroke bg-white px-4 py-4 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-5 xl:pb-1">
<div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-5">
  <h1 className="text-xl font-semibold text-black dark:text-white">
    PopUps
  </h1>
  <div className="flex gap-2">
    <button
      onClick={handleAddEvent}
      className="bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-2 rounded transition duration-300"
    >
      Add PopUps
    </button>
    <button
      onClick={handlesequence}
      className="bg-cyan-400 hover:bg-cyan-500 text-white font-medium px-4 py-2 rounded transition duration-300"
    >
      Set Sequence
    </button>
  </div>
</div>

      {/* Section Toggle Buttons */}
      <div className="flex justify-center gap-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${
            activeSection === 'noTimer'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200'
          }`}
          onClick={() => setActiveSection('noTimer')}
        >
          No Timer
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeSection === 'withTimer'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200'
          }`}
          onClick={() => setActiveSection('withTimer')}
        >
          With Timer
        </button>
      </div>

      {/* Filter input */}
      <input
        type="text"
        className="rounded-sm border border-stroke px-3 py-2 mb-4 w-full max-w-xs sm:max-w-sm dark:border-strokedark dark:bg-meta-4"
        placeholder="Filter Popups..."
        value={filterCriteria}
        onChange={handleFilterChange}
      />

      {/* Responsive container with horizontal scroll */}
      <div className="flex flex-col overflow-x-auto">
        <div  className={`grid min-w-[600px] ${
      activeSection === 'noTimer' ? 'grid-cols-5' : 'grid-cols-4'
    } bg-gray-2 dark:bg-meta-4`}>
          <div className="p-2 xl:p-4">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              Name
            </h5>
          </div>
          {activeSection === 'noTimer' && (
          <>  
          
          <div className="p-2 xl:p-4">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              Rewards
            </h5>
          </div>
          <div className="p-2 xl:p-4">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              DontReward
            </h5>
          </div>
          <div className="p-2 xl:p-4">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              Visibility
            </h5>
          </div>
          </>
          )}
          {activeSection === 'withTimer' && (
            <>
          <div className="p-2 xl:p-4">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              Start Time
            </h5>
          </div>
          <div className="p-2 xl:p-4">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              End Time
            </h5>
          </div>
            </>
          )}
          <div className="p-2 xl:p-4">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              Action
            </h5>
          </div>
        </div>

        {/* Display filtered events */}
        {currentEvents.map((event) => (
          <div
            key={event.index}
            className={`grid min-w-[600px] ${
      activeSection === 'noTimer' ? 'grid-cols-5' : 'grid-cols-4'
    } bg-gray-2 dark:bg-meta-4`}
          >
            <div className="p-2 xl:p-4">{event.name}</div>
            {activeSection === 'noTimer' && (
              <>              
            <div className="p-2 xl:p-4">{event.Rewards || 0}</div>
            <div className="p-2 xl:p-4">{event.DontReward || 0}</div>
            <div className="p-2 xl:p-4">
              {event.isVisible || event.isActive ? 'Visible' : 'Hidden'}
            </div>
              </>
            )}
            {activeSection === 'withTimer' && (
              <>
            <div className="p-2 xl:p-4">
              {event.startTime
                ? new Date(event.startTime).toLocaleString()
                : '-'}
            </div>
            <div className="p-2 xl:p-4">
              {event.endTime ? new Date(event.endTime).toLocaleString() : '-'}
            </div>
              </>
            )}
            <div className="p-2 xl:p-4">
              <button
                className="inline-flex items-center justify-center rounded-md border border-primary py-1 px-2 text-center font-medium dark:text-white text-primary hover:bg-opacity-90 lg:px-2 xl:px-2"
                onClick={() => handleEditEvent(event.name)}
              >
                View
              </button>
            </div>
          </div>
        ))}

        {/* Pagination */}
        <div className="flex justify-center mt-4">
          {Array.from(
            { length: Math.ceil(filteredEvents.length / eventsPerPage) },
            (_, i) => (
              <button
                key={i + 1}
                className={`mx-1 px-3 py-1 rounded-md ${
                  currentPage === i + 1
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200'
                }`}
                onClick={() => paginate(i + 1)}
              >
                {i + 1}
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  );
};

export default PopUpsTable;
