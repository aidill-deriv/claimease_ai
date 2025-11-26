#!/usr/bin/env python3
"""
Utility to migrate documents from the local Chroma DB into a Supabase pgvector table.

Example:
    SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \\
    python3 knowledge_base/migrate_chroma_to_supabase.py \\
        --chroma-path chroma_db \\
        --collection knowledge_base \\
        --table knowledge_chunks_malaysia \\
        --country Malaysia
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from typing import Dict, Iterable, List

import chromadb
import requests
try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover
    load_dotenv = None

if load_dotenv:
    # Load root .env plus config/.env if present
    load_dotenv()
    config_env = Path(__file__).resolve().parents[1] / "config" / ".env"
    if config_env.exists():
        load_dotenv(config_env)


def get_env_var(name: str) -> str:
    """Fetch required environment variables with a clear error."""
    value = os.getenv(name)
    if not value:
        print(f"[ERROR] Missing required environment variable: {name}", file=sys.stderr)
        sys.exit(1)
    return value


def batched(sequence: List[Dict], size: int) -> Iterable[List[Dict]]:
    """Yield fixed-size batches from a list."""
    for idx in range(0, len(sequence), size):
        yield sequence[idx : idx + size]


def normalize_country(value: str | None, default_country: str) -> str:
    """Lowercase and sanitize the country value for consistent filtering."""
    if value:
        return value.strip().lower()
    return default_country.strip().lower()


def normalize_metadata(meta: Dict | None, chroma_id: str, country: str) -> Dict:
    """Ensure metadata is JSON-serializable and enriched with IDs/country."""
    meta = meta.copy() if meta else {}
    original_country = meta.get("country")
    meta["country"] = normalize_country(original_country, country)
    meta["chroma_id"] = chroma_id
    # Keep original country casing for reference if provided
    if meta.get("country_original") is None and original_country:
        meta["country_original"] = original_country
    return meta


def load_from_chroma(path: str, collection_name: str, batch_size: int) -> Dict[str, List]:
    """Stream all entries from the Chroma collection."""
    client = chromadb.PersistentClient(path=path)
    collection = client.get_collection(name=collection_name)
    total = collection.count()

    if total == 0:
        print(f"[WARN] Collection '{collection_name}' at '{path}' has no documents.")
        return {"ids": [], "documents": [], "metadatas": [], "embeddings": []}

    print(f"[INFO] Found {total} documents in '{collection_name}' (path: {path}).")

    aggregated = {"ids": [], "documents": [], "metadatas": [], "embeddings": []}
    offset = 0

    while offset < total:
        chunk = collection.get(
            include=["documents", "metadatas", "embeddings"],
            limit=batch_size,
            offset=offset,
        )
        fetched = len(chunk["ids"])
        if fetched == 0:
            break

        aggregated["ids"].extend(chunk["ids"])
        aggregated["documents"].extend(chunk["documents"])
        aggregated["metadatas"].extend(chunk["metadatas"])
        aggregated["embeddings"].extend(chunk["embeddings"])

        offset += fetched
        print(f"[INFO] Pulled {offset}/{total} records from Chroma...")

    return aggregated


def supabase_credentials() -> Dict[str, str]:
    """Load Supabase URL and service key from env vars."""
    return {
        "url": get_env_var("SUPABASE_URL").rstrip("/"),
        "service_key": get_env_var("SUPABASE_SERVICE_ROLE_KEY"),
    }


def prepare_rows(
    dataset: Dict[str, List],
    default_country: str,
) -> List[Dict]:
    """Convert Chroma payload into Supabase-ready rows."""
    rows: List[Dict] = []
    for chroma_id, doc, meta, embedding in zip(
        dataset["ids"],
        dataset["documents"],
        dataset["metadatas"],
        dataset["embeddings"],
    ):
        normalized_meta = normalize_metadata(meta, chroma_id, default_country)

        if doc is None:
            continue

        row = {
            "content": doc,
            "metadata": normalized_meta,
            "embedding": [float(x) for x in embedding],
        }
        rows.append(row)
    return rows


def insert_rows(creds: Dict[str, str], table: str, rows: List[Dict], batch_size: int) -> None:
    """Insert rows into Supabase in batches."""
    total = len(rows)
    if total == 0:
        print("[WARN] Nothing to insert. Exiting.")
        return

    rest_url = f"{creds['url']}/rest/v1/{table}"
    headers = {
        "apikey": creds["service_key"],
        "Authorization": f"Bearer {creds['service_key']}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    print(f"[INFO] Inserting {total} rows into '{table}' via {rest_url} ...")
    inserted = 0

    for batch in batched(rows, batch_size):
        response = requests.post(rest_url, headers=headers, json=batch, timeout=60)
        if response.status_code >= 400:
            print(
                f"[ERROR] Supabase insert failed with status {response.status_code}: {response.text}",
                file=sys.stderr,
            )
            sys.exit(1)

        inserted += len(batch)
        print(f"[INFO] Inserted {inserted}/{total} rows into Supabase...")

    print(f"[SUCCESS] Completed inserting {total} rows into '{table}'.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Replicate local Chroma embeddings into a Supabase pgvector table.",
    )
    parser.add_argument("--chroma-path", default="chroma_db", help="Chroma persistence directory")
    parser.add_argument("--collection", default="knowledge_base", help="Chroma collection name")
    parser.add_argument(
        "--table",
        default="knowledge_chunks_malaysia",
        help="Supabase table to upsert chunks into",
    )
    parser.add_argument(
        "--country",
        default="Malaysia",
        help="Default country to tag if metadata does not contain one",
    )
    parser.add_argument(
        "--fetch-batch-size",
        type=int,
        default=100,
        help="How many rows to request from Chroma at a time",
    )
    parser.add_argument(
        "--insert-batch-size",
        type=int,
        default=100,
        help="How many rows to insert into Supabase per request",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    dataset = load_from_chroma(args.chroma_path, args.collection, args.fetch_batch_size)
    rows = prepare_rows(dataset, args.country)
    credentials = supabase_credentials()
    insert_rows(credentials, args.table, rows, args.insert_batch_size)


if __name__ == "__main__":
    main()
