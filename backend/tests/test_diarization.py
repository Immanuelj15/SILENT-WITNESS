from backend.app.transcription.diarization import SpeakerDiarizer

def test_speaker_diarization_heuristics():
    diarizer = SpeakerDiarizer()
    transcript = "Hello, I am calling from your bank. Who is this? Your account will be blocked today."
    turns = diarizer.segment_transcript_into_turns(transcript)

    assert len(turns) >= 2
    # Verify turns contain speaker label and timestamp
    assert turns[0].speaker == "CALLER"
    assert turns[1].speaker == "USER" or turns[0].speaker == "CALLER"
    assert turns[0].timestamp_offset >= 0.0

def test_speaker_diarization_explicit_tags():
    diarizer = SpeakerDiarizer()
    transcript = "Caller: Share your OTP now.\nUser: No, I will not give it."
    turns = diarizer.segment_transcript_into_turns(transcript)

    assert len(turns) == 2
    assert turns[0].speaker == "CALLER"
    assert turns[1].speaker == "USER"
    assert "OTP" in turns[0].text
