import React from 'react';
import TableThirteen from '../components/Tables/TableThirteen';
import DefaultLayout from '../layout/DefaultLayout';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';

const Events = () => {

    return (
        <DefaultLayout>
            <Breadcrumb pageName="VIP cards" />
            <TableThirteen />    
        </DefaultLayout>
    );
};
export default Events;