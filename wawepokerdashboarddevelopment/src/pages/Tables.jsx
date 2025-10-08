import React from 'react';
import AddTable from '../components/addTable';
import DefaultLayout from '../layout/DefaultLayout';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';

const Tables = () => {

    return (
        <DefaultLayout>
            <Breadcrumb pageName="Add Table" />
            <AddTable/>    
        </DefaultLayout>
    );
};
export default Tables;