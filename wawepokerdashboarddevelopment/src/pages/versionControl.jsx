import React from 'react';
import TableFourteen from '../components/Tables/TableFourteen';
import DefaultLayout from '../layout/DefaultLayout';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';

const VersionControl = () => {

    return (
        <DefaultLayout>
            <Breadcrumb pageName="Versions" />
            <TableFourteen />    
        </DefaultLayout>
    );
};
export default VersionControl;