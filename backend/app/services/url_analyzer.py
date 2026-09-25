"""
Suspicious Link, URL & APK Phishing Analyzer.

Sections 22 and 23:
Analyzes URLs and download links shared before or during communication calls.
Detects:
- Lookalike / typosquatted domains (e.g., sbi-login-verify.top, hdfc-kyc.link)
- Shortened URLs obscuring destination (bit.ly, tinyurl, t.co)
- Direct APK / Android package downloads bypassing official app stores
- Credential collection indicators
"""

from typing import Dict, List, Any
import re
from urllib.parse import urlparse


SUSPICIOUS_TLDS = [".xyz", ".top", ".club", ".work", ".site", ".live", ".link", ".click", ".info", ".apk"]
SHORTENER_DOMAINS = ["bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "rb.gy"]
TARGET_BRANDS = ["sbi", "hdfc", "icici", "yono", "axis", "paytm", "phonepe", "gpay", "bhim", "rbi", "customs", "police"]


class URLPhishingAnalyzer:
    def __init__(self):
        self.url_regex = re.compile(r'https?://[^\s<>"]+|www\.[^\s<>"]+')

    def extract_urls(self, text: str) -> List[str]:
        return self.url_regex.findall(text)

    def analyze_url(self, url: str) -> Dict[str, Any]:
        """
        Evaluates a single URL for lookalike, APK, or phishing signatures.
        """
        clean_url = url.strip()
        if not clean_url.startswith("http://") and not clean_url.startswith("https://"):
            clean_url = "http://" + clean_url

        try:
            parsed = urlparse(clean_url)
            domain = parsed.netloc.lower()
            path = parsed.path.lower()
        except Exception:
            return {"url": url, "risk": "UNKNOWN", "risk_score": 30, "reasons": ["Malformed URL structure"]}

        reasons = []
        risk_score = 0

        # 1. Check direct APK download
        if path.endswith(".apk") or "download" in path and "apk" in path:
            reasons.append("Direct APK application download link (bypasses official Google Play Store)")
            risk_score += 65

        # 2. Check shortened URL
        if any(s in domain for s in SHORTENER_DOMAINS):
            reasons.append("URL shortener obscures true destination host")
            risk_score += 35

        # 3. Check suspicious/low-reputation TLD
        if any(domain.endswith(tld) for tld in SUSPICIOUS_TLDS):
            reasons.append(f"Domain registered on high-fraud top-level domain ({domain.split('.')[-1]})")
            risk_score += 30

        # 4. Check Brand Lookalike / Typosquatting
        matched_brands = [b for b in TARGET_BRANDS if b in domain]
        if matched_brands:
            # Check if it is the genuine institutional domain
            genuine_domains = ["onlinesbi.sbi", "hdfcbank.com", "icicibank.com", "rbi.org.in", "axisbank.com"]
            is_genuine = any(domain.endswith(g) for g in genuine_domains)
            if not is_genuine:
                reasons.append(f"Lookalike brand name '{matched_brands[0].upper()}' on unofficial host domain: {domain}")
                risk_score += 55

        # 5. IP Address host instead of domain
        if re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', domain):
            reasons.append("Raw IP address used instead of verified registered domain name")
            risk_score += 45

        final_score = min(100, risk_score)
        risk_level = "CRITICAL" if final_score >= 80 else "HIGH" if final_score >= 50 else "SUSPICIOUS" if final_score >= 30 else "LOW"

        return {
            "url": url,
            "domain": domain,
            "risk_score": final_score,
            "risk_level": risk_level,
            "reasons": reasons,
            "is_malicious_suspected": final_score >= 50,
            "recommendation": (
                "DO NOT CLICK OR DOWNLOAD. Unofficial link attempting credential or device takeover."
                if final_score >= 50 else "Proceed with standard caution."
            )
        }

    def analyze_message_links(self, text: str) -> Dict[str, Any]:
        urls = self.extract_urls(text)
        if not urls:
            return {
                "urls_found": 0,
                "highest_risk_score": 0,
                "risk_level": "SAFE",
                "results": []
            }

        evaluations = [self.analyze_url(u) for u in urls]
        highest_score = max(e["risk_score"] for e in evaluations)
        highest_level = max((e["risk_level"] for e in evaluations), key=lambda l: {"CRITICAL": 4, "HIGH": 3, "SUSPICIOUS": 2, "LOW": 1, "SAFE": 0}.get(l, 0))

        return {
            "urls_found": len(urls),
            "highest_risk_score": highest_score,
            "risk_level": highest_level,
            "results": evaluations
        }


url_analyzer = URLPhishingAnalyzer()
