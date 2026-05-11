import { Link } from 'react-router-dom';

export default function Diet() {
  return (
    <div style={{
      minHeight: '100svh',
      maxWidth: 480,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 28px',
      fontFamily: "'Noto Sans KR', -apple-system, sans-serif",
      background: '#F8F9FB',
      textAlign: 'center',
    }}>
      <span style={{ fontSize: 48, marginBottom: 24 }}>🌿</span>
      <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1B3A6B', marginBottom: 12 }}>
        리셋 다이어트
      </h1>
      <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.7, marginBottom: 40 }}>
        페이지를 준비 중입니다.<br />
        곧 만나보실 수 있습니다.
      </p>
      <Link to="/" style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 14,
        fontWeight: 700,
        color: '#1D9E75',
        textDecoration: 'none',
      }}>
        ← 홈으로 돌아가기
      </Link>
    </div>
  );
}
