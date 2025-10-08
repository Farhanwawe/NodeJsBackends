import React, { useState } from 'react';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';
import DefaultLayout from '../layout/DefaultLayout';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
const CreateEvent = () => {
    const{Development,Staging,Production}=["Development","Staging","Production"];
    const {Android,IphonePlayer,WindowsEditor} = ["Android","IphonePlayer","WindowsEditor"];
  const [formData, setFormData] = useState({
    version: '',
    type: "Development",
    platform: "Android",
    facebook: false,
    google: false,
    phone: false,
    apple: false
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
        console.log(formData)
        await axios.post(secretKey+'/admin/addVersion', formData);
        alert("Version added successfully!");
        navigate('/');
    } catch (error) {
        console.error('Failed to create table:', error.response.data); // Better error logging
    }
};

  return (
<DefaultLayout>
<Breadcrumb pageName="Add Version" />
    <div className="flex flex-1 flex-col justify-center gap-3">
    <div className="col-span-3 xl:col-span-3">
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                    Create Version
                </h3>
            </div>
            <div className="p-7">
                <form onSubmit={handleSubmit}>
                    <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                        <div className="w-full sm:w-1/2">
                            <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="version">
                                Version
                            </label>
                            <input
                                className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                type="text"
                                name="version"
                                id="version"
                                placeholder="version name"
                                value={formData.version}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="w-full sm:w-1/2">
                            <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="platform">
                              Platform
                            </label>
                            <select
                            className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                            type="text"
                            name="platform"
                            id="platform"
                            placeholder="platform"
                            value={formData.platform}
                            onChange={handleChange}
                        >
                            <option value={Android}>Android</option>
                            <option value={IphonePlayer}>IphonePlayer</option>
                            <option value={WindowsEditor}>WindowsEditor</option>
                        </select>
                        </div>
                        <div className="w-full sm:w-1/2">
                            <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="type">
                               Type
                            </label>
                            <select
                            className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                            type="text"
                            name="type"
                            id="type"
                            placeholder="type"
                            value={formData.type}
                            onChange={handleChange}
                        >
                            <option value={Development}>Development</option>
                            <option value={Staging}>Staging</option>
                            <option value={Production}>Production</option>
                        </select>
                        </div>
                    </div>
                    <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                        <div className="w-full sm:w-1/2">
                            <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="facebook">
                                Facebook
                            </label>
                            <select
                            className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                            type="text"
                            name="facebook"
                            id="facebook"
                            placeholder="facebook"
                            value={formData.facebook}
                            onChange={handleChange}
                        >
                            <option value={true}>True</option>
                            <option value={false}>False</option>
                        </select>
                        </div>
                        <div className="w-full sm:w-1/2">
                            <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="google">
                               Google
                            </label>
                            <select
                            className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                            type="text"
                            name="google"
                            id="google"
                            placeholder="google"
                            value={formData.google}
                            onChange={handleChange}
                        >
                            <option value={true}>True</option>
                            <option value={false}>False</option>
                        </select>
                        </div>
                    </div>
                    <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                        <div className="w-full sm:w-1/2">
                            <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="phone">
                                Phone
                            </label>
                            <select
                            className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                            type="text"
                            name="phone"
                            id="phone"
                            placeholder="phone"
                            value={formData.phone}
                            onChange={handleChange}
                        >
                            <option value={true}>True</option>
                            <option value={false}>False</option>
                        </select>
                        </div>
                        <div className="w-full sm:w-1/2">
                            <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="apple">
                               Apple
                            </label>
                            <select
                            className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                            type="text"
                            name="apple"
                            id="apple"
                            placeholder="apple"
                            value={formData.apple}
                            onChange={handleChange}
                        >
                            <option value={true}>True</option>
                            <option value={false}>False</option>
                        </select>
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