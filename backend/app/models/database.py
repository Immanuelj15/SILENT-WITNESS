import datetime
from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from backend.app.core.config import settings

Base = declarative_base()
engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class CallAnalysisRecord(Base):
    __tablename__ = "call_analyses"

    id = Column(String(36), primary_key=True, index=True)
    source_type = Column(String(50), default="live")  # live, audio_upload, text_input
    transcript = Column(Text, default="")
    classification = Column(String(50), default="SAFE")
    risk_score = Column(Integer, default=0)
    trust_score = Column(Integer, default=100)
    confidence = Column(Float, default=0.85)
    category = Column(String(100), default="Legitimate Conversation")
    recommendation = Column(String(100), default="CONVERSATION APPEARS SAFE")
    duration_sec = Column(Float, default=0.0)
    language = Column(String(20), default="en")
    is_provisional = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    risk_factors = relationship("RiskFactorRecord", back_populates="call_analysis", cascade="all, delete-orphan")
    evidence_items = relationship("EvidenceRecord", back_populates="call_analysis", cascade="all, delete-orphan")

class RiskFactorRecord(Base):
    __tablename__ = "risk_factors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    call_id = Column(String(36), ForeignKey("call_analyses.id"))
    factor_name = Column(String(150))
    severity = Column(String(20), default="MEDIUM")
    call_analysis = relationship("CallAnalysisRecord", back_populates="risk_factors")

class EvidenceRecord(Base):
    __tablename__ = "evidence_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    call_id = Column(String(36), ForeignKey("call_analyses.id"))
    exact_phrase = Column(Text)
    tag = Column(String(100))
    grounded = Column(Boolean, default=True)
    call_analysis = relationship("CallAnalysisRecord", back_populates="evidence_items")

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
