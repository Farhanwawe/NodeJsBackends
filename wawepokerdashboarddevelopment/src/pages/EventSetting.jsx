import React, { useState, useEffect } from 'react';
import { useParams,useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import DefaultLayout from '../layout/DefaultLayout';
import axios from 'axios';

const EventSettings = () => {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [name, setName] = useState('');
    const [currency, setCurrency] = useState('');
    const navigate = useNavigate();
    const secretKey = import.meta.env.VITE_API_KEY;
  useEffect(() => {
    const fetchEvent = async () => {
        try {
            const response = await axios.get(secretKey+`/admin/getEvent/${id}`);
            setEvent(response.data);
            setName(response.data.name);
            setCurrency(response.data.currency);
        } catch (error) {
            console.error('Error fetching event:', error);
        }
    };

    if (id) {
      fetchEvent();
    }
  }, [id]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        await axios.put(secretKey+`/admin/updateEvent/${id}`, {
            name,
            currency
        });
        alert('Event updated successfully!');
        navigate('/');
    } catch (error) {
        console.error('Error updating event:', error);
    }
  };
 
  if (!event) {
    return <div>Loading...</div>;
}

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-270">
        <Breadcrumb pageName="Events" />

        <div className="flex flex-1 flex-col justify-center gap-8">
          <div className="col-span-3 xl:col-span-3">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Events
                </h3>
              </div>
              <div className="p-7">
                <form onSubmit={handleSubmit}>
                  <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                    <div className="w-full sm:w-1/2">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="name">
                        Event Name
                      </label>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="text"
                        name="name"
                        id="name"
                        placeholder="Event Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    <div className="w-full sm:w-1/2">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="currency">
                        Currency
                      </label>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="text"
                        name="currency"
                        id="currency"
                        placeholder="currency"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                      />
                    </div>
                  </div>
    
                  <div className="flex justify-end gap-4.5">
                    <button
                      className="flex justify-center rounded border border-stroke py-2 px-6 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                      type="button" // Use type="button" to prevent form submission
                      onClick={() => window.history.back()} // Navigate back on cancel
                    >
                      Cancel
                    </button>
                    <button
                      className="flex justify-center rounded bg-primary py-2 px-6 font-medium text-gray hover:bg-opacity-90"
                      type="submit" // Adjust type as needed
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default EventSettings;