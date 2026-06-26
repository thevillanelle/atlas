-- =============================================================================
-- ATLAS — Home Cities
-- =============================================================================
-- Adds a home_cities JSONB array to user_preferences so users can set
-- which city (or cities) drives their Local news feed instead of the
-- hardcoded NYC default.
--
-- Schema: [{name: string, lat: number, lng: number}]
-- Default: New York City (preserves existing behaviour for all current users)
-- =============================================================================

alter table public.user_preferences
  add column home_cities jsonb not null
  default '[{"name":"New York City","lat":40.7128,"lng":-74.006}]';
