import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Shield,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import apiClient from '../utils/apiClient';

const KNOWLEDGE_ARTICLES = [
  {
    id: 'bank_scams',
    title: 'Bank & Financial Support Impersonation',
    category: 'Banking',
    whatHappens: 'Scammers call posing as fraud investigators, branch managers, or card security agents. They claim an unauthorized debit of ₹25,000–₹50,000 has occurred and that your account will be permanently blocked unless verified.',
    warningSigns: [
      'Caller demands urgent verification to "reverse" a fake unauthorized debit.',
      'Caller creates artificial countdown deadlines ("within 30 minutes").',
      'Caller asks you to verify account details they should already have on file.',
      'Caller insists you do not disconnect or visit your physical local branch.'
    ],
    whatToDo: [
      'Immediately hang up the incoming phone call.',
      'Check your actual bank account balance using your bank\'s official mobile app.',
      'Dial the toll-free customer service number printed on the back of your debit card.',
      'Report the suspicious phone number to cybercrime.gov.in (Helpline 1930).'
    ],
    whatNotToDo: [
      'NEVER share debit card CVV, PIN, or net banking passwords.',
      'NEVER read out one-time passwords (OTPs) sent to your phone.',
      'NEVER install remote access applications like AnyDesk or TeamViewer.',
      'NEVER transfer money to any "RBI Safe Reserve" or temporary escrow account.'
    ]
  },
  {
    id: 'upi_scams',
    title: 'UPI QR Code & "Collect Request" Inversion',
    category: 'UPI Scams',
    whatHappens: 'Scammer poses as a buyer on OLX/Marketplace or someone refunding excess money. They send a QR code or UPI collect link claiming you must "scan it or enter your PIN to receive money".',
    warningSigns: [
      'Caller claims you must enter your 4 or 6-digit secret UPI PIN to "receive a refund".',
      'Caller sends a QR code via WhatsApp chat and tells you to scan it in PhonePe or Google Pay.',
      'Lure of instant cash or cashback reward.'
    ],
    whatToDo: [
      'Remember: UPI PIN is ONLY entered to deduct money from your account, never to receive money.',
      'Decline all unexpected UPI collect requests.',
      'Block the caller immediately on UPI apps.'
    ],
    whatNotToDo: [
      'NEVER enter your UPI PIN to receive money, cashback, or refunds.',
      'NEVER scan QR codes sent over WhatsApp from unknown buyers.'
    ]
  },
  {
    id: 'otp_scams',
    title: 'One-Time Password (OTP) Social Engineering',
    category: 'OTP Scams',
    whatHappens: 'Scammers trigger a password reset or bank transfer on your account and immediately call posing as customer support, parcel delivery, or SIM verification to talk you into disclosing the incoming SMS code.',
    warningSigns: [
      'Caller asks you to read out "verification numbers" sent via SMS.',
      'SMS text explicitly states "Do not share this code with anyone, including bank staff".',
      'Caller claims the code is needed to "cancel an unauthorized order".'
    ],
    whatToDo: [
      'Read the full text of SMS messages carefully before acting on them.',
      'If you receive an unsolicited OTP, immediately change your account password.',
      'Lock your netbanking profile through official netbanking portals.'
    ],
    whatNotToDo: [
      'NEVER disclose OTPs to anyone, even if the caller caller-ID says "Bank Officer".',
      'NEVER forward OTP SMS messages to unfamiliar phone numbers.'
    ]
  },
  {
    id: 'digital_arrest',
    title: 'Digital Arrest & Law Enforcement Extortion',
    category: 'Digital Arrest',
    whatHappens: 'Scammers impersonate CBI, Mumbai Police, Narcotics Control Bureau (NCB), or Delhi Crime Branch. They claim a parcel with illegal drugs or forged passports was seized in your name and place you under fake "Digital Arrest" via WhatsApp video.',
    warningSigns: [
      'Caller claims you are under "Digital Arrest" and cannot leave your room.',
      'Caller wears fake police uniforms, shows forged arrest warrants or police seals.',
      'Caller insists on complete isolation: forbids speaking to family or advocates.',
      'Demands deposit into "Supreme Court verification accounts" to avoid immediate physical arrest.'
    ],
    whatToDo: [
      'Remember: Indian Law Enforcement NEVER conducts arrests or judicial inquiries over WhatsApp video calls.',
      'Terminate the video call immediately.',
      'Report the extortion attempt to National Cyber Crime Helpline (1930) or local police station.'
    ],
    whatNotToDo: [
      'DO NOT panic or isolate yourself in your room.',
      'DO NOT transfer any money for "clearance verification" or "bail deposits".',
      'DO NOT show your Aadhaar card or passports on video call.'
    ]
  },
  {
    id: 'screen_sharing',
    title: 'Screen-Sharing & Remote Access Fraud',
    category: 'Screen Sharing',
    whatHappens: 'Caller poses as technical support or KYC officer, moves the call to WhatsApp Video, and guides you to tap "Share Screen". As you type passwords and receive OTPs, the scammer watches live and drains accounts.',
    warningSigns: [
      'Caller asks you to tap the "Share Screen" icon on WhatsApp, Telegram, or Zoom.',
      'Caller instructs you to install AnyDesk, TeamViewer, RustDesk, or QuickSupport.',
      'Caller asks you to open your net banking or UPI app while screen share is active.'
    ],
    whatToDo: [
      'Stop screen sharing immediately the moment financial apps are mentioned.',
      'Uninstall any newly installed remote desktop apps.',
      'Disconnect Wi-Fi/Mobile Data if unauthorized control is observed.'
    ],
    whatNotToDo: [
      'NEVER share your screen with unknown callers.',
      'NEVER open banking apps or type passwords while screen sharing is active.'
    ]
  },
  {
    id: 'video_extortion',
    title: 'Video Extortion & Sextortion Blackmail',
    category: 'Video Extortion',
    whatHappens: 'Unknown international number initiates a WhatsApp video call. Once answered, they play explicit pre-recorded video, record your face on screen, and threaten to broadcast the doctored clip to all your contacts.',
    warningSigns: [
      'Unsolicited video call from unknown number or unfamiliar country code (+234, +92, etc.).',
      'Explicit or compromising content appears within seconds of answering.',
      'Immediate blackmail messages demanding payment within minutes.'
    ],
    whatToDo: [
      'Disconnect the video call immediately.',
      'Do not pay — payment NEVER stops extortion, it only invites bigger demands.',
      'Block and report the contact on WhatsApp.',
      'File an immediate complaint at cybercrime.gov.in.'
    ],
    whatNotToDo: [
      'DO NOT answer video calls from unknown foreign numbers.',
      'DO NOT panic or send any money.',
      'DO NOT delete chat logs — save screenshots as evidence for law enforcement.'
    ]
  },
  {
    id: 'ai_voice',
    title: 'AI Voice Cloning & Deepfake Family Impersonation',
    category: 'AI Voice Scams',
    whatHappens: 'Using a 5-second audio sample harvested from social media videos, attackers generate a synthetic clone of your son, daughter, or spouse. They call in tears claiming a car crash or police custody and demand instant bail cash.',
    warningSigns: [
      'Caller sounds exactly like a family member but claims their original phone is broken or dead.',
      'Extreme emotional distress, crying, or background sirens to mask audio artifacts.',
      'Demand for money transfer to an unfamiliar third-party UPI ID or hospital account.'
    ],
    whatToDo: [
      'Hang up and call your family member back on their known, regular phone number.',
      'Establish a family "Safe Word" known only to your immediate household.',
      'Ask a personal question that an AI clone cannot answer (e.g., "What was the name of our first dog?").'
    ],
    whatNotToDo: [
      'NEVER wire money impulsively under emotional distress.',
      'NEVER trust caller ID display alone when money is demanded urgently.'
    ]
  }
];

export default function ScamKnowledgeBase({ isOpen, onClose, isFullPage = true }) {
  const [selectedArticle, setSelectedArticle] = useState(KNOWLEDGE_ARTICLES[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArticles = KNOWLEDGE_ARTICLES.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.whatHappens.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
            <BookOpen size={18} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Scam Intelligence & Defense Playbooks
          </h2>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Comprehensive educational guides and behavioral counter-strategies for modern telecommunications fraud.
        </p>
      </div>

      {/* Search Input */}
      <div className="sw-card" style={{ padding: '14px 18px', maxWidth: '420px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search scam playbooks (e.g. UPI, Screen share)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sw-input"
            style={{ paddingLeft: '32px', height: '34px', fontSize: '13px' }}
          />
        </div>
      </div>

      {/* 2-Column: Left Article Index vs Right Selected Content */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Left List of Playbooks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredArticles.map((art) => {
            const isSelected = selectedArticle.id === art.id;
            return (
              <div
                key={art.id}
                onClick={() => setSelectedArticle(art)}
                className="sw-card sw-card-interactive"
                style={{
                  padding: '16px',
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                  backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--surface)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                    {art.category}
                  </span>
                  <ChevronRight size={14} style={{ color: isSelected ? 'var(--primary)' : 'var(--text-muted)' }} />
                </div>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {art.title}
                </h4>
              </div>
            );
          })}
        </div>

        {/* Right Article Deep-Dive (Section 29) */}
        {selectedArticle && (
          <div className="sw-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <span className="badge badge-primary" style={{ marginBottom: '8px' }}>
                {selectedArticle.category} Playbook
              </span>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {selectedArticle.title}
              </h3>
            </div>

            {/* What Happens */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                What Happens
              </h4>
              <p style={{ fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                {selectedArticle.whatHappens}
              </p>
            </div>

            {/* Warning Signs */}
            <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--warning-bg)', border: '1px solid var(--warning-border)' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--warning-text)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={15} />
                <span>Warning Signs</span>
              </h4>
              <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-primary)' }}>
                {selectedArticle.warningSigns.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>

            {/* 2-Columns: What To Do vs What NOT To Do */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {/* What To Do */}
              <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--success-bg)', border: '1px solid var(--success-border)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--success-text)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={15} />
                  <span>What To Do</span>
                </h4>
                <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', color: 'var(--text-primary)' }}>
                  {selectedArticle.whatToDo.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* What NOT To Do */}
              <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger-border)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--danger-text)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <XCircle size={15} />
                  <span>What NOT To Do</span>
                </h4>
                <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', color: 'var(--text-primary)' }}>
                  {selectedArticle.whatNotToDo.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
