import React from 'react';
import TableTen from '../components/Tables/TableTen';
import DefaultLayout from '../layout/DefaultLayout';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';

const Popups = () => {

    return (
        <DefaultLayout>
            <Breadcrumb pageName="All InApp Products" />
            <TableTen />    
        </DefaultLayout>
    );
};
export default Popups;