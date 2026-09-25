# SILENT WITNESS — MASTER DEMO GUIDE (6 SCENARIOS)

This guide documents the 6 interactive attack scenarios configured in Silent Witness, showcasing real-time multi-agent reasoning, attack progression, and deterministic Trust Score degradation.

---

### Scenario 1: Bank Impersonation & Screen-Sharing Scam (Sec. 49 & 52)
* **Channel:** WhatsApp / Online Call
* **Attack Profile:** Scammer claims to be an SBI fraud prevention officer, induces panic over an unverified debit, requests an SMS OTP, and commands the victim to share their mobile screen while opening their banking app.
* **Progression:**
  * Turn 1: Polite Greeting $\to$ Trust: 94 (SAFE)
  * Turn 2: Unverified Identity Claim $\to$ Trust: 78 (GUARDED)
  * Turn 3: 30-Minute Account Blocking Deadline $\to$ Trust: 55 (MEDIUM)
  * Turn 4: Urgent OTP Solicitation $\to$ Trust: 27 (HIGH RISK)
  * Turn 5: Screen Sharing Demand for Banking App $\to$ Trust: 9 (CRITICAL RISK)
* **Intervention:** Full-screen emergency modal: `STOP SCREEN SHARING NOW`.

---

### Scenario 2: Family Emergency Impersonation (Sec. 50)
* **Channel:** SIM Cellular Call
* **Attack Profile:** Scammer impersonates a son or brother claiming to be detained at a police station, demands extreme confidentiality, and insists on immediate UPI money transfer.
* **Progression:**
  * Turn 1: Emotional distress hook $\to$ Trust: 80 (GUARDED)
  * Turn 2: Isolation command ("Do not tell dad or call anyone") $\to$ Trust: 55 (MEDIUM)
  * Turn 3: Immediate ₹50,000 bail payment demand $\to$ Trust: 18 (CRITICAL RISK)
* **Intervention:** `Verify caller identity via an established secondary number before sending money.`

---

### Scenario 3: Video Extortion & Blackmail Lure (Sec. 51)
* **Channel:** Video Call
* **Attack Profile:** Unsolicited video caller attempts to coerce camera activation, induces compromising visual engagement, and threatens to send recordings to victim contacts unless ransom is paid.
* **Progression:**
  * Turn 1: Unknown caller demanding camera activation $\to$ Trust: 74 (GUARDED)
  * Turn 2: Inappropriate visual engagement attempt $\to$ Trust: 42 (MEDIUM)
  * Turn 3: Recording threat & ₹1,00,000 crypto blackmail $\to$ Trust: 10 (CRITICAL RISK)
* **Intervention:** Video Extortion Warning: `DO NOT PAY. Disconnect and cover camera.`

---

### Scenario 4: Remote Access AnyDesk / APK Scam (Sec. 23)
* **Channel:** WhatsApp / Online Call
* **Attack Profile:** Claims to be Airtel 5G technical support, alleges SIM card failure, and instructs victim to install AnyDesk/QuickSupport to enable remote takeover.
* **Progression:**
  * Turn 1: Telecom support pretext $\to$ Trust: 76 (GUARDED)
  * Turn 2: SIM deactivation threat in 10 minutes $\to$ Trust: 48 (MEDIUM)
  * Turn 3: Request for 9-digit AnyDesk code / remote APK $\to$ Trust: 14 (CRITICAL RISK)
* **Intervention:** Remote Access Alert: `Do not provide access codes or download unverified APKs.`

---

### Scenario 5: AI Voice CEO Impersonation (Sec. 53)
* **Channel:** Secure Own-VoIP / WebRTC
* **Attack Profile:** Synthetic voice clone of corporate CEO claiming urgent board acquisition negotiations, demanding confidential wire transfer to a foreign law firm.
* **Progression:**
  * Turn 1: Executive authority claim $\to$ Trust: 72 (GUARDED)
  * Turn 2: Acoustic spectral anomalies detected + secrecy command $\to$ Trust: 46 (MEDIUM)
  * Turn 3: Immediate $250,000 wire transfer demand $\to$ Trust: 19 (HIGH RISK)
* **Intervention:** Voice Authenticity Warning: `Synthetic voice signal detected. Authenticate via corporate protocol.`

---

### Scenario 6: Legitimate Routine Call (Sec. 54)
* **Channel:** SIM Cellular Call
* **Demonstration Goal:** Zero False Positives.
* **Dialogue:** Hospital reception calling to confirm doctor appointment and reminding patient to bring their physical insurance card.
* **Result:** Trust Score remains **95–96 (SAFE)** with zero coercive interventions.
