from sqlalchemy.orm import Session
from . import models

def log_activity(db: Session, entity_type: str, entity_id: str, action: str, details: str = None):
    """Creates and saves an audit log entry."""
    log_entry = models.AuditLog(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        details=details
    )
    db.add(log_entry)