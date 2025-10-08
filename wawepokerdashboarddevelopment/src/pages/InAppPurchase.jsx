import React from 'react';
import TableEleven from '../components/Tables/TableEleven';
import DefaultLayout from '../layout/DefaultLayout';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';

const Popups = () => {

    return (
        <DefaultLayout>
            <Breadcrumb pageName="All InApp Purchase" />
            <TableEleven />    
        </DefaultLayout>
    );
};
export default Popups;