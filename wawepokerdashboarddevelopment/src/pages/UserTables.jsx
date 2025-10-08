import React,{useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import sessionManager from '../Auth/sessionManager';
import TableOne from '../components/Tables/TableOne';
import DefaultLayout from '../layout/DefaultLayout';

const Tables = () => {
  const navigate = useNavigate();
  useEffect(() => {
    try{
      const token = sessionManager.getToken();
      if (!token || !sessionManager.isSessionActive()) {
        navigate('/auth/signin');
      }
    }
    catch(err){
      console.error(err);
    }
  }),[]
  return (
    <>
      <DefaultLayout>
      <Breadcrumb pageName="Tables" />

      <div className="flex flex-col gap-10">
        <TableOne />
      </div>

      </DefaultLayout>
    </>
  );
};

export default Tables;
