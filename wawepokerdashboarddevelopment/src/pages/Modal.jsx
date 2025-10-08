// Modal.jsx
import React from 'react';
import styled from 'styled-components';

const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Modal = ({ showModal, closeModal, title, children, onSubmit }) => {
  if (!showModal) {
    return null;
  }

  return (
    <ModalBackdrop onClick={closeModal}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <h2>{title}</h2>
        <form onSubmit={onSubmit}>
          {children}
          <button type="submit">Submit</button>
          <button type="button" onClick={closeModal}>Cancel</button>
        </form>
      </ModalContent>
    </ModalBackdrop>
  );
};

export default Modal;
