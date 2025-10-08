import React, { useState } from 'react';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';
import DefaultLayout from '../layout/DefaultLayout';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
const CreateEvent = () => {
  const [formData, setFormData] = useState({
    name: '',
    currency: '',
  });
  const secretKey = import.meta.env.VITE_API_KEY;
const navigate= useNavigate();
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        await axios.post(secretKey+'/admin/addEvent', formData);
        alert("Event added successfully!");
        navigate('/');
    } catch (error) {
        console.error('Failed to create table:', error.response.data); // Better error logging
    }
};

  return (
<DefaultLayout>
<Breadcrumb pageName="Add Event" />
    <div className="flex flex-1 flex-col justify-center gap-3">
    <div className="col-span-3 xl:col-span-3">
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                    Create Event
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
                                value={formData.name}
                                onChange={handleChange}
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
                                placeholder="Currency"
                                value={formData.currency}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
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

export default CreateEvent;