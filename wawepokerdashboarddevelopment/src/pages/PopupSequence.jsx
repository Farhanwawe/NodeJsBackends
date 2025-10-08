import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DefaultLayout from '../layout/DefaultLayout';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';

const PopupManager = () => {
  const [popups, setPopups] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const secretKey = import.meta.env.VITE_API_KEY;

  useEffect(() => {
    // Fetch popups from API
    const fetchPopups = async () => {
      try {
        const response = await axios.get(secretKey + '/admin/GetPopupsSequence');
        setPopups(response.data.sort((a, b) => a.Priorty - b.Priorty)); // Sort by ascending priority
      } catch (error) {
        console.error('Error fetching popups:', error.message);
      }
    };

    fetchPopups();
  }, []);

  // Handle priority change
  const handlePriorityChange = (currentIndex, newPriority) => {
    const updatedPopups = [...popups];
    const currentPopup = updatedPopups[currentIndex];
    
    // Find the popup with the selected priority
    const targetIndex = updatedPopups.findIndex(popup => popup.Priorty === Number(newPriority));

    if (targetIndex !== -1) {
      // Swap priorities
      [updatedPopups[currentIndex].Priorty, updatedPopups[targetIndex].Priorty] = 
        [updatedPopups[targetIndex].Priorty, updatedPopups[currentIndex].Priorty];
      
      // Sort the array based on the new priority order
      updatedPopups.sort((a, b) => a.Priorty - b.Priorty);
    }

    setPopups(updatedPopups);
  };

  // Save updated priorities
  const handleSave = async () => {
    setIsSaving(true);

    try {
      await axios.post(secretKey + '/admin/updatePopupsSequence', { popups });
      alert('Priorities updated successfully!');
    } catch (error) {
      console.error('Error saving priorities:', error.message);
      alert('Failed to update priorities. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DefaultLayout>
      <Breadcrumb pageName="PopUps Sequence" />
      <div className="flex flex-col p-6 bg-gray-100 rounded-lg shadow-md max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Manage Popups</h1>
        
        {popups.length > 0 ? (
          <ul className="space-y-4">
            {popups.map((popup, index) => (
              <li
                key={popup.Priorty}
                className="flex items-center justify-between p-4 bg-white border dark:bg-graydark dark:text-white border-gray-300 rounded-lg shadow"
              >
                <span className="text-lg text-gray-700 font-medium">
                  {popup.name}
                </span>
                <div className="flex items-center">
                  <label className="mr-2 text-sm text-gray-600">Priority:</label>
                  <select
                    value={popup.Priorty}
                    onChange={(e) => handlePriorityChange(index, e.target.value)}
                    className="border dark:bg-graydark border-gray-300 rounded-md p-1"
                  >
                    {popups.map((_, idx) => (
                      <option key={idx} value={idx + 1}>
                        {idx + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No popups available.</p>
        )}

        <button
          onClick={handleSave}
          className={`mt-6 px-6 py-3 font-semibold text-white rounded-md ${
            isSaving ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Priorities'}
        </button>
      </div>
    </DefaultLayout>
  );
};

export default PopupManager;
