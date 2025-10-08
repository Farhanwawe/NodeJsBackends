import React from 'react';
import TableFour from '../components/Tables/TableFour';
import DefaultLayout from '../layout/DefaultLayout';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';

const QueryTable = () => {

    return (
        <DefaultLayout>
            <Breadcrumb pageName="Report Table" />
            <TableFour />    
        </DefaultLayout>
    );
};
export default QueryTable;