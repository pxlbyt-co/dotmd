-- Add source_url to configs for attributing externally-sourced configs
alter table configs add column source_url text;
