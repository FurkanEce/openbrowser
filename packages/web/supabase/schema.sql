-- Open Browser SaaS - Supabase Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Enum types
create type run_status as enum ('pending', 'running', 'completed', 'failed', 'cancelled');
create type session_status as enum ('active', 'idle', 'terminated');
create type ai_provider as enum ('openai', 'anthropic', 'google');

-- API Keys (encrypted)
create table api_keys (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  provider ai_provider not null,
  encrypted_key text not null,
  iv text not null,
  label text,
  last_used timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id, provider)
);

-- OAuth Connections
create table oauth_connections (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  provider ai_provider not null,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  scope text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id, provider)
);

-- Agent Runs
create table agent_runs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  task text not null,
  model text not null,
  provider ai_provider not null,
  status run_status default 'pending' not null,
  result text,
  error_message text,
  total_steps integer default 0 not null,
  total_input_tokens integer default 0 not null,
  total_output_tokens integer default 0 not null,
  total_cost_usd numeric(10, 6),
  agent_config jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now() not null
);

-- Agent Steps
create table agent_steps (
  id uuid default uuid_generate_v4() primary key,
  run_id uuid references agent_runs(id) on delete cascade not null,
  step_number integer not null,
  url text,
  agent_output jsonb not null default '{}',
  action_results jsonb not null default '[]',
  input_tokens integer default 0 not null,
  output_tokens integer default 0 not null,
  duration_ms integer default 0 not null,
  error text,
  screenshot_url text,
  created_at timestamptz default now() not null,
  unique(run_id, step_number)
);

-- Browser Sessions
create table browser_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  run_id uuid references agent_runs(id) unique,
  status session_status default 'active' not null,
  browser_info jsonb,
  started_at timestamptz default now() not null,
  ended_at timestamptz
);

-- Usage Records (daily aggregates)
create table usage_records (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  model text not null,
  input_tokens integer default 0 not null,
  output_tokens integer default 0 not null,
  cost_usd numeric(10, 6) default 0 not null,
  run_count integer default 0 not null,
  unique(user_id, date, model)
);

-- Indexes
create index idx_api_keys_user on api_keys(user_id);
create index idx_oauth_connections_user on oauth_connections(user_id);
create index idx_agent_runs_user_status on agent_runs(user_id, status);
create index idx_agent_runs_user_created on agent_runs(user_id, created_at desc);
create index idx_agent_steps_run on agent_steps(run_id);
create index idx_browser_sessions_user_status on browser_sessions(user_id, status);
create index idx_usage_records_user_date on usage_records(user_id, date);

-- Row Level Security
alter table api_keys enable row level security;
alter table oauth_connections enable row level security;
alter table agent_runs enable row level security;
alter table agent_steps enable row level security;
alter table browser_sessions enable row level security;
alter table usage_records enable row level security;

-- RLS Policies: users can only access their own data
create policy "Users can manage their own API keys"
  on api_keys for all using (auth.uid() = user_id);

create policy "Users can manage their own OAuth connections"
  on oauth_connections for all using (auth.uid() = user_id);

create policy "Users can manage their own runs"
  on agent_runs for all using (auth.uid() = user_id);

create policy "Users can view steps of their own runs"
  on agent_steps for all using (
    run_id in (select id from agent_runs where user_id = auth.uid())
  );

create policy "Users can manage their own sessions"
  on browser_sessions for all using (auth.uid() = user_id);

create policy "Users can view their own usage"
  on usage_records for all using (auth.uid() = user_id);

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger api_keys_updated_at
  before update on api_keys
  for each row execute function update_updated_at();

create trigger oauth_connections_updated_at
  before update on oauth_connections
  for each row execute function update_updated_at();
