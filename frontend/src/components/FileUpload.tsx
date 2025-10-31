import { useState } from 'react';

interface Props {
  onResult: (data: any) => void;
}

export default function FileUpload({ onResult }: Props) {
  const [uploading, setUploading] = useState(false);

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch((import.meta as ImportMeta).env?.VITE_API_BASE + '/api/notes/import', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      onResult(data);
    } catch (e) {
      console.error('Upload failed', e);
      alert('Upload failed');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div style={{ margin: '12px 0' }}>
      <label style={{ display: 'block', padding: 12, border: '2px dashed #e5e7eb', borderRadius: 8, cursor: 'pointer', background: '#fff' }}>
        <input type="file" accept=".txt,.md,.doc,.docx" onChange={onChange} style={{ display: 'none' }} />
        {uploading ? '📤 Uploading and analyzing…' : '📁 Click to import .txt/.md/.docx'}
      </label>
    </div>
  );
}