#!/usr/bin/env python3
"""
Lightweight Supabase REST helper for backend tools.
Fetches claim_summary and claim_analysis rows using the service-role key.
"""
import os
from typing import Any, Dict, List, Optional, Tuple

import requests


class SupabaseServiceError(RuntimeError):
    """Raised when Supabase requests fail."""


class SupabaseService:
    """Provides typed helpers for the four ClaimEase tables in Supabase."""

    def __init__(self):
        self.supabase_url = (
            os.getenv("SUPABASE_URL")
            or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
            or os.getenv("NEXT_PUBLIC_SUPABASE_URL".upper())
        )
        self.service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not self.supabase_url or not self.service_key:
            raise SupabaseServiceError(
                "Supabase credentials are missing. "
                "Set SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in config/.env."
            )

        self.summary_table = (
            os.getenv("SUPABASE_SUMMARY_TABLE")
            or os.getenv("NEXT_PUBLIC_SUPABASE_SUMMARY_TABLE")
            or "claim_summary"
        )
        self.analysis_table = (
            os.getenv("SUPABASE_ANALYSIS_TABLE")
            or os.getenv("NEXT_PUBLIC_SUPABASE_ANALYSIS_TABLE")
            or "claim_analysis"
        )
        self.feedback_table = (
            os.getenv("SUPABASE_FEEDBACK_TABLE")
            or os.getenv("NEXT_PUBLIC_SUPABASE_FEEDBACK_TABLE")
            or "claim_ai_feedback"
        )
        self.rest_url = self.supabase_url.rstrip("/") + "/rest/v1"
        self.default_headers = {
            "apikey": self.service_key,
            "Authorization": f"Bearer {self.service_key}",
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Prefer": "count=exact",
        }

    def _request(self, table: str, params: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], Optional[int]]:
        """Execute a GET request against a Supabase table."""
        try:
            response = requests.get(
                f"{self.rest_url}/{table}",
                headers=self.default_headers,
                params=params,
                timeout=15,
            )
            response.raise_for_status()
        except requests.RequestException as exc:
            raise SupabaseServiceError(f"Supabase request failed: {exc}") from exc

        count: Optional[int] = None
        content_range = response.headers.get("Content-Range")
        if content_range and "/" in content_range:
            try:
                count = int(content_range.split("/")[-1])
            except ValueError:
                count = None

        try:
            data = response.json()
        except ValueError as exc:
            raise SupabaseServiceError(f"Failed to parse Supabase response: {exc}") from exc

        return data, count

    def get_claim_summary(self, email: str) -> Optional[Dict[str, Any]]:
        """Return the latest claim_summary row for the user."""
        params = {
            "select": ",".join(
                [
                    "id",
                    "year",
                    "employee_id",
                    "email",
                    "employee_name",
                    "currency",
                    "max_amount",
                    "total_transaction_amount",
                    "remaining_balance",
                ]
            ),
            "email": f"eq.{email.strip().lower()}",
            "order": "year.desc",
            "limit": 1,
        }

        rows, _ = self._request(self.summary_table, params)
        return rows[0] if rows else None

    def get_claim_analysis(
        self,
        email: str,
        *,
        limit: int = 50,
        claim_type: Optional[str] = None,
        exclude_state: Optional[str] = "Complete",
    ) -> List[Dict[str, Any]]:
        """Return claim_analysis rows for the user."""
        params: Dict[str, Any] = {
            "select": ",".join(
                [
                    "id",
                    "record_key",
                    "state",
                    "claim_type",
                    "claim_description",
                    "description",
                    "transaction_amount",
                    "transaction_currency",
                    "date_paid",
                    "date_submitted",
                ]
            ),
            "email": f"eq.{email.strip().lower()}",
            "order": "date_paid.desc.nullslast",
            "limit": max(limit, 1),
        }

        if claim_type:
            params["claim_type"] = f"eq.{claim_type}"
        if exclude_state:
            params["state"] = f"neq.{exclude_state}"

        rows, _ = self._request(self.analysis_table, params)
        return rows

    def insert_feedback(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a single feedback row into Supabase."""
        if not isinstance(payload, dict):
            raise SupabaseServiceError("Feedback payload must be a dict")

        headers = {
            **self.default_headers,
            "Prefer": "return=representation",
        }

        try:
            response = requests.post(
                f"{self.rest_url}/{self.feedback_table}",
                headers=headers,
                json=[payload],
                timeout=15,
            )
            response.raise_for_status()
        except requests.RequestException as exc:
            raise SupabaseServiceError(f"Failed to insert feedback: {exc}") from exc

        try:
            data = response.json()
        except ValueError as exc:
            raise SupabaseServiceError(f"Invalid feedback response: {exc}") from exc

        if not isinstance(data, list) or not data:
            raise SupabaseServiceError("Feedback insert returned no rows")

        return data[0]

    def count_claims(
        self,
        email: str,
        *,
        claim_type: Optional[str] = "Employee Benefit",
        exclude_state: Optional[str] = "Complete",
    ) -> int:
        """Return the total number of claim_analysis rows for the user."""
        params: Dict[str, Any] = {
            "select": "id",
            "email": f"eq.{email.strip().lower()}",
        }
        if claim_type:
            params["claim_type"] = f"eq.{claim_type}"
        if exclude_state:
            params["state"] = f"neq.{exclude_state}"

        rows, count = self._request(self.analysis_table, params)
        if count is not None:
            return count
        return len(rows)

    def build_user_summary(self, email: str) -> Dict[str, Any]:
        """Return a consolidated summary object for quick AI consumption."""
        summary = self.get_claim_summary(email)
        claims = self.get_claim_analysis(email, limit=25, claim_type="Employee Benefit")
        claim_count = len(claims)

        return {
            "profile": summary,
            "recent_claims": claims,
            "claim_count": claim_count,
        }
