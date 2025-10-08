import React from 'react';
import AddTable from '../components/Tables/TableFive';
import DefaultLayout from '../layout/DefaultLayout';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';

const GameTables = () => {

    return (
        <DefaultLayout>
            <Breadcrumb pageName="Game Tables" />
            <AddTable/>    
        </DefaultLayout>
    );
};
export default GameTables;