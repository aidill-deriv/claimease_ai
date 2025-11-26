#!/usr/bin/env python3
"""
Export embeddings from a local Chroma DB collection into a SQL file that can be
run in Supabase (or any Postgres with pgvector) to seed a table manually.

Example:
    python3 knowledge_base/export_chroma_to_sql.py \
        --chroma-path knowledge_base/chroma_db \
        --collection knowledge_base \
        --table knowledge_chunks_malaysia \
        --output knowledge_base/exports/knowledge_chunks_malaysia.sql
"""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import List

import chromadb


def format_sql_literal(value: str) -> str:
    """Escape single quotes for SQL literal usage."""
    return "'" + value.replace("'", "''") + "'"


def format_metadata(meta: dict | None) -> str:
    payload = meta or {}
    return format_sql_literal(json.dumps(payload, ensure_ascii=False)) + "::jsonb"


def format_embedding(values: List[float]) -> str:
    numbers = ",".join(f"{float(v):.6f}" for v in values)
    return f"'[{numbers}]'::vector"


def export_to_sql(
    chroma_path: str,
    collection_name: str,
    table: str,
    output: Path,
    country: str | None = None,
) -> None:
    client = chromadb.PersistentClient(path=chroma_path)
    collection = client.get_collection(name=collection_name)
    count = collection.count()

    if count == 0:
        raise SystemExit(f"[ERROR] Collection '{collection_name}' at '{chroma_path}' is empty.")

    data = collection.get(include=["documents", "metadatas", "embeddings"])
    rows = list(
        zip(data["documents"], data["metadatas"], data["embeddings"])
    )

    output.parent.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S %Z")

    with output.open("w", encoding="utf-8") as fh:
        fh.write(f"-- Auto-generated on {timestamp}\n")
        fh.write(f"-- Source collection: {collection_name} (from {chroma_path})\n")
        fh.write(f"-- Total chunks: {len(rows)}\n\n")
        fh.write("BEGIN;\n\n")

        for idx, (doc, metadata, embedding) in enumerate(rows, start=1):
            if doc is None:
                continue

            content_sql = format_sql_literal(doc)
            metadata_sql = format_metadata(metadata)
            embedding_sql = format_embedding(embedding)

            columns = ["content", "metadata", "embedding"]
            values = [content_sql, metadata_sql, embedding_sql]

            if country:
                columns.append("country")
                values.append(format_sql_literal(country.lower()))

            columns_sql = ", ".join(columns)
            values_sql = ",\n  ".join(values)

            fh.write(
                f"INSERT INTO {table} ({columns_sql})\n"
                f"VALUES (\n  {values_sql}\n);\n\n"
            )

        fh.write("COMMIT;\n")

    print(f"[SUCCESS] Wrote {len(rows)} INSERT statements to {output}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export Chroma collection to SQL inserts.")
    parser.add_argument("--chroma-path", default="knowledge_base/chroma_db", help="Path to Chroma DB directory")
    parser.add_argument("--collection", default="knowledge_base", help="Chroma collection name")
    parser.add_argument("--table", default="knowledge_chunks_malaysia", help="Target Supabase table name")
    parser.add_argument(
        "--output",
        default="knowledge_base/exports/knowledge_chunks_malaysia.sql",
        help="Path to write the SQL file",
    )
    parser.add_argument(
        "--country",
        default=None,
        help="Optional country literal to include in each INSERT (stored lowercase)",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    export_to_sql(args.chroma_path, args.collection, args.table, Path(args.output), args.country)


if __name__ == "__main__":
    main()
