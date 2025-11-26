#!/usr/bin/env python3
"""Supabase-backed knowledge base retriever."""

from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional

import requests
from langchain_core.documents import Document
from langchain_community.embeddings import HuggingFaceEmbeddings


class SupabaseKnowledgeStore:
    """Fetch vector matches from Supabase pgvector via RPC."""

    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        self.service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not self.supabase_url or not self.service_key:
            raise RuntimeError(
                "Supabase credentials missing. Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) "
                "and SUPABASE_SERVICE_ROLE_KEY to enable Supabase knowledge base."
            )

        self.rpc_function = os.getenv("SUPABASE_KB_MATCH_RPC", "match_claim_knowledge_chunks")
        self.default_country = (os.getenv("KNOWLEDGE_BASE_COUNTRY") or "malaysia").strip().lower()

        model_name = os.getenv("KNOWLEDGE_BASE_EMBEDDING_MODEL", "all-MiniLM-L6-v2")
        self._embedding_error: Optional[Exception] = None
        self.embeddings: Optional[HuggingFaceEmbeddings] = None

        try:
            self.embeddings = HuggingFaceEmbeddings(
                model_name=model_name,
                model_kwargs={"device": "cpu"},
                encode_kwargs={"normalize_embeddings": True},
            )
        except Exception as exc:
            # Defer the failure until a KB tool is invoked so the API can start without internet access.
            self._embedding_error = exc
            self.embeddings = None
            print(
                "[SUPABASE_KB] ⚠️  Failed to load HuggingFace embeddings "
                f"({exc}). Knowledge base responses will be unavailable."
            )

    def _ensure_embeddings(self) -> HuggingFaceEmbeddings:
        if self.embeddings is None:
            raise RuntimeError(
                "Knowledge base embeddings unavailable."
                + (f" Root cause: {self._embedding_error}" if self._embedding_error else "")
            )
        return self.embeddings

    def _rpc_payload(
        self,
        query_vector: List[float],
        k: int,
        filter_dict: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        payload: Dict[str, Any] = {
            "query_embedding": query_vector,
            "match_count": k,
        }
        country = (filter_dict or {}).get("country", self.default_country)
        if country:
            payload["filter_country"] = str(country).strip().lower()
        category = (filter_dict or {}).get("category")
        if category:
            payload["filter_category"] = str(category).strip().lower()
        return payload

    def search(
        self,
        query: str,
        k: int = 3,
        filter_dict: Optional[Dict[str, Any]] = None,
    ) -> List[Document]:
        """Return LangChain Documents from Supabase similarity search."""
        embeddings = self._ensure_embeddings()
        query_vector = embeddings.embed_query(query)
        payload = self._rpc_payload(query_vector, k, filter_dict)

        headers = {
            "apikey": self.service_key,
            "Authorization": f"Bearer {self.service_key}",
            "Content-Type": "application/json",
        }
        rpc_url = f"{self.supabase_url.rstrip('/')}/rest/v1/rpc/{self.rpc_function}"
        response = requests.post(rpc_url, headers=headers, data=json.dumps(payload), timeout=60)

        if response.status_code >= 400:
            raise RuntimeError(
                f"Supabase knowledge base query failed ({response.status_code}): {response.text}"
            )

        rows = response.json()
        documents: List[Document] = []
        for row in rows:
            metadata = row.get("metadata") or {}
            if "country" not in metadata and "country" in payload:
                metadata["country"] = payload["filter_country"]
            documents.append(Document(page_content=row.get("content", ""), metadata=metadata))

        return documents

    def search_with_scores(
        self,
        query: str,
        k: int = 3,
        filter_dict: Optional[Dict[str, Any]] = None,
    ) -> List[Any]:
        """Return documents and similarity scores."""
        embeddings = self._ensure_embeddings()
        query_vector = embeddings.embed_query(query)
        payload = self._rpc_payload(query_vector, k, filter_dict)

        headers = {
            "apikey": self.service_key,
            "Authorization": f"Bearer {self.service_key}",
            "Content-Type": "application/json",
        }
        rpc_url = f"{self.supabase_url.rstrip('/')}/rest/v1/rpc/{self.rpc_function}"
        response = requests.post(rpc_url, headers=headers, data=json.dumps(payload), timeout=60)

        if response.status_code >= 400:
            raise RuntimeError(
                f"Supabase knowledge base query failed ({response.status_code}): {response.text}"
            )

        rows = response.json()
        results: List[Any] = []
        for row in rows:
            metadata = row.get("metadata") or {}
            if "country" not in metadata and "filter_country" in payload:
                metadata["country"] = payload["filter_country"]
            doc = Document(page_content=row.get("content", ""), metadata=metadata)
            results.append((doc, row.get("similarity")))

        return results
