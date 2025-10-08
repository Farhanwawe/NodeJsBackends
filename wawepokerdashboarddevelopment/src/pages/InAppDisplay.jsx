import React from 'react';
import TableTwelve from '../components/Tables/TableTwelve';
import DefaultLayout from '../layout/DefaultLayout';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';

const Popups = () => {

    return (
        <DefaultLayout>
            <Breadcrumb pageName="All InApp Purchases" />
            <TableTwelve />    
        </DefaultLayout>
    );
};
export default Popups;