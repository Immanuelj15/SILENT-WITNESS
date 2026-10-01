import asyncio
import json
import websockets
import sys

async def run_verification():
    uri = "ws://127.0.0.1:8000/ws/live-call/verification-session-001"
    print(f"[*] Connecting to Silent Witness WebSocket: {uri}")

    try:
        async with websockets.connect(uri) as ws:
            # 1. Receive Handshake
            init_msg = await ws.recv()
            init_data = json.loads(init_msg)
            print(f"[+] Connected! Initial Handshake Received: Type={init_data.get('type')}, Genesis Hash={init_data.get('audit_hash')[:16]}...")

            # 2. Test Digital Arrest Scenario
            print("\n[*] Sending Digital Arrest Coercion Dialogue...")
            await ws.send(json.dumps({
                "type": "TEXT_CHUNK",
                "text": "This is Mumbai Police Cyber Crime Cell. A parcel with drugs was seized under your Aadhaar. You are under digital arrest.",
                "isFinal": False
            }))

            while True:
                resp = await ws.recv()
                data = json.loads(resp)
                if data.get("type") == "STREAM_UPDATE":
                    print(f"[+] Verdict Received:")
                    print(f"    - Threat Level:       {data.get('threat_level')}")
                    print(f"    - Composite Risk:     {data.get('composite_risk')}")
                    print(f"    - Identified Scam:    {data.get('identified_scam_type')}")
                    print(f"    - Chained Audit Hash: {data.get('audit_hash')}")
                    print(f"    - Coaching Directives: {data.get('live_coaching_directives')[:2]}")
                    assert data.get("threat_level") == "CRITICAL", "Threat level should be CRITICAL"
                    assert "Digital Arrest" in data.get("identified_scam_type"), "Should identify Digital Arrest"
                    break

            # 3. Test PII Masking and Remote Access / OTP Coercion
            print("\n[*] Sending Credit Card + OTP demand with sensitive digits...")
            await ws.send(json.dumps({
                "type": "TEXT_CHUNK",
                "text": "Please provide your card 4532 1122 3344 5566 and the 6-digit OTP 987654 to cancel the charge.",
                "isFinal": True
            }))

            while True:
                resp = await ws.recv()
                data = json.loads(resp)
                if data.get("type") == "STREAM_UPDATE":
                    masked = data.get("masked_transcript", "")
                    print(f"[+] PII Masking Verification:")
                    print(f"    - Masked Transcript: {masked}")
                    assert "4532 1122 3344 5566" not in masked, "Credit card should be masked"
                    assert "[CARD_REDACTED]" in masked, "[CARD_REDACTED] tag must be present"
                    assert "987654" not in masked, "OTP should be masked"
                    assert "[OTP_REDACTED]" in masked, "[OTP_REDACTED] tag must be present"
                    print(f"[+] Chained Merkle Block Index: #{data.get('block_index')}, Audit Hash: {data.get('audit_hash')[:16]}...")
                    break

            print("\n========================================================")
            print(" SUCCESS: All Native Android WebSocket Contracts Verified!")
            print("========================================================")

    except Exception as e:
        print(f"[!] WebSocket Verification Failed: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(run_verification())
