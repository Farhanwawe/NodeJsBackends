import React from 'react';
import TableSeven from '../components/Tables/TableSeven';
import DefaultLayout from '../layout/DefaultLayout';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';

const QueryTable = () => {

    return (
        <DefaultLayout>
            <Breadcrumb pageName="Banned Users" />
            <TableSeven />    
        </DefaultLayout>
    );
};
export default QueryTable;