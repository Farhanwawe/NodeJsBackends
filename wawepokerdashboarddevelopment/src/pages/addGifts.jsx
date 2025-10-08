import React, { useState } from 'react';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';
import DefaultLayout from '../layout/DefaultLayout';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
const CreateGifts = () => {
  const [formData, setFormData] = useState({
    GiftName: '',
    GiftPrice: 0,
    Enabled: false,
    ImageURL: ''
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
        const dataToSend = {
          GiftName: formData.GiftName.toString(),
          GiftPrice: parseInt(formData.GiftPrice),
          Enabled: formData.Enabled,
          ImageURL: formData.ImageURL.toString()
        }
        await axios.post(secretKey+'/admin/addGifts', dataToSend);
        alert("Gifts added successfully!");
        navigate('/');
    } catch (error) {
        console.error('Failed to create table:', error.response.data); // Better error logging
    }
};

  return (
<DefaultLayout>
<Breadcrumb pageName="Add Gifts" />
    <div className="flex flex-1 flex-col justify-center gap-3">
    <div className="col-span-3 xl:col-span-3">
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                    Create Gifts
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
                                placeholder="Gift Name"
                                value={formData.GiftName}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="w-full sm:w-1/2">
                            <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="currency">
                            Price
                            </label>
                            <input
                                className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                type="number"
                                name="GiftPrice"
                                id="GiftPrice"
                                placeholder="Price"
                                value={formData.GiftPrice}
                                onChange={handleChange}
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
                            placeholder="Enabled"
                            value={formData.Enabled}
                            onChange={handleChange}
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
                                value={formData.ImageURL}
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

export default CreateGifts;