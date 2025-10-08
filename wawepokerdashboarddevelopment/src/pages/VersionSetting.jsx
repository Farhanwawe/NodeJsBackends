import React, { useState, useEffect } from 'react';
import { useParams,useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import DefaultLayout from '../layout/DefaultLayout';
import axios from 'axios';

const GiftsSettings = () => {
    const { id } = useParams();
    const{Development,Staging,Production}=["Development","Staging","Production"];
    const {Android,IphonePlayer,WindowsEditor} = ["Android","IphonePlayer","WindowsEditor"];
    const [event, setEvent] = useState(null);
    const [version, setVersion] = useState('');
    const [type, setType] = useState('');
    const [facebook, setFacebook] = useState('');
    const [platform, setPlatform] = useState('');
    const [google, setGoogle] = useState('');
    const [phone, setPhone] = useState('');
    const [apple, setApple] = useState('');
    const navigate = useNavigate();
    const secretKey = import.meta.env.VITE_API_KEY;
  useEffect(() => {

    const fetchEvent = async () => {
        try {
            const response = await axios.get(secretKey+`/admin/version/${id}`);
            setEvent(response.data);
            setVersion(response.data.version);
            setType(response.data.type);
            setFacebook(response.data.facebook);
            setGoogle(response.data.google);
            setPhone(response.data.phone);
            setApple(response.data.apple);
            setPlatform(response.data.platform);
        } catch (error) {
            console.error('Error fetching event:', error);
        }
    };

    if (id) {
      fetchEvent();
    }
  }, [id]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        version,
        type,
        facebook,
        google,
        phone,
        apple,
        platform
      };
       await axios.put(secretKey +`/admin/updateVersion/${id}`, dataToSend);
        alert('version updated successfully!');
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
<Breadcrumb pageName="Edit Version" />
    <div className="flex flex-1 flex-col justify-center gap-3">
    <div className="col-span-3 xl:col-span-3">
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                     Version
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
                                value={version}
                                onChange={(e) => setVersion(e.target.value)}
                            />
                        </div>
                        <div className="w-full sm:w-1/2">
                            <label className="mb-3 block text-sm font-medium text-black dark:text-white" htmlFor="type">
                               Platform
                            </label>
                            <select
                            className="w-full rounded border border-stroke bg-gray py-3 pl-4 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                            type="text"
                            name="platform"
                            id="platform"
                            placeholder="platform"
                            value={platform}
                            onChange={(e) => setPlatform(e.target.value)}
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
                            value={type}
                            onChange={(e) => setType(e.target.value)}
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
                            value={facebook}
                            onChange={(e) => setFacebook(e.target.value)}
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
                            value={google}
                            onChange={(e) => setGoogle(e.target.value)}
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
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
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
                            value={apple}
                            onChange={(e) => setApple(e.target.value)}
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

export default GiftsSettings;