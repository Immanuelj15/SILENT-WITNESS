import React from 'react';
import { X } from 'lucide-react';
import CapabilitiesPage from './CapabilitiesPage';

export default function PlatformCapabilityMatrixModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        padding: '20px',
      }}
    >
      <div
        className="sw-card"
        style={{
          width: '100%',
          maxWidth: '1050px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          position: 'relative',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <button
          onClick={onClose}
          className="btn-ghost"
          style={{ position: 'absolute', right: '16px', top: '16px', padding: '6px' }}
        >
          <X size={20} />
        </button>
        <CapabilitiesPage />
      </div>
    </div>
  );
}
