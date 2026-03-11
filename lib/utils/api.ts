import { NextResponse } from 'next/server'

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status })
}

export function err(code: string, message: string, status = 400) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status })
}

export function generateTicketCode(seq: number): string {
  const year = new Date().getFullYear()
  const padded = String(seq).padStart(6, '0')
  return `HD-${year}-${padded}`
}
