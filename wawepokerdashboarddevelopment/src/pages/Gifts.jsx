import React from 'react';
import TableEigth from '../components/Tables/TableEigth';
import DefaultLayout from '../layout/DefaultLayout';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';

const Gifts = () => {

    return (
        <DefaultLayout>
            <Breadcrumb pageName="Gifts" />
            <TableEigth />    
        </DefaultLayout>
    );
};
export default Gifts;