
import React, { useState } from 'react';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { useNavigate } from 'react-router-dom';
import DefaultLayout from '../../layout/DefaultLayout';
import axios from 'axios';

const SignUp = () => {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'Vip', // Default role
  });
  const secretKey = import.meta.env.VITE_API_KEY;
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        name: userData.name.toString(),
        phone: userData.phone.toString(),
        email: userData.email.toString(),
        password: userData.password.toString(),
        role: userData.role.toString(),
      };
      await axios.post(secretKey+"/admin/register", dataToSend);
      alert('User registered successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error registering user:', error);
      alert('Failed to register user. Please try again.');
    }
  };

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-270">
        <Breadcrumb pageName="Registration" />

        <div className="flex flex-1 flex-col justify-center gap-8">
          <div className="col-span-3 xl:col-span-3">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Register Admin
                </h3>
              </div>
              <div className="p-7">
                <form onSubmit={handleSubmit}>
                  <div className="mb-5.5">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="name">
                      Full Name
                    </label>
                    <input
                      className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
                      type="text"
                      name="name"
                      id="name"
                      placeholder="Enter Full Name"
                      value={userData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-5.5">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="email">
                      Email
                    </label>
                    <input
                      className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
                      type="email"
                      name="email"
                      id="email"
                      placeholder="Enter Email"
                      value={userData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-5.5">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="phone">
                      Phone Number
                    </label>
                    <input
                      className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
                      type="text"
                      name="phone"
                      id="phone"
                      placeholder="Enter Phone Number"
                      value={userData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-5.5">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="password">
                      Password
                    </label>
                    <input
                      className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
                      type="password"
                      name="password"
                      id="password"
                      placeholder="Enter Password"
                      value={userData.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-5.5">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="role">
                      Role
                    </label>
                    <select
                      className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
                      name="role"
                      id="role"
                      value={userData.role}
                      onChange={handleInputChange}
                    >
                      <option value="Vip">Vip</option>
                      <option value="Admin">Admin</option>
                      <option value="Support">Support</option>
                      <option value="SuperAdmin">SuperAdmin</option>
                    </select>
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
                      Register
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

export default SignUp;