'use client'

import React, { useState, useRef } from 'react'
import { Send, Lock, Loader2 } from 'lucide-react'

interface MessageComposerModernProps {
  onSubmit: (message: string, isInternal: boolean) => Promise<void>
  isLoading?: boolean
  userRole?: 'COLABORADOR' | 'AUXILIAR_TI' | 'TECNICO' | 'ADMIN'
  placeholder?: string
}

export function MessageComposerModern({
  onSubmit,
  isLoading = false,
  userRole = 'COLABORADOR',
  placeholder = 'Adicione uma mensagem...',
}: MessageComposerModernProps) {
  const [message, setMessage] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [localLoading, setLocalLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isTechStaff = ['TECNICO', 'AUXILIAR_TI', 'ADMIN'].includes(userRole)
  const canSubmit = message.trim().length > 0 && !localLoading && !isLoading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setLocalLoading(true)
    try {
      await onSubmit(message.trim(), isInternal)
      setMessage('')
      setIsInternal(false)
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } finally {
      setLocalLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey && canSubmit) {
      handleSubmit(e as any)
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    // Auto-expand textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Textarea wrapper */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={isInternal ? 'Nota interna (apenas para equipe técnica)...' : placeholder}
          className={`
            w-full px-4 py-3 rounded-lg border-2 transition-all resize-none
            focus:outline-none focus:ring-0
            ${
              isInternal
                ? 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 focus:border-purple-400 dark:focus:border-purple-600 text-slate-900 dark:text-white'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-emerald-400 dark:focus:border-emerald-600 text-slate-900 dark:text-white'
            }
            placeholder:text-slate-400 dark:placeholder:text-slate-500
            text-sm leading-relaxed
          `}
          rows={3}
          maxLength={2000}
        />

        {/* Character counter */}
        {message.length > 0 && (
          <p className="absolute bottom-2 right-4 text-xs text-slate-400 dark:text-slate-500">
            {message.length} / 2000
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-3">
        {/* Internal note toggle - only for tech staff */}
        {isTechStaff && (
          <button
            type="button"
            onClick={() => setIsInternal(!isInternal)}
            className={`
              px-3 py-2 rounded-lg text-sm font-medium transition-all
              flex items-center gap-2
              ${
                isInternal
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-800'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600'
              }
            `}
          >
            <Lock size={16} className="stroke-[2]" />
            <span>Nota interna</span>
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Info text */}
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {message.length > 0 ? 'Ctrl + Enter para enviar' : 'Ctrl + Enter ou clique para enviar'}
        </p>

        {/* Submit button */}
        <button
          type="submit"
          disabled={!canSubmit}
          className={`
            px-4 py-2 rounded-lg font-medium transition-all
            flex items-center gap-2 min-w-max
            ${
              canSubmit
                ? 'bg-emerald-500 dark:bg-emerald-600 text-white hover:bg-emerald-600 dark:hover:bg-emerald-700 active:scale-95'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            }
          `}
        >
          {localLoading || isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Enviando...</span>
            </>
          ) : (
            <>
              <Send size={16} className="stroke-[2]" />
              <span>Enviar</span>
            </>
          )}
        </button>
      </div>

      {/* Info message */}
      {isInternal && (
        <p className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-800">
          ℹ️ Esta nota interna será visível apenas para a equipe técnica.
        </p>
      )}
    </form>
  )
}
