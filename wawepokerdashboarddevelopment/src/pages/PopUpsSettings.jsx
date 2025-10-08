import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import DefaultLayout from '../layout/DefaultLayout';
import axios from 'axios';

const PopupSettings = () => {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [isTimed, setIsTimed] = useState(false);  // For checking if the popup is time-based
    const navigate = useNavigate();
    const secretKey = import.meta.env.VITE_API_KEY;

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const response = await axios.get(secretKey + `/admin/getPopups/${id}`);
                setEvent(response.data);

                // Set state based on whether the popup has a timer or not
                if (response.data.startTime && response.data.endTime) {
                    setIsTimed(true);
                } else {
                    setIsTimed(false);
                }
            } catch (error) {
                console.error('Error fetching event:', error);
            }
        };

        if (id) {
            fetchEvent();
        }
    }, [id]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const parsedValue = value === 'true' ? true : value === 'false' ? false : value;

        setEvent({ ...event, [name]: parsedValue });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSend = {
                Name: event.name?.toString() ?? '',
                Reward: event.Reward ? parseFloat(event.Reward) : 0,
                IsVisible: event.isVisible === 'true' || event.isVisible === true ? true : false,
                DontReward: event.DontReward ? parseFloat(event.DontReward) : 0,
                StartTime: event.startTime,
                EndTime: event.endTime,
            };
            await axios.put(secretKey + `/admin/updatePopups/${id}`, dataToSend);
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
                <Breadcrumb pageName="PopUps" />
                <div className="flex flex-1 flex-col justify-center gap-8">
                    <div className="col-span-3 xl:col-span-3">
                        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                            <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">
                                {!isTimed && (
                                    <h3 className="font-medium text-black dark:text-white">PopUps</h3>
                                )}
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
                                                placeholder="name"
                                                value={event.name}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="w-full sm:w-1/2">
                                            <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="enabled">
                                               Visibility
                                            </label>
                                            <select
                                                className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                                name="isVisible"
                                                id="isVisible"
                                                value={event.isVisible || false}
                                                onChange={handleInputChange}
                                            >
                                                <option value={true}>True</option>
                                                <option value={false}>False</option>
                                            </select>
                                        </div>
                                        </div>
                                        {/* Hide Reward and DontReward fields for Timed Popups */}
                                        {!isTimed && (
                                            <>
                                            <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                                                <div className="w-full sm:w-1/2">
                                                    <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="reward">
                                                        Reward
                                                    </label>
                                                    <input
                                                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                                        type="number"
                                                        name="Rewards"
                                                        id="Rewards"
                                                        placeholder="reward"
                                                        value={event.Rewards}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                                <div className="w-full sm:w-1/2">
                                                    <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="dontreward">
                                                        Don't Have Account Reward
                                                    </label>
                                                    <input
                                                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                                        type="number"
                                                        name="DontReward"
                                                        id="DontReward"
                                                        placeholder="dontreward"
                                                        value={event.DontReward}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                            </div>
                                            </>
                                        )}
                                    

                                    {/* Timed Popup Section */}
                                    {isTimed && (
                                        <>
                                            <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                                                <div className="w-full sm:w-1/2">
                                                    <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="startTime">
                                                        Start Time
                                                    </label>
                                                    <input
                                                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                                        type="datetime-local"
                                                        name="startTime"
                                                        id="startTime"
                                                        value={event.startTime?.slice(0, 16)} // Format date string for datetime-local
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                                <div className="w-full sm:w-1/2">
                                                    <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="endTime">
                                                        End Time
                                                    </label>
                                                    <input
                                                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                                        type="datetime-local"
                                                        name="endTime"
                                                        id="endTime"
                                                        value={event.endTime?.slice(0, 16)} // Format date string for datetime-local
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}

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