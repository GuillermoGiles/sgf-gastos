import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #1e3a8a, #172554)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '112px',
          color: 'white',
          fontSize: 200,
          fontWeight: 900,
          fontFamily: 'sans-serif',
        }}
      >
        SGF
      </div>
    ),
    { ...size }
  )
}
