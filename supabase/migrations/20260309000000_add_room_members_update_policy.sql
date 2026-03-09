-- Allow room members to update rows in rooms they belong to (needed for color swaps)
CREATE POLICY "Room members can update membership"
  ON public.room_members FOR UPDATE TO authenticated
  USING (public.is_room_member(room_id));
