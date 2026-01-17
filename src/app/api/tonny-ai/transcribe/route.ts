import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No se recibio archivo de audio' },
        { status: 400 }
      )
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'es',
    })

    return NextResponse.json({ text: transcription.text })
  } catch (error) {
    console.error('Transcription Error:', error)
    return NextResponse.json(
      { error: 'Error al transcribir audio' },
      { status: 500 }
    )
  }
}
