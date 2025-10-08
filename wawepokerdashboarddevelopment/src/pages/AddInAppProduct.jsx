import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import DefaultLayout from '../layout/DefaultLayout';
import axios from 'axios';
import CryptoJS from 'crypto-js';
const PopupSettings = () => {
    const [event, setEvent] = useState({
        productname: '',
        product_ID: '',
        productPrice: 0,
        lastPrice: 0,
        lastChips: 0,
        chips: 0,
        spinner: 0,
        relatedFreeProductId: 0
    });
    const navigate = useNavigate();
    const secretKey = import.meta.env.VITE_API_KEY;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEvent({ ...event, [name]: value });  
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSend = {
                productname: event.productname?.toString() ?? '',
                product_ID: event.product_ID?.toString() ?? '',
                productPrice: event.productPrice ? parseFloat(event.productPrice) : 0,
                lastPrice: event.lastPrice ? parseFloat(event.lastPrice) : 0,
                lastChips: event.lastChips ? parseFloat(event.lastChips) : 0,
                chips: event.chips ? parseFloat(event.chips) : 0,
                spinner: event.spinner ? parseFloat(event.spinner) : 0,
                relatedFreeProductId: event.relatedFreeProductId ? parseFloat(event.relatedFreeProductId) : 0
            };
            await axios.post(secretKey + '/admin/addInapp', dataToSend);
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
                <Breadcrumb pageName="InApp Settings" />
                <div className="flex flex-1 flex-col justify-center gap-8">
                    <div className="col-span-3 xl:col-span-3">
                        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                            <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">
                                    <h3 className="font-medium text-black dark:text-white">InApp Settings</h3>
                            </div>
                            <div className="p-7">
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                                        <div className="w-full sm:w-1/2">
                                            <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="name">
                                                Product Name
                                            </label>
                                            <input
                                                className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                                type="text"
                                                name="productname"
                                                id="productname"
                                                placeholder="productname"
                                                value={event.productname}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="w-full sm:w-1/2">
                                            <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="enabled">
                                            Product ID
                                            </label>
                                            <input
                                                className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                                name="product_ID"
                                                id="product_ID"
                                                value={event.product_ID }
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        </div>
                                            <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                                                <div className="w-full sm:w-1/2">
                                                    <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="reward">
                                                    product Price
                                                    </label>
                                                    <input
                                                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                                        type="number"
                                                        name="productPrice"
                                                        id="productPrice"
                                                        placeholder="productPrice"
                                                        value={event.productPrice}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                                <div className="w-full sm:w-1/2">
                                                    <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="dontreward">
                                                    last Price
                                                    </label>
                                                    <input
                                                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                                        type="number"
                                                        name="lastPrice"
                                                        id="lastPrice"
                                                        placeholder="lastPrice"
                                                        value={event.lastPrice}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                            </div>
                                            <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                                                <div className="w-full sm:w-1/2">
                                                    <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="startTime">
                                                    Chips
                                                    </label>
                                                    <input
                                                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                                        type="number"
                                                        name="chips"
                                                        id="chips"
                                                        value={event.chips} // Format date string for datetime-local
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                                <div className="w-full sm:w-1/2">
                                                    <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="endTime">
                                                    Spinner
                                                    </label>
                                                    <input
                                                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                                        type="text"
                                                        name="spinner"
                                                        id="spinner"
                                                        value={event.spinner} // Format date string for datetime-local
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                            </div>

                                            <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                                                <div className="w-full sm:w-1/2">
                                                    <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="startTime">
                                                    related Free ProductId
                                                    </label>
                                                    <input
                                                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                                        type="number"
                                                        name="relatedFreeProductId"
                                                        id="relatedFreeProductId"
                                                        value={event.relatedFreeProductId} // Format date string for datetime-local
                                                        onChange={handleInputChange}
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
            </div>
        </DefaultLayout>
    );
};

export default PopupSettings;