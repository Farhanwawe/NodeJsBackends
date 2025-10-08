import React from 'react';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import Reports from '../components/reports';
import DefaultLayout from '../layout/DefaultLayout';

const Report =()  => {
    return(
        <>
            <DefaultLayout>
                <Breadcrumb pageName="Reports" />
                <Reports />
            </DefaultLayout>
        </>
    );
}

export default Report;