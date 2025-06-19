// src/components/ImageUpload.js
import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function ImageUpload({ itemId, onUpload, bucket = 'menu-items' }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const uploadImage = async (event) => {
    try {
      setUploading(true);
      setError(null);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Use JPEG, PNG, or GIF.');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size exceeds 5MB.');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${itemId}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase
        .storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase
        .storage
        .from(bucket)
        .getPublicUrl(fileName);

      if (onUpload) onUpload(publicUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="image-upload">
      <label className="upload-label">
        {uploading ? 'Uploading...' : 'Select Image'}
        <input
          type="file"
          accept="image/*"
          onChange={uploadImage}
          disabled={uploading}
          style={{ display: 'none' }}
        />
      </label>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}