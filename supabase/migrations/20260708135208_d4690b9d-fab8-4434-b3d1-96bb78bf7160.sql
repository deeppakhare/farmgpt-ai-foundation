DROP POLICY IF EXISTS "Anyone can submit a contact message" ON public.contact_messages;

CREATE POLICY "Anyone can submit a valid contact message"
  ON public.contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(btrim(name)) BETWEEN 1 AND 100
    AND char_length(btrim(email)) BETWEEN 3 AND 255
    AND email LIKE '%_@_%.__%'
    AND char_length(btrim(message)) BETWEEN 5 AND 2000
  );