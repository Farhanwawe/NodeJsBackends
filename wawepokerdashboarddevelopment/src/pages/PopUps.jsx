import React from 'react';
import TableNine from '../components/Tables/TableNine';
import DefaultLayout from '../layout/DefaultLayout';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';

const Popups = () => {

    return (
        <DefaultLayout>
            <Breadcrumb pageName="All PopUps" />
            <TableNine />    
        </DefaultLayout>
    );
};
export default Popups;