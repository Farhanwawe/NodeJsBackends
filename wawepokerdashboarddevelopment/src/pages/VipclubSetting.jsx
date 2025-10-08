import React, { useState, useEffect } from 'react';
import { useParams,useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import DefaultLayout from '../layout/DefaultLayout';
import axios from 'axios';

const EventSettings = () => {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [name, setName] = useState('');
    const [RequiredPoints, setRequiredPoints] = useState('');
    const [purchaseBonus, setpurchaseBonus] = useState('');
    const [level, setLevel] = useState('');
    const navigate = useNavigate();
    const secretKey = import.meta.env.VITE_API_KEY;
  useEffect(() => {
    const fetchEvent = async () => {
        try {
            const response = await axios.get(secretKey+`/admin/VipClub/${id}`);
            setEvent(response.data);
            setName(response.data.Name);
            setRequiredPoints(response.data.RequiredPoints);
            setpurchaseBonus(response.data.purchaseBonus);
            setLevel(response.data.level);

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
        const response = await axios.put(secretKey+`/admin/updateVipClub/${id}`, {
            Name: name,
            RequiredPoints: RequiredPoints,
            purchaseBonus: purchaseBonus,
            level: level
        });
        alert('Vip Club updated successfully!');
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
        <Breadcrumb pageName="VIP Cards" />

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
                        Name
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
                        Required Points
                      </label>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="number"
                        name="RequiredPoints"
                        id="RequiredPoints"
                        placeholder="Required Points"
                        value={RequiredPoints}
                        onChange={(e) => setRequiredPoints(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                    <div className="w-full sm:w-1/2">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="name">
                        Purchase Bonus
                      </label>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="number"
                        name="PurchaseBonus"
                        id="PurchaseBonus"
                        placeholder="Purchase Bonus"
                        value={purchaseBonus}
                        onChange={(e) => purchaseBonus(e.target.value)}
                      />
                    </div>

                    <div className="w-full sm:w-1/2">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="currency">
                        Level
                      </label>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="number"
                        name="Level"
                        id="Level"
                        placeholder="Level"
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
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