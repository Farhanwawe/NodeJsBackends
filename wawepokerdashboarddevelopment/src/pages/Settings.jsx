import React, { useState, useEffect } from 'react';
import { useParams,useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import DefaultLayout from '../layout/DefaultLayout';
import sessionManager from '../Auth/sessionManager';
import axios from 'axios';

const Settings = () => {
 const userId = localStorage.getItem('userId');
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    password: '',
    number: '',
  });
  const secretKey = import.meta.env.VITE_API_KEY;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(secretKey+`/admin/adminusers/${userId}`);
        const user = response.data;
        setUserData({
          name: user.name,
          email: user.email,
          password: user.password,
          number: user.number,
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSend = {
      name: userData.name?.toString() ?? '',
      number: userData.number ? parseFloat(userData.number) : null,
      email: userData.email?.toString() ?? '',
      password: userData.password?.toString() ?? '',
    };
    try {
      await axios.put(secretKey+`/admin/adminusers/${userId}`, dataToSend);
      alert('User data updated successfully!');
      navigate('/auth/signin');
      sessionManager.clearSession();

      
    } catch (error) {
      console.error('Error updating user data:', error);
      alert('Failed to update user data. Please try again.');
    }
  };

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-270">
        <Breadcrumb pageName="Settings" />

        <div className="flex flex-1 flex-col justify-center gap-8">
          <div className="col-span-3 xl:col-span-3">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Personal Information
                </h3>
              </div>
              <div className="p-7">
                <form onSubmit={handleSubmit}>
                  <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                    <div className="w-full sm:w-1/2">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="name">
                        Full Name
                      </label>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="text"
                        name="name"
                        id="name"
                        placeholder="Full Name"
                        value={userData.name}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="w-full sm:w-1/2">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="number">
                        Phone Number
                      </label>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="text"
                        name="number"
                        id="number"
                        placeholder="Phone Number"
                        value={userData.number}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                    <div className="w-full sm:w-1/2">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="name">
                      Email Address
                      </label>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="text"
                        name="email"
                        id="email"
                        placeholder="Email Address"
                        value={userData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="w-full sm:w-1/2">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="password">
                      Password
                    </label>
                    <input
                      className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                      type="password"
                      name="password"
                      id="password"
                      placeholder="Password"
                      value={userData.password}
                      onChange={handleInputChange}
                    />
                    </div>
                    
                  </div>
                 

                 {/*  <div className="mb-5.5">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="password">
                      Password
                    </label>
                    <input
                      className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                      type="password"
                      name="password"
                      id="password"
                      placeholder="Password"
                      value={userData.password}
                      onChange={handleInputChange}
                    />
                  </div>
                 */}
                 

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

export default Settings;