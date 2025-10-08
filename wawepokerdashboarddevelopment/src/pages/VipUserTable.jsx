import React from 'react';
import TableThree from '../components/Tables/TableThree';
import DefaultLayout from '../layout/DefaultLayout';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';

const QueryTable = () => {

    return (
        <DefaultLayout>
            <Breadcrumb pageName="Vip User Table" />
            <TableThree />    
        </DefaultLayout>
    );
};
export default QueryTable;