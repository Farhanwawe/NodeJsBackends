import React,{useEffect} from 'react';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import Messages from '../components/userMessage';
import DefaultLayout from '../layout/DefaultLayout';

const Message =()  => {
    return(
        <>
            <DefaultLayout>
                <Breadcrumb pageName="Messages" />
                <Messages />
            </DefaultLayout>
        </>
    );
}

export default Message;