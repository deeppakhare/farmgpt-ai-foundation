-- Trigger-only helpers: no one should call them directly via the API.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- has_role is intentionally executable by authenticated users:
-- RLS policies invoke it to check roles. Keep authenticated EXECUTE,
-- but revoke from anon and PUBLIC to minimize exposure.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;