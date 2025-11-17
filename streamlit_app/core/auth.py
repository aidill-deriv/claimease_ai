"""
Local auth for development. Swap to Slack token validation in production.
"""
import os
import hashlib
from typing import Optional

def mask_email(email: str) -> str:
    """Hash email for logging without exposing PII."""
    return hashlib.md5(email.encode()).hexdigest()[:8]

def get_authenticated_email(slack_user_id: Optional[str] = None) -> str:
    """
    Local dev: reads from env var or defaults to test user.
    Production: resolve Slack user_id to email via Slack API.
    """
    if slack_user_id:
        # TODO: Call Slack API to get email from user_id
        # For now, just placeholder
        print(f"[AUTH] Slack user {slack_user_id} would resolve to email via API")
    
    email = os.getenv("LOCAL_USER_EMAIL", "aainaa@regentmarkets.com")
    print(f"[AUTH] Authenticated user (masked): {mask_email(email)}")
    return email

def validate_email(email: str) -> bool:
    """Minimal validation."""
    if not email or "@" not in email:
        return False
    parts = email.split("@")
    return len(parts) == 2 and len(parts[0]) > 0 and len(parts[1]) > 3

def get_slack_user_email(user_id: str, slack_token: str) -> str:
    """
    Fetch email from Slack API given user_id.
    Call this in production when message arrives from Slack.
    """
    try:
        from slack_sdk import WebClient
        client = WebClient(token=slack_token)
        response = client.users_info(user=user_id)
        email = response["user"]["profile"]["email"]
        print(f"[AUTH] Resolved Slack user {user_id} to {mask_email(email)}")
        return email.strip().lower()
    except Exception as e:
        print(f"[AUTH ERROR] Failed to resolve Slack user: {e}")
        raise
