import React, { useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import DefaultLayout from '../layout/DefaultLayout';
import CryptoJS from 'crypto-js';

const VipReward = () => {
  const { userId } = useParams();
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({
    type: '',
    quantities: { chips: 0, spinners: 0 },
  });
  const secretKey = import.meta.env.VITE_SECRET_KEY;
  const APIsecretKey = import.meta.env.VITE_API_KEY;
  const decryptUserId = (encryptedId) => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedId, secretKey);
      const decryptedId = bytes.toString(CryptoJS.enc.Utf8);
      return decryptedId;
    } catch (error) {
      console.error('Error decrypting userId:', error);
      return null;
    }
  };

  const handleGift = async () => {
    try {
      const decryptedId = decryptUserId(userId);
      const payload = {
        userId: decryptedId,
        Chips: modalContent.quantities.chips || 0, // Ensure the keys match API expectations
        Spinner: modalContent.quantities.spinners || 0,
      };

      await axios.post(
        APIsecretKey+'/admin/RewardVIPUser',
        payload,
      );

      alert('Gift sent successfully!');
    } catch (error) {
      console.error('Error sending gift:', error);
      alert('Failed to send gift.');
    }
    setShowModal(false);
    setModalContent({ type: '', quantities: { chips: 0, spinners: 0 } });
  };
  const openModal = (type) => {
    setShowModal(true);
    setModalContent({
      type: type,
      quantities: { chips: '', spinners: '' },
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setModalContent((prevState) => ({
      ...prevState,
      quantities: {
        ...prevState.quantities,
        [name]: value,
      },
    }));
  };

  // Inline styles for the modal, including styled headings
  const modalStyles = {
    backdrop: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
    },
    content: {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      width: '300px',
    },
    heading: {
      fontWeight: 'bold',
      fontSize: '24px',
      margin: '0 0 10px 0',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
    },
    input: {
      margin: '10px 0',
      padding: '10px',
    },
    button: {
      margin: '10px 5px 0 0',
      padding: '10px 15px',
      cursor: 'pointer',
    },
  };

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-270">
        <Breadcrumb pageName="VIP User Reward" />

        <div className="flex flex-col items-center gap-8">
          <h1 className="text-2xl font-bold">What do you want to gift?</h1>
          <div className="flex flex-wrap justify-center gap-8">
            <button
              className="group w-64 h-64 bg-white border border-gray-300 rounded-lg shadow-md flex flex-col items-center justify-center hover:shadow-lg"
              onClick={() => openModal('chip')}
            >
              <img
                src="/Chip.png"
                alt="Chip"
                className="w-24 h-24 transition-transform duration-200 group-hover:scale-105"
              />
              <span className="mt-4 text-xl font-medium">Chip</span>
            </button>

            <button
              className="group w-64 h-64 bg-white border border-gray-300 rounded-lg shadow-md flex flex-col items-center justify-center hover:shadow-lg"
              onClick={() => openModal('spinner')}
            >
              <img
                src="/Spinner.png"
                alt="Spinner"
                className="w-24 h-24 transition-transform duration-200 group-hover:scale-105"
              />
              <span className="mt-4 text-xl font-medium">Spinner</span>
            </button>
          </div>
          <div className="w-full flex justify-center">
            <button
              className="group w-1/2 bg-white border border-gray-300 rounded-lg shadow-md flex flex-col items-center justify-center hover:shadow-lg"
              onClick={() => openModal('deal')}
            >
              <img
                src="/Deal.png"
                alt="Deal"
                className="w-70 h-28 transition-transform duration-200 group-hover:scale-105"
              />
              <span className="mt-4 text-xl font-bold">Make a Deal</span>
            </button>
          </div>
        </div>
      </div>
      {showModal && (
        <div style={modalStyles.backdrop} onClick={() => setShowModal(false)}>
          <div style={modalStyles.content} onClick={(e) => e.stopPropagation()}>
            <h2 style={modalStyles.heading}>
              Give{' '}
              {modalContent.type === 'deal'
                ? 'Chips and Spinners'
                : modalContent.type.charAt(0).toUpperCase() +
                  modalContent.type.slice(1)}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGift();
              }}
              style={modalStyles.form}
            >
              {modalContent.type === 'deal' ? (
                <>
                  <label htmlFor="chips">Chips:</label>
                  <input
                    type="number"
                    id="chips"
                    name="chips"
                    placeholder="Enter Number of Chips"
                    min="1"
                    value={modalContent.quantities.chips}
                    onChange={handleInputChange}
                    required
                    style={modalStyles.input}
                  />
                  <label htmlFor="spinners">Spinners:</label>
                  <input
                    type="number"
                    id="spinners"
                    name="spinners"
                    placeholder="Enter Number of Spinners"
                    min="1"
                    value={modalContent.quantities.spinners}
                    onChange={handleInputChange}
                    required
                    style={modalStyles.input}
                  />
                </>
              ) : (
                <>
                  <label htmlFor={modalContent.type}>
                    {modalContent.type.charAt(0).toUpperCase() +
                      modalContent.type.slice(1)}
                    :
                  </label>
                  <input
                    type="number"
                    id={modalContent.type}
                    name={modalContent.type === 'chip' ? 'chips' : 'spinners'}
                    placeholder={`Enter Number of ${
                      modalContent.type.charAt(0).toUpperCase() +
                      modalContent.type.slice(1)
                    }s`}
                    min="1"
                    value={
                      modalContent.quantities[
                        modalContent.type === 'chip' ? 'chips' : 'spinners'
                      ]
                    }
                    onChange={handleInputChange}
                    required
                    style={modalStyles.input}
                  />
                </>
              )}
              <div>
                <button type="submit" style={modalStyles.button}>
                  Submit
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={modalStyles.button}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DefaultLayout>
  );
};

export default VipReward;
