import React from 'react';
import TableTwo from '../components/Tables/TableTwo';
import DefaultLayout from '../layout/DefaultLayout';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';

const QueryTable = () => {

    return (
        <DefaultLayout>
            <Breadcrumb pageName="Query Table" />
            <TableTwo />    
        </DefaultLayout>
    );
};
export default QueryTable;