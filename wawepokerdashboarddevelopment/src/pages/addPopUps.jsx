import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DefaultLayout from '../layout/DefaultLayout';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';

const CreatePopUps = () => {
  const [formData, setFormData] = useState({
    Name: '',
    isVisible: false,
    popupType: '', // new field for popup type (one-time or event)
    Reward: 0,
    DontReward: 0,
    StartTime: new Date().toISOString().slice(0, 16),
    EndTime: new Date().toISOString().slice(0, 16),
  });
  const secretKey = import.meta.env.VITE_API_KEY;
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare data to send based on popup type
      const dataToSend = {
        Name: formData.Name.toString(),
        isVisible: formData.isVisible === 'true',
        popupType: formData.popupType,
        ...(formData.popupType === 'event'
          ? {
              StartTime: formData.StartTime,
              EndTime: formData.EndTime,
            }
          : {
              Reward: parseInt(formData.Reward, 10),
              DontReward: parseInt(formData.DontReward, 10),
            }),
      };

      await axios.post(`${secretKey}/admin/addPopups`, dataToSend);
      alert('PopUps added successfully!');
      navigate('/');
    } catch (error) {
      console.error('Failed to create popup:', error.response?.data || error.message); // Better error logging
    }
  };

  return (
    <DefaultLayout>
      <Breadcrumb pageName="Add PopUps" />
      <div className="flex flex-1 flex-col justify-center gap-3">
        <div className="col-span-3 xl:col-span-3">
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">Add Popups</h3>
            </div>
            <div className="p-7">
              <form onSubmit={handleSubmit}>
                {/* Name Field */}
                <div className="mb-5.5">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="name">
                    Name
                  </label>
                  <input
                    className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                    type="text"
                    name="Name"
                    id="Name"
                    placeholder="Name"
                    value={formData.Name}
                    onChange={handleChange}
                  />
                </div>

                {/* Visibility Field */}
                <div className="mb-5.5">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="isVisible">
                    Visibility
                  </label>
                  <select
                    className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                    name="isVisible"
                    id="isVisible"
                    value={formData.isVisible}
                    onChange={handleChange}
                  >
                    <option value={true}>True</option>
                    <option value={false}>False</option>
                  </select>
                </div>

                {/* Popup Type Selection */}
                <div className="mb-5.5">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="popupType">
                    Popup Type
                  </label>
                  <select
                    className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                    name="popupType"
                    id="popupType"
                    value={formData.popupType}
                    onChange={handleChange}
                  >
                    <option value="">Select Type</option>
                    <option value="oneTime">One-Time</option>
                    <option value="event">Event</option>
                  </select>
                </div>

                {/* Conditional Fields */}
                {formData.popupType === 'event' && (
                  <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                    <div className="w-full sm:w-1/2">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="StartTime">
                        Start Time
                      </label>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="datetime-local"
                        name="StartTime"
                        id="StartTime"
                        value={formData.StartTime}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="w-full sm:w-1/2">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="EndTime">
                        End Time
                      </label>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="datetime-local"
                        name="EndTime"
                        id="EndTime"
                        value={formData.EndTime}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                )}

                {formData.popupType === 'oneTime' && (
                  <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                    <div className="w-full sm:w-1/2">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="Reward">
                        Reward
                      </label>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="number"
                        name="Reward"
                        id="Reward"
                        placeholder="Reward"
                        value={formData.Reward}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="w-full sm:w-1/2">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="DontReward">
                        Don't Reward
                      </label>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="number"
                        name="DontReward"
                        id="DontReward"
                        placeholder="Don't Reward"
                        value={formData.DontReward}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                )}

                {/* Submit and Cancel Buttons */}
                <div className="flex justify-end gap-4.5">
                  <button
                    className="flex justify-center rounded border border-stroke py-2 px-6 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                    type="button"
                    onClick={() => window.history.back()}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex justify-center rounded bg-primary py-2 px-6 font-medium text-gray hover:bg-opacity-90"
                    type="submit"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default CreatePopUps;