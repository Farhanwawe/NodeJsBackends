import React, { useState } from 'react';
import axios from 'axios';

const CreateTable = () => {
  const [formData, setFormData] = useState({
    name: '',
    typeName: '',
    buyIn: '',
    max_seats:0,
    minPlayers:0,
    turnCountdown:0,
    minBet:0,
    minimumAmount: 0,
    maximumAmount: 0,
    afterRoundCountdown: 0,
    type: 'Public',
    sequence:0,
    display:true
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  const secretKey = import.meta.env.VITE_API_KEY;
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const isLargeNumber = (value) => {
            return BigInt(value) > Number.MAX_SAFE_INTEGER;
        };
        const dataToSend = {
            ...formData,
            minimumAmount: isLargeNumber(formData.minimumAmount) ? formData.minimumAmount.toString() : Number(formData.minimumAmount),
            maximumAmount: isLargeNumber(formData.maximumAmount) ? formData.maximumAmount.toString() : Number(formData.maximumAmount),
        };
        await axios.post(secretKey+'/admin/tables', dataToSend);
        alert("Table created successfully!");
    } catch (error) {
        console.error('Failed to create table:', error.response.data); // Better error logging
    }
};

  return (
    <div className="flex flex-1 flex-col justify-center gap-8">
    <div className="col-span-3 xl:col-span-3">
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                    Create Table
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
                                placeholder="Name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="w-full sm:w-1/2">
                            <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="typeName">
                                Type Name
                            </label>
                            <input
                                className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                type="text"
                                name="typeName"
                                id="typeName"
                                placeholder="Type Name"
                                value={formData.typeName}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                        <div className="w-full sm:w-1/2">
                            <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="buyIn">
                                Buy-In
                            </label>
                            <input
                                className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                type="text"
                                name="buyIn"
                                id="buyIn"
                                placeholder="Buy-In"
                                value={formData.buyIn}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="w-full sm:w-1/2">
                            <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="max_seats">
                                Max Seats
                            </label>
                            <input
                                className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                type="number"
                                name="max_seats"
                                id="max_seats"
                                placeholder="Max Seats"
                                value={formData.max_seats}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                        <div className="w-full sm:w-1/2">
                            <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="buyIn">
                            Minimum Players
                            </label>
                            <input
                                className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                type="number"
                                name="minPlayers"
                                id="minPlayers"
                                placeholder="minPlayers"
                                value={formData.minPlayers}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="w-full sm:w-1/2">
                            <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="max_seats">
                            Turn Countdown
                            </label>
                            <input
                                className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                type="number"
                                name="turnCountdown"
                                id="turnCountdown"
                                placeholder="turnCountdown"
                                value={formData.turnCountdown}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                        <div className="w-full sm:w-1/2">
                            <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="buyIn">
                                Minimun Bet
                            </label>
                            <input
                                className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                type="number"
                                name="minBet"
                                id="minBet"
                                placeholder="minBet"
                                value={formData.minBet}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="w-full sm:w-1/2">
                            <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="max_seats">
                                Minimum Amount
                            </label>
                            <input
                                className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                type="number"
                                name="minimumAmount"
                                id="minimumAmount"
                                placeholder="minimumAmount"
                                value={formData.minimumAmount}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                        <div className="w-full sm:w-1/2">
                            <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="buyIn">
                                Maximum Amount
                            </label>
                            <input
                                className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                type="number"
                                name="maximumAmount"
                                id="maximumAmount"
                                placeholder="maximumAmount"
                                value={formData.maximumAmount}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="w-full sm:w-1/2">
                            <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="max_seats">
                                After Round Count Down
                            </label>
                            <input
                                className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                type="number"
                                name="afterRoundCountdown"
                                id="afterRoundCountdown"
                                placeholder="afterRoundCountdown"
                                value={formData.afterRoundCountdown}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                        <div className="w-full sm:w-1/2">
                        <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="type">
                            Table Type
                        </label>
                        <select
                            className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                            type="text"
                            name="type"
                            id="type"
                            value={formData.type}
                            onChange={handleChange}
                        >
                            <option value="Public">Public</option>
                            <option value="Private">Private</option>
                        </select>
                        </div>
                        <div className="w-full sm:w-1/2">
                            <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="max_seats">
                                Sequence
                            </label>
                            <input
                                className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                type="number"
                                name="sequence"
                                id="sequence"
                                placeholder="sequence"
                                value={formData.sequence}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                        <div className="w-full sm:w-1/2">
                            <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="buyIn">
                                Display
                            </label>
                            <select
                            className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                            type="text"
                            name="display"
                            id="display"
                            value={formData.display}
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
  );
};

export default CreateTable;