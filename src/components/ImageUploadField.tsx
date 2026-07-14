/**
 * Drag & drop / click-to-choose image upload — stores the image as a data URI
 * (no backend). Matches the dashed drop-zone style already used for logo uploads.
 */
import { useRef, useState } from 'react'
import { X } from 'lucide-react'

interface ImageUploadFieldProps {
  value: string | null
  onChange: (dataUrl: string | null) => void
  placeholder?: string
}

export function ImageUploadField({ value, onChange, placeholder }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        handleFile(e.dataTransfer.files[0])
      }}
      style={{
        border: `1.5px dashed ${dragOver ? 'var(--brand)' : 'var(--border-strong)'}`,
        borderRadius: 10,
        padding: value ? 10 : '20px 12px',
        textAlign: 'center',
        background: 'var(--surface)',
        cursor: 'pointer',
        transition: 'border-color 0.12s ease',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {value ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <img src={value} alt="" style={{ height: 32, maxWidth: 140, objectFit: 'contain', borderRadius: 4 }} />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onChange(null)
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--faint)', display: 'flex' }}
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{placeholder ?? 'Drag & drop or click to choose'}</span>
      )}
    </div>
  )
}
