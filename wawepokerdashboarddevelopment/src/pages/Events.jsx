import React from 'react';
import TableSix from '../components/Tables/TableSix';
import DefaultLayout from '../layout/DefaultLayout';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';

const Events = () => {

    return (
        <DefaultLayout>
            <Breadcrumb pageName="Events" />
            <TableSix />    
        </DefaultLayout>
    );
};
export default Events;