from backend.app.risk.attribution import AttributionEngine

def test_severity_tier_mapping():
    engine = AttributionEngine()

    tier_100 = engine.get_severity_tier(95)
    assert tier_100["tier"] == "MONITOR"

    tier_70 = engine.get_severity_tier(70)
    assert tier_70["tier"] == "CAUTION"

    tier_40 = engine.get_severity_tier(40)
    assert tier_40["tier"] == "WARN"

    tier_10 = engine.get_severity_tier(10)
    assert tier_10["tier"] == "BLOCK_RECOMMEND_HANGUP"

def test_feature_deductions_calculation():
    engine = AttributionEngine()
    attributions = engine.compute_attributions(
        evidence_items=[],
        demands=["OTP Request"],
        tactics=["Urgency & Pressure"],
        claimed_identity="Bank Representative",
        voice_risk=75.0,
        is_synthetic=True
    )

    assert len(attributions) >= 3
    # Check that deductions are negative points
    assert any(a.deduction_points < 0 for a in attributions)
    assert any("OTP" in a.feature_name for a in attributions)
