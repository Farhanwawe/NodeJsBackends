import React, { useState, useEffect } from 'react';
import { useParams,useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import DefaultLayout from '../layout/DefaultLayout';
import axios from 'axios';

const GiftsSettings = () => {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [GiftName, setGiftName] = useState('');
    const [GiftPrice, setGiftPrice] = useState('');    
    const [Enabled, setEnabled] = useState('');
    const [ImageURL, setImageURL] = useState('');
    const navigate = useNavigate();
    const secretKey = import.meta.env.VITE_API_KEY;
  useEffect(() => {
    const fetchEvent = async () => {
        try {
            const response = await axios.get(secretKey+`/admin/getGifts/${id}`);
            setEvent(response.data);
            setGiftName(response.data.GiftName);
            setGiftPrice(response.data.GiftPrice);
            setEnabled(response.data.Enabled);
            setImageURL(response.data.ImageURL);
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
      const dataToSend = {
        GiftName: GiftName?.toString() ?? '',
        GiftPrice: parseFloat(GiftPrice),
        Enabled: Enabled==='true' || Enabled===true ? true : false,
        ImageURL:ImageURL?.toString() ?? ''
      };
       await axios.put(secretKey +`/admin/updateGifts/${id}`, dataToSend);
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
        <Breadcrumb pageName="Gifts" />

        <div className="flex flex-1 flex-col justify-center gap-8">
          <div className="col-span-3 xl:col-span-3">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Gifts
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
                        name="GiftName"
                        id="GiftName"
                        placeholder="GiftName"
                        value={GiftName}
                        onChange={(e) => setGiftName(e.target.value)}
                      />
                    </div>

                    <div className="w-full sm:w-1/2">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="currency">
                      Price
                      </label>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="text"
                        name="GiftPrice"
                        id="GiftPrice"
                        placeholder="GiftPrice"
                        value={GiftPrice}
                        onChange={(e) => setGiftPrice(e.target.value)}
                      />
                    </div>
                    
                  </div>
                  <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                  <div className="w-full sm:w-1/2">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="name">
                        Enabled
                      </label>
                      <select
                            className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                            type="text"
                            name="Enabled"
                            id="Enabled"
                            value={Enabled}
                            onChange={(e) => setEnabled(e.target.value)}
                        >
                            <option value={true}>True</option>
                            <option value={false}>False</option>
                        </select>
                    </div>

                    <div className="w-full sm:w-1/2">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="currency">
                      Image URL
                      </label>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="text"
                        name="ImageURL"
                        id="ImageURL"
                        placeholder="ImageURL"
                        value={ImageURL}
                        onChange={(e) => setImageURL(e.target.value)}
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

export default GiftsSettings;