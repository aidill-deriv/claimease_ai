-- Enable pgvector extension if not already enabled
create extension if not exists vector;

-- RPC for similarity search on claim_knowledge_chunks
create or replace function public.match_claim_knowledge_chunks(
    query_embedding vector(384),
    match_count int default 3,
    filter_country text default null,
    filter_category text default null
)
returns table (
    id uuid,
    content text,
    metadata jsonb,
    embedding vector,
    similarity float
)
language plpgsql
stable
as
$$
begin
    return query
    select
        ckc.id,
        ckc.content,
        ckc.metadata,
        ckc.embedding,
        1 - (ckc.embedding <=> query_embedding) as similarity
    from claim_knowledge_chunks ckc
    where (filter_country is null or lower(ckc.country) = lower(filter_country))
      and (
        filter_category is null
        or lower(coalesce(ckc.metadata ->> 'category', '')) = lower(filter_category)
      )
    order by ckc.embedding <=> query_embedding
    limit match_count;
end;
$$;

grant execute on function public.match_claim_knowledge_chunks(vector, int, text, text) to anon, authenticated, service_role;
