'use client'

import { useState, useTransition, useRef } from 'react'
import { uploadUserFile, deleteUserFile } from '@/app/(app)/people/[id]/actions'
import {
  Paperclip, Trash2, Download, Upload,
  FileText, Image, FileVideo, FileAudio, FileArchive, FileCode, File,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface UserFile {
  id: string
  originalName: string
  mimeType: string
  size: number
  url: string
  createdAt: Date
  uploadedBy: { id: string; name: string }
}

interface Props {
  userId: string
  files: UserFile[]
  currentUserId: string
  canEdit: boolean
  isAdmin: boolean
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function fmtDate(d: Date) {
  return format(new Date(d), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

function FileIcon({ mimeType }: { mimeType: string }) {
  const size = 18
  if (mimeType.startsWith('image/')) return <Image size={size} color="#38bdf8" />
  if (mimeType.startsWith('video/')) return <FileVideo size={size} color="#a78bfa" />
  if (mimeType.startsWith('audio/')) return <FileAudio size={size} color="#fbbf24" />
  if (mimeType.includes('pdf')) return <FileText size={size} color="#f87171" />
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z') || mimeType.includes('tar'))
    return <FileArchive size={size} color="#fbbf24" />
  if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('html') || mimeType.includes('css') || mimeType.includes('xml'))
    return <FileCode size={size} color="#34d399" />
  if (mimeType.includes('word') || mimeType.includes('document'))
    return <FileText size={size} color="#38bdf8" />
  if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('csv'))
    return <FileText size={size} color="#34d399" />
  if (mimeType.startsWith('text/')) return <FileText size={size} color="#94a3b8" />
  return <File size={size} color="#3d5068" />
}

function mimeLabel(mimeType: string, name: string): string {
  const ext = name.split('.').pop()?.toUpperCase() ?? ''
  if (mimeType.startsWith('image/')) return `Imagem ${ext}`
  if (mimeType.startsWith('video/')) return `Vídeo ${ext}`
  if (mimeType.startsWith('audio/')) return `Áudio ${ext}`
  if (mimeType.includes('pdf')) return 'PDF'
  if (mimeType.includes('zip')) return 'ZIP'
  if (mimeType.includes('word') || mimeType.includes('document')) return `Word ${ext}`
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return `Excel ${ext}`
  return ext || 'Arquivo'
}

export default function FilesPanel({ userId, files: initialFiles, currentUserId, canEdit, isAdmin }: Props) {
  const [files, setFiles] = useState(initialFiles)
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    setError(null)
    setUploading(true)

    for (const file of Array.from(fileList)) {
      if (file.size > 50 * 1024 * 1024) {
        setError(`"${file.name}" é maior que 50 MB e não pode ser enviado.`)
        continue
      }
      const fd = new FormData()
      fd.append('file', file)

      startTransition(async () => {
        try {
          await uploadUserFile(userId, fd)
          // Optimistic insert
          setFiles(prev => [{
            id: 'optimistic-' + Date.now(),
            originalName: file.name,
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
            url: '#',
            createdAt: new Date(),
            uploadedBy: { id: currentUserId, name: 'Você' },
          }, ...prev])
        } catch (e: unknown) {
          setError(e instanceof Error ? e.message : 'Erro ao enviar arquivo')
        }
      })
    }
    setUploading(false)
  }

  function handleDelete(fileId: string) {
    setDeletingId(fileId)
    startTransition(async () => {
      await deleteUserFile(userId, fileId)
      setFiles(prev => prev.filter(f => f.id !== fileId))
      setDeletingId(null)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Drop zone ────────────────────────────────────────────────────── */}
      {canEdit && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault()
            setDragOver(false)
            handleFiles(e.dataTransfer.files)
          }}
          style={{
            background: dragOver ? 'rgba(0,217,184,0.06)' : '#0d1422',
            border: `2px dashed ${dragOver ? 'rgba(0,217,184,0.4)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 14, padding: '36px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: dragOver ? 'rgba(0,217,184,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${dragOver ? 'rgba(0,217,184,0.3)' : 'rgba(255,255,255,0.07)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}>
            <Upload size={20} color={dragOver ? '#00d9b8' : '#2d4060'} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: dragOver ? '#00d9b8' : '#8ba5c0', fontWeight: 600 }}>
              {uploading ? 'Enviando...' : dragOver ? 'Solte para enviar' : 'Arraste arquivos ou clique para selecionar'}
            </p>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', marginTop: 4 }}>
              QUALQUER TIPO · MÁX. 50 MB POR ARQUIVO
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={e => handleFiles(e.target.files)}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
          borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#f87171',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          {error}
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* ── File list ────────────────────────────────────────────────────── */}
      {files.length === 0 ? (
        <div style={{
          background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: '40px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          <Paperclip size={28} color="#1e3048" />
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#1e3048', fontStyle: 'italic' }}>
            Nenhum arquivo anexado
          </p>
        </div>
      ) : (
        <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 90px 130px 120px 72px',
            padding: '10px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            {['ARQUIVO', 'TIPO', 'TAMANHO', 'ENVIADO POR', ''].map((h, i) => (
              <span key={i} style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700,
                color: '#1e3048', letterSpacing: '0.1em',
                textAlign: i === 4 ? 'right' : 'left',
              }}>
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {files.map((file, i) => {
            const isDeleting = deletingId === file.id
            const canDelete = isAdmin || file.uploadedBy.id === currentUserId

            return (
              <div
                key={file.id}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 90px 130px 120px 72px',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                  borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.03)',
                  opacity: isDeleting ? 0.3 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                {/* Name + icon */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 7, flexShrink: 0,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FileIcon mimeType={file.mimeType} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#c8d6e5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.originalName}
                    </p>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', marginTop: 1 }}>
                      {fmtDate(file.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Type */}
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#3d5068' }}>
                  {mimeLabel(file.mimeType, file.originalName)}
                </span>

                {/* Size */}
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3d5068' }}>
                  {fmtSize(file.size)}
                </span>

                {/* Uploaded by */}
                <span style={{ fontSize: 11, color: '#8ba5c0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.uploadedBy.id === currentUserId ? 'Você' : file.uploadedBy.name}
                </span>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                  {file.url !== '#' && (
                    <a
                      href={file.url}
                      download={file.originalName}
                      title="Baixar arquivo"
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 28, height: 28, borderRadius: 6,
                        background: 'transparent', border: '1px solid transparent',
                        color: '#2d4060', textDecoration: 'none', transition: 'all 0.12s',
                      }}
                      onMouseEnter={e => {
                        const t = e.currentTarget
                        t.style.background = 'rgba(0,217,184,0.1)'
                        t.style.borderColor = 'rgba(0,217,184,0.2)'
                        t.style.color = '#00d9b8'
                      }}
                      onMouseLeave={e => {
                        const t = e.currentTarget
                        t.style.background = 'transparent'
                        t.style.borderColor = 'transparent'
                        t.style.color = '#2d4060'
                      }}
                    >
                      <Download size={12} />
                    </a>
                  )}

                  {canDelete && (
                    <button
                      onClick={() => handleDelete(file.id)}
                      disabled={isDeleting}
                      title="Excluir arquivo"
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 28, height: 28, borderRadius: 6,
                        background: 'transparent', border: '1px solid transparent',
                        color: '#2d4060', cursor: 'pointer', transition: 'all 0.12s',
                      }}
                      onMouseEnter={e => {
                        const t = e.currentTarget
                        t.style.background = 'rgba(248,113,113,0.1)'
                        t.style.borderColor = 'rgba(248,113,113,0.2)'
                        t.style.color = '#f87171'
                      }}
                      onMouseLeave={e => {
                        const t = e.currentTarget
                        t.style.background = 'transparent'
                        t.style.borderColor = 'transparent'
                        t.style.color = '#2d4060'
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
