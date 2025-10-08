import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import DefaultLayout from '../layout/DefaultLayout';
import axios from 'axios';
import CryptoJS from 'crypto-js';


const Settings = () => {
  const { userId } = useParams(); 
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    name: '',
    xp: 0,
    money: 0,
    win_count: 0,
    lose_count: 0,
    email: '',
    facebookid: '',
    udid: '',
    number: '',
    DropUser: false,
    VipStatus: false,
    conn: 0,
    Level: 0,
    BiggestWalletEver:0,
    BiggestHand:0,
    username: '',
    vipLevel: 0,
    vipPoints: 0,
    usernameCounter: 0


  });
  const [banLoading, setBanLoading] = useState(false);
  const [unbanLoading, setUnbanLoading] = useState(false);
  const [banError, setBanError] = useState(null);
  const [ws, setWs] = useState(null);

  const secretKey = import.meta.env.VITE_SECRET_KEY;
  const APIsecretKey = import.meta.env.VITE_API_KEY;
  const WsssecretKey = import.meta.env.VITE_WSS_KEY;

  const decryptUserId = (encryptedId) => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedId, secretKey);
      const decryptedId = bytes.toString(CryptoJS.enc.Utf8);
      return decryptedId;
    } catch (error) {
      console.error('Error decrypting userId:', error);
      return null;
    }
  };

  useEffect(() => {
    const decryptedId = decryptUserId(userId);
    const fetchUserData = async () => {
      try {
        const response = await axios.get(APIsecretKey+`/admin/users/${decryptedId}`);
        const user = response.data;
        setUserData({
          name: user.name,
          xp: user.xp,
          money: user.money,
          win_count: user.win_count,
          lose_count: user.lose_count,
          email: user.email,
          facebookid: user.facebookid,
          udid: user.udid,
          number: user.number,
          DropUser: user.DropUser,
          VipStatus: user.VipStatus,
          conn: user.conn,
          Level: user.Level,
          BiggestWalletEver:user.BiggestWalletEver,
          BiggestHand:user.BiggestHand,
          username: user.username,
          vipLevel: user.vipLevel,
          vipPoints: user.vipPoints,
          usernameCounter: user.usernameCounter
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    if (decryptedId) {
      fetchUserData();
    }
  }, [userId, secretKey]);
  useEffect(() => {
    const socket = new WebSocket(`${WsssecretKey}socket?DBID=${22}&connId=${123}`);
    socket.onopen = () => {
      setWs(socket); // Set WebSocket instance
    };

    socket.onmessage = (message) => {
      console.log('Message from server:', message.data);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      if (socket) {
        socket.close(); // Cleanup on component unmount
      }
    };
  }, [userData.conn]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = value === 'true' ? true : value === 'false' ? false : value;

    setUserData({ ...userData, [name]: parsedValue });
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    const decryptedId = decryptUserId(userId);
    const dataToSend = {
      name: userData.name?.toString() ?? '',
      money: parseFloat(userData.money),
      OnlineStatus: userData.OnlineStatus,
      number: userData.number ? parseFloat(userData.number) : null,
      email: userData.email?.toString() ?? '',
      password: userData.password?.toString() ?? '',
      VipStatus: userData.VipStatus ,
      facebookid: userData.facebookid?.toString() ?? '',
    };
    try {
      await axios.put(APIsecretKey+`/admin/users/${decryptedId}`, dataToSend);
      alert('User data updated successfully!');
      navigate('/tables');
      
    } catch (error) {
      console.error('Error updating user data:', error);
      alert('Failed to update user data. Please try again.');
    }
  };
  const handleBanUser = async () => {
    setBanLoading(true);
    setBanError(null);
    try {
      const decryptedId = decryptUserId(userId);
      const duration = 7 * 24 * 60 * 60 * 1000; // Example: 7 days in milliseconds
      await axios.post(APIsecretKey+`/admin/banUser`, {
        userId: decryptedId,
        duration: duration,
        permanent: false, // Change this based on whether the ban is permanent or not
      });
      setUserData((prevState) => ({ ...prevState, DropUser: true }));
      if(userData.VipStatus){
        alert('Since User is VIP he has been warned')
      }else{
      alert('User banned successfully!');
      }
      if (ws) {
        ws.send(
          JSON.stringify({
            key: 'ban_user',
            connectionId:userData.conn,
            PlayerID: decryptedId,
          })
        );
      }
    } catch (error) {
      console.error('Error banning user:', error);
      setBanError('Failed to ban user. Please try again.');
    } finally {
      setBanLoading(false);
    }
  };
    const handleUnbanUser = async () => {
    try {
      const decryptedId = decryptUserId(userId);
      setUnbanLoading(true);
      await axios.post(APIsecretKey+`/admin/unbanUser`,{
        userId: decryptedId
      });
      setUserData((prevState) => ({ ...prevState, DropUser: false }));
      alert('User unbanned successfully!');
    } catch (error) {
      console.error('Error unbanning user:', error);
      alert('Failed to unban user. Please try again.');
    }finally{
      setUnbanLoading(false);
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
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="level">
                      Level
                    </label>
                    <input
                      className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                      type="text"
                      name="level"
                      id="level"
                      placeholder="level"
                      disabled
                      value={userData.Level||''}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="w-full sm:w-1/2">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="connection">
                      ConnectionID
                    </label>
                    <input
                      className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                      type="text"
                      name="conn"
                      id="connection"
                      placeholder="ConnectionID"
                      disabled
                      value={userData.conn||''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
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
                        value={userData.name||''}
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
                        value={userData.number||''}
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
                        value={userData.email||''}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="w-full sm:w-1/2">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="number">
                      XP
                      </label>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="text"
                        name="xp"
                        id="xp"
                        placeholder="xp"
                        value={userData.xp||''}
                        disabled
                        
                      />
                    </div>
                  </div>
                  <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                    <div className="w-full sm:w-1/2">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="udid">
                      UDID
                      </label>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="text"
                        name="udid"
                        id="udid"
                        placeholder="udid"
                        value={userData.udid||''}
                        disabled
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="w-full sm:w-1/2">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="BiggestWalletEver">
                    Biggest Wallet Ever
                    </label>
                    <input
                      className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                      type="text"
                      name="BiggestWalletEver"
                      id="BiggestWalletEver"
                      placeholder="BiggestWalletEver"
                      value={userData.BiggestWalletEver||''}
                      disabled
                      onChange={handleInputChange}
                    />
                    </div>
                    </div>
                  <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                    <div className="w-full sm:w-1/2">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="money">
                        Money
                      </label>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="number"
                        name="money"
                        id="money"
                        placeholder="Money"
                        value={userData.money||''}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="w-full sm:w-1/2">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="win_count">
                        Win Count
                      </label>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="text"
                        name="win_count"
                        id="win_count"
                        placeholder="win_count "
                        value={userData.win_count||''}
                        disabled
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                    <div className="w-full sm:w-1/2">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="lose_count">
                        Lose Count
                      </label>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="text"
                        name="lose_count"
                        id="lose_count"
                        placeholder="lose_count"
                        value={userData.lose_count||''}
                        disabled
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="w-full sm:w-1/2">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="rew_ad_count">
                      Vip Status
                      </label>
                      <select
                            className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                            type="text"
                            name="VipStatus"
                            id="VipStatus"
                            value={userData.VipStatus||''}
                            onChange={handleInputChange}
                        >
                            <option value={true}>True</option>
                            <option value={false}>False</option>
                        </select>
                    </div>
                  </div>
                  <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                    <div className="w-full sm:w-1/2">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="facebookid">
                      Facebook Id
                      </label>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="text"
                        name="facebookid"
                        id="facebookid"
                        placeholder="facebookid"
                        value={userData.facebookid||''}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="w-full sm:w-1/2">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="BiggestHand">
                      Biggest Hand
                      </label>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="text"
                        name="BiggestHand"
                        id="BiggestHand"
                        placeholder="BiggestHand"
                        disabled
                        value={userData.BiggestHand||''}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                    <div className="w-full sm:w-1/2">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="username">
                      Username
                      </label>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="text"
                        name="username"
                        id="username"
                        placeholder="username"
                        value={userData.username||''}
                        disabled
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="w-full sm:w-1/2">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="usernameCounter">
                      Username Counter
                      </label>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="text"
                        name="usernameCounter"
                        id="usernameCounter"
                        placeholder="usernameCounter"
                        value={userData.usernameCounter||''}
                        disabled
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                    <div className="w-full sm:w-1/2">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="vipLevel">
                      Vip Level
                      </label>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="text"
                        name="vipLevel"
                        id="vipLevel"
                        placeholder="vipLevel"
                        value={userData.vipLevel||''}
                        disabled
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="w-full sm:w-1/2">
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="vipPoints">
                      Vip Points
                      </label>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                        type="text"
                        name="vipPoints"
                        id="vipPoints"
                        placeholder="vipPoints"
                        value={userData.vipPoints||''}
                        disabled
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
                    {userData.DropUser ? (
                      <button
                        className="flex justify-center rounded bg-red-500 py-2 px-6 font-medium text-white hover:bg-red-700"
                        type="button"
                        onClick={handleUnbanUser}
                        disabled={unbanLoading}
                      >
                      {unbanLoading ? 'Unbanning...' : 'Unban User'}
                      </button>
                    ) : (
                      <button
                      className="flex justify-center rounded bg-red-600 py-2 px-6 font-medium  text-white hover:bg-red-700 "
                      type="button"
                      onClick={handleBanUser}
                      disabled={banLoading}
                    >
                      {banLoading ? 'Banning...' : 'Ban User'}
                    </button>
                    )}
                    <button
                      className="flex justify-center rounded bg-primary py-2 px-6 font-medium text-gray hover:bg-opacity-90"
                      type="submit" // Adjust type as needed
                    >
                      Save
                    </button>
                  </div>
                  {banError && <div className="text-red-600 mt-4">{banError}</div>}
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