-- Cấu hình bucket cho ảnh đại diện (avatars)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Xóa policies cũ nếu có để tránh lỗi trùng lặp
DROP POLICY IF EXISTS "Avatars are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatars." ON storage.objects;
DROP POLICY IF EXISTS "Users can update avatars." ON storage.objects;
DROP POLICY IF EXISTS "Users can delete avatars." ON storage.objects;

-- Thiết lập lại policies
CREATE POLICY "Avatars are publicly accessible."
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload avatars."
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Users can update avatars."
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Users can delete avatars."
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');
