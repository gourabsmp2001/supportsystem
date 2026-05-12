import { ImagePlus, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { compressImage } from '../lib/compressImage';
import { supabase } from '../lib/supabaseClient';
import { toast } from './Toast';

export default function PhotoUploader({ value, onChange }) {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Compress the image in browser before uploading
      const compressed = await compressImage(file);
      const filePath = `visits/${Date.now()}-${crypto.randomUUID()}.jpg`;

      const { error } = await supabase.storage.from('retail-visit-photos').upload(filePath, compressed, {
        contentType: 'image/jpeg',
      });

      if (error) {
        toast.error(`Upload failed: ${error.message}`);
        setUploading(false);
        return;
      }

      const { data } = supabase.storage.from('retail-visit-photos').getPublicUrl(filePath);
      onChange({ photo_url: data.publicUrl, photo_path: filePath });
      toast.success('Photo uploaded successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to process image.');
    } finally {
      setUploading(false);
    }

    // Reset the file input so the same file can be re-selected
    event.target.value = '';
  }

  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 text-center">
        {uploading ? <Loader2 className="h-6 w-6 animate-spin text-red-700" /> : <ImagePlus className="h-6 w-6 text-red-700" />}
        <span className="text-sm font-semibold text-slate-700">{value ? 'Replace visit photo' : 'Upload visit photo'}</span>
        <span className="text-xs text-slate-400">JPEG, PNG, or WebP · Max 5 MB (auto-compressed)</span>
        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} disabled={uploading} />
      </label>
      {value ? (
        <a href={value} target="_blank" rel="noreferrer" className="mt-3 block truncate text-center text-sm font-semibold text-red-700 underline">
          View uploaded photo
        </a>
      ) : null}
    </div>
  );
}
