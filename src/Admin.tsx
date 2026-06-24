import { useState, useEffect } from 'react'
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth'
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore'
import { auth, db } from './firebase'
import './admin.css'

const ADMIN_EMAILS = ['jhndy20170101@gmail.com', 'forwhani23@gmail.com']
const PAGE_SIZE = 20
const EXPORT_SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
const PICKER_APP_ID = '602684917728'
const SHEET_HEADERS = [
  '응답일시', '연령대', '폐경 상태', 'HRT 복용 여부', '판별 유형',
  '카카오 클릭', 'Q1 체온변화', 'Q2 땀', 'Q3 수면', 'Q4 에너지·피로',
  'Q5 체형·체중', 'Q6 정서', 'Q7 소화·식욕', 'Q8 피부·모발·감각',
  '기기 종류', 'OS', '브라우저', '소요 시간(초)',
  'referrer', 'utm_source', 'utm_medium', 'utm_campaign',
]

const TYPE_COLORS: Record<string, string> = {
  '열감형': '#E85A30', '냉증형': '#2E5DA8', '무기력형': '#D49B2A',
  '건조형': '#8B6CA8', '스트레스형': '#3D8B7A', '미판별': '#B8B8B8',
}

const Q_TITLES: Record<string, string> = {
  q1: '체온 변화', q2: '땀', q3: '수면', q4: '에너지·피로',
  q5: '체형·체중', q6: '정서', q7: '소화·식욕', q8: '피부·모발·감각',
}

const PRE_LABELS: Record<string, string> = {
  age: '연령대', menopause: '월경·완경 상태', hrt: '호르몬 치료(HRT)',
}

const GA4_MEASUREMENT_ID = 'G-DCPJ4FNNPV'
const GA_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly'

const SOURCE_LABELS: Record<string, string> = {
  '(direct)': '직접 접속',
  '(not set)': '(미설정)',
  'google': '구글',
  'naver': '네이버',
  'daum': '다음',
  'bing': '빙',
  'yahoo': '야후',
  'instagram': '인스타그램',
  'facebook': '페이스북',
  'kakaotalk': '카카오톡',
  'kakao': '카카오톡',
}

interface DeviceInfo {
  deviceType: string
  os: string
  browser: string
  screenWidth: number
}

interface SurveyDoc {
  id: string
  preAnswers: Record<string, string>
  mainAnswers: Record<string, { index: number; text: string }>
  resultType: string | null
  resultLabel: string | null
  kakaoClicked: boolean
  createdAt: Timestamp | null
  deviceInfo?: DeviceInfo
  durationSec?: number
  referrer?: string
  utmParams?: Record<string, string> | null
}

interface GA4Data {
  visitors: { today: number; thisWeek: number; thisMonth: number }
  sources: Array<{ source: string; count: number }>
  conversions: { kakao: number; phone: number; naverMap: number }
}

function formatDate(ts: Timestamp | null) {
  if (!ts) return '-'
  const d = ts.toDate()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function findGA4PropertyId(token: string): Promise<string> {
  const res = await fetch(
    'https://analyticsadmin.googleapis.com/v1beta/accountSummaries',
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) {
    if (res.status === 403) throw new Error('Google Analytics Admin API를 Cloud Console에서 활성화해주세요')
    throw new Error('GA4 계정 정보를 가져올 수 없습니다')
  }
  const data = await res.json()
  for (const account of data.accountSummaries || []) {
    for (const prop of account.propertySummaries || []) {
      const sRes = await fetch(
        `https://analyticsadmin.googleapis.com/v1beta/${prop.property}/dataStreams`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!sRes.ok) continue
      const streams = await sRes.json()
      if ((streams.dataStreams || []).some(
        (s: any) => s.webStreamData?.measurementId === GA4_MEASUREMENT_ID
      )) return prop.property.replace('properties/', '')
    }
  }
  throw new Error('GA4 속성을 찾을 수 없습니다')
}

async function runGA4Report(token: string, propertyId: string, body: object) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )
  if (!res.ok) throw new Error('GA4 리포트 요청 실패')
  return res.json()
}

export default function Admin() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [denied, setDenied] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [docs, setDocs] = useState<SurveyDoc[]>([])
  const [loading, setLoading] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [selectedDoc, setSelectedDoc] = useState<SurveyDoc | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportResult, setExportResult] = useState<{ url?: string; error?: string } | null>(null)
  const [gaToken, setGaToken] = useState<string | null>(null)
  const [gaData, setGaData] = useState<GA4Data | null>(null)
  const [gaLoading, setGaLoading] = useState(false)
  const [gaError, setGaError] = useState('')

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setAuthLoading(false)
      if (u) {
        if (ADMIN_EMAILS.includes(u.email || '')) {
          setUser(u)
          setDenied(false)
        } else {
          setDenied(true)
          signOut(auth)
        }
      } else {
        setUser(null)
      }
    })
  }, [])

  useEffect(() => {
    if (user) loadData()
  }, [user])

  useEffect(() => {
    if (user && gaToken && !gaData && !gaLoading) fetchGA4(gaToken)
  }, [user, gaToken])

  async function loadData() {
    setLoading(true)
    try {
      const snap = await getDocs(query(collection(db, 'surveyResults'), orderBy('createdAt', 'desc')))
      setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() }) as SurveyDoc))
    } catch (e) {
      console.error('Failed to load survey data:', e)
    } finally {
      setLoading(false)
    }
  }

  async function fetchGA4(token: string) {
    setGaLoading(true)
    setGaError('')
    try {
      const propertyId = await findGA4PropertyId(token)
      const now = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const dow = now.getDay()
      const toMon = dow === 0 ? 6 : dow - 1
      const ws = new Date(now); ws.setDate(now.getDate() - toMon)
      const weekStart = `${ws.getFullYear()}-${pad(ws.getMonth() + 1)}-${pad(ws.getDate())}`
      const monthStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`

      const [tR, wR, mR, sR, eR] = await Promise.all([
        runGA4Report(token, propertyId, {
          dateRanges: [{ startDate: 'today', endDate: 'today' }],
          metrics: [{ name: 'activeUsers' }],
        }),
        runGA4Report(token, propertyId, {
          dateRanges: [{ startDate: weekStart, endDate: 'today' }],
          metrics: [{ name: 'activeUsers' }],
        }),
        runGA4Report(token, propertyId, {
          dateRanges: [{ startDate: monthStart, endDate: 'today' }],
          metrics: [{ name: 'activeUsers' }],
        }),
        runGA4Report(token, propertyId, {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'sessionSource' }],
          metrics: [{ name: 'sessions' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 10,
        }),
        runGA4Report(token, propertyId, {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'eventName' }],
          metrics: [{ name: 'eventCount' }],
          dimensionFilter: {
            filter: {
              fieldName: 'eventName',
              inListFilter: { values: ['kakao_consult_click', 'phone_click', 'naver_map_click'] },
            },
          },
        }),
      ])

      const val = (r: any) => parseInt(r.rows?.[0]?.metricValues?.[0]?.value, 10) || 0
      const sources = (sR.rows || []).map((row: any) => ({
        source: row.dimensionValues[0].value as string,
        count: parseInt(row.metricValues[0].value, 10) || 0,
      }))
      const evts: Record<string, number> = {}
      for (const row of eR.rows || []) evts[row.dimensionValues[0].value] = parseInt(row.metricValues[0].value, 10) || 0

      setGaData({
        visitors: { today: val(tR), thisWeek: val(wR), thisMonth: val(mR) },
        sources,
        conversions: { kakao: evts['kakao_consult_click'] || 0, phone: evts['phone_click'] || 0, naverMap: evts['naver_map_click'] || 0 },
      })
    } catch (e: any) {
      setGaError(e?.message || 'GA4 데이터를 불러오는 중 오류가 발생했습니다')
    } finally {
      setGaLoading(false)
    }
  }

  async function handleLoadGA4() {
    try {
      const provider = new GoogleAuthProvider()
      provider.addScope(GA_SCOPE)
      provider.setCustomParameters({ login_hint: user!.email! })
      const result = await signInWithPopup(auth, provider)
      const credential = GoogleAuthProvider.credentialFromResult(result)
      const token = credential?.accessToken
      if (!token) throw new Error('인증 토큰을 가져올 수 없습니다')
      setGaToken(token)
      await fetchGA4(token)
    } catch (e: any) {
      if (e?.code === 'auth/popup-closed-by-user') return
      setGaError(e?.message || 'GA4 연동 중 오류가 발생했습니다')
    }
  }

  async function handleLogin() {
    setLoginError('')
    try {
      const provider = new GoogleAuthProvider()
      provider.addScope(GA_SCOPE)
      const result = await signInWithPopup(auth, provider)
      const credential = GoogleAuthProvider.credentialFromResult(result)
      if (credential?.accessToken) setGaToken(credential.accessToken)
    } catch (e: unknown) {
      const code = (e as { code?: string }).code
      if (code === 'auth/popup-closed-by-user') return
      if (code === 'auth/operation-not-allowed') setLoginError('Google 로그인이 활성화되지 않았습니다.')
      else setLoginError('로그인 중 오류가 발생했습니다.')
    }
  }

  function handleLogout() {
    signOut(auth)
    setDocs([])
    setVisibleCount(PAGE_SIZE)
    setGaData(null)
    setGaToken(null)
    setGaError('')
  }

  function loadPickerApi(): Promise<void> {
    return new Promise((resolve, reject) => {
      const w = window as any
      if (w.google?.picker) { resolve(); return }
      const load = () => w.gapi.load('picker', { callback: resolve, onerror: reject })
      if (w.gapi) { load(); return }
      const s = document.createElement('script')
      s.src = 'https://apis.google.com/js/api.js'
      s.onload = load
      s.onerror = () => reject(new Error('Google API 로드 실패'))
      document.head.appendChild(s)
    })
  }

  async function handleExport() {
    setExporting(true)
    setExportResult(null)
    try {
      const provider = new GoogleAuthProvider()
      EXPORT_SCOPES.forEach(s => provider.addScope(s))
      provider.setCustomParameters({ login_hint: user!.email! })
      const result = await signInWithPopup(auth, provider)
      const credential = GoogleAuthProvider.credentialFromResult(result)
      const token = credential?.accessToken
      if (!token) throw new Error('인증 토큰을 가져올 수 없습니다')

      await loadPickerApi()
      const folderId = await new Promise<string>((resolve, reject) => {
        const gp = (window as any).google.picker
        const view = new gp.DocsView(gp.ViewId.FOLDERS).setSelectFolderEnabled(true)
        new gp.PickerBuilder()
          .addView(view)
          .setOAuthToken(token)
          .setDeveloperKey('AIzaSyBS21dyXNLlQPdm2XiVBW1LtoT-PoInK7s')
          .setAppId(PICKER_APP_ID)
          .setCallback((data: any) => {
            if (data.action === gp.Action.PICKED) resolve(data.docs[0].id)
            else if (data.action === gp.Action.CANCEL) reject(new Error('cancel'))
          })
          .setTitle('저장할 폴더를 선택하세요')
          .build()
          .setVisible(true)
      })

      const today = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const dateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`

      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          properties: { title: `리셋클리닉 자가진단 결과_${dateStr}` },
          sheets: [{ properties: { title: '설문결과' } }],
        }),
      })
      if (!createRes.ok) throw new Error('스프레드시트 생성 실패')
      const { spreadsheetId } = await createRes.json()

      await fetch(
        `https://www.googleapis.com/drive/v3/files/${spreadsheetId}?addParents=${folderId}&removeParents=root`,
        { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } }
      )

      const rows: (string | number)[][] = [SHEET_HEADERS]
      for (const d of docs) {
        rows.push([
          formatDate(d.createdAt),
          d.preAnswers?.age || '',
          d.preAnswers?.menopause || '',
          d.preAnswers?.hrt || '',
          d.resultLabel || '미판별',
          d.kakaoClicked ? 'O' : 'X',
          d.mainAnswers?.q1?.text || '',
          d.mainAnswers?.q2?.text || '',
          d.mainAnswers?.q3?.text || '',
          d.mainAnswers?.q4?.text || '',
          d.mainAnswers?.q5?.text || '',
          d.mainAnswers?.q6?.text || '',
          d.mainAnswers?.q7?.text || '',
          d.mainAnswers?.q8?.text || '',
          d.deviceInfo?.deviceType || '',
          d.deviceInfo?.os || '',
          d.deviceInfo?.browser || '',
          d.durationSec != null ? d.durationSec : '',
          d.referrer || '',
          d.utmParams?.utm_source || '',
          d.utmParams?.utm_medium || '',
          d.utmParams?.utm_campaign || '',
        ])
      }

      const writeRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent('설문결과!A1')}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ range: '설문결과!A1', majorDimension: 'ROWS', values: rows }),
        }
      )
      if (!writeRes.ok) throw new Error('데이터 입력 실패')

      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              repeatCell: {
                range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
                cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.94, green: 0.94, blue: 0.94 } } },
                fields: 'userEnteredFormat(textFormat.bold,backgroundColor)',
              }
            },
            {
              updateSheetProperties: {
                properties: { sheetId: 0, gridProperties: { frozenRowCount: 1 } },
                fields: 'gridProperties.frozenRowCount',
              }
            },
            {
              autoResizeDimensions: {
                dimensions: { sheetId: 0, dimension: 'COLUMNS', startIndex: 0, endIndex: 22 },
              }
            },
          ]
        }),
      })

      setExportResult({ url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}` })
    } catch (e: any) {
      if (e?.code === 'auth/popup-closed-by-user' || e?.message === 'cancel') { /* cancelled */ }
      else setExportResult({ error: e?.message || '내보내기 중 오류가 발생했습니다' })
    } finally {
      setExporting(false)
    }
  }

  // ── Auth screens ──
  if (authLoading) return <div className="adm-center"><p className="adm-loading">로딩 중...</p></div>

  if (denied) {
    return (
      <div className="adm-center">
        <div className="adm-box">
          <p style={{ fontSize: '2.5rem', marginBottom: 16 }}>🚫</p>
          <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#D76618', marginBottom: 24 }}>접근 권한이 없습니다</p>
          <button className="adm-btn" onClick={() => setDenied(false)}>다른 계정으로 로그인</button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="adm-center">
        <div className="adm-box">
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8, color: '#1A3270' }}>데이터 대시보드</h1>
          <p style={{ color: '#999', marginBottom: 28, fontSize: '0.9rem' }}>관리자 로그인이 필요합니다</p>
          <button className="adm-btn adm-btn-google" onClick={handleLogin}>Google로 로그인</button>
          {loginError && <p style={{ color: '#D76618', fontSize: '0.85rem', marginTop: 16 }}>{loginError}</p>}
        </div>
      </div>
    )
  }

  // ── Dashboard ──
  const totalCount = docs.length
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayMs = todayStart.getTime()
  const todayCount = docs.filter(d => d.createdAt && d.createdAt.toMillis() >= todayMs).length
  const kakaoCount = docs.filter(d => d.kakaoClicked).length
  const kakaoRate = totalCount > 0 ? ((kakaoCount / totalCount) * 100).toFixed(1) : '0'

  const typeDist: Record<string, number> = {}
  docs.forEach(d => { const l = d.resultLabel || '미판별'; typeDist[l] = (typeDist[l] || 0) + 1 })
  const typeEntries = Object.entries(typeDist).sort((a, b) => b[1] - a[1])
  const maxTypeCount = typeEntries.length > 0 ? typeEntries[0][1] : 1

  const visibleDocs = docs.slice(0, visibleCount)
  const hasMore = visibleCount < docs.length

  return (
    <div className="adm">
      <header className="adm-header">
        <h1>데이터 대시보드</h1>
        <div className="adm-header-right">
          <span className="adm-user">{user.email}</span>
          <button className="adm-btn adm-btn-logout" onClick={handleLogout}>로그아웃</button>
        </div>
      </header>

      {loading ? (
        <div className="adm-center" style={{ minHeight: '60vh' }}><p className="adm-loading">데이터 로딩 중...</p></div>
      ) : (
        <div className="adm-body">
          {/* ── GA4 Analytics ── */}
          <h2 className="adm-group-title">방문자 분석</h2>

          {!gaData && !gaLoading && (
            <div className="adm-ga-connect">
              <button className="adm-btn adm-btn-ga" onClick={handleLoadGA4}>GA4 데이터 불러오기</button>
              {gaError && <p className="adm-ga-error">{gaError}</p>}
            </div>
          )}

          {gaLoading && (
            <div className="adm-ga-connect">
              <p className="adm-loading">GA4 데이터 로딩 중...</p>
            </div>
          )}

          {gaData && (
            <>
              <div className="adm-cards">
                <div className="adm-card">
                  <p className="adm-card-label">오늘 방문자</p>
                  <p className="adm-card-value">{gaData.visitors.today}</p>
                </div>
                <div className="adm-card">
                  <p className="adm-card-label">이번 주 방문자</p>
                  <p className="adm-card-value">{gaData.visitors.thisWeek}</p>
                </div>
                <div className="adm-card">
                  <p className="adm-card-label">이번 달 방문자</p>
                  <p className="adm-card-value">{gaData.visitors.thisMonth}</p>
                </div>
              </div>

              <div className="adm-section">
                <h2 className="adm-section-title">유입 경로별 방문자 <span className="adm-section-sub">최근 30일</span></h2>
                {gaData.sources.length === 0 ? (
                  <p className="adm-empty">데이터가 없습니다</p>
                ) : (
                  <div className="adm-dist">
                    {gaData.sources.map(({ source, count }) => (
                      <div key={source} className="adm-dist-row">
                        <span className="adm-dist-label" style={{ color: '#1A3270' }}>
                          {SOURCE_LABELS[source] || source}
                        </span>
                        <div className="adm-dist-bar-wrap">
                          <div className="adm-dist-bar" style={{
                            width: `${(count / gaData.sources[0].count) * 100}%`,
                            backgroundColor: '#4285F4',
                          }} />
                        </div>
                        <span className="adm-dist-count">{count}건</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="adm-section">
                <h2 className="adm-section-title">전환 행동 <span className="adm-section-sub">최근 30일</span></h2>
                <div className="adm-conv-cards">
                  <div className="adm-conv-card">
                    <p className="adm-conv-label">카카오톡 클릭</p>
                    <p className="adm-conv-value">{gaData.conversions.kakao}</p>
                  </div>
                  <div className="adm-conv-card">
                    <p className="adm-conv-label">전화 클릭</p>
                    <p className="adm-conv-value">{gaData.conversions.phone}</p>
                  </div>
                  <div className="adm-conv-card">
                    <p className="adm-conv-label">네이버 지도 클릭</p>
                    <p className="adm-conv-value">{gaData.conversions.naverMap}</p>
                  </div>
                </div>
              </div>

              <button className="adm-btn adm-btn-ga-refresh" onClick={() => fetchGA4(gaToken!)}>새로고침</button>
            </>
          )}

          {/* ── Self-diagnosis Analytics ── */}
          <h2 className="adm-group-title">자가진단 분석</h2>

          {/* Summary Cards */}
          <div className="adm-cards">
            <div className="adm-card">
              <p className="adm-card-label">총 응답 수</p>
              <p className="adm-card-value">{totalCount}</p>
            </div>
            <div className="adm-card">
              <p className="adm-card-label">오늘 응답 수</p>
              <p className="adm-card-value">{todayCount}</p>
            </div>
            <div className="adm-card">
              <p className="adm-card-label">카카오 상담 전환율</p>
              <p className="adm-card-value">{kakaoRate}%</p>
              <p className="adm-card-sub">{kakaoCount} / {totalCount}건</p>
            </div>
          </div>

          {/* Type Distribution */}
          <div className="adm-section">
            <h2 className="adm-section-title">유형별 분포</h2>
            {totalCount === 0 ? (
              <p className="adm-empty">데이터가 없습니다</p>
            ) : (
              <div className="adm-dist">
                {typeEntries.map(([label, count]) => (
                  <div key={label} className="adm-dist-row">
                    <span className="adm-dist-label" style={{ color: TYPE_COLORS[label] || '#888' }}>{label}</span>
                    <div className="adm-dist-bar-wrap">
                      <div className="adm-dist-bar" style={{ width: `${(count / maxTypeCount) * 100}%`, backgroundColor: TYPE_COLORS[label] || '#ccc' }} />
                    </div>
                    <span className="adm-dist-count">{count}건 ({((count / totalCount) * 100).toFixed(1)}%)</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Response List */}
          <div className="adm-section">
            <h2 className="adm-section-title">
              개별 응답 <span className="adm-section-count">{totalCount}건</span>
              <button className="adm-btn adm-btn-export" onClick={handleExport} disabled={exporting || totalCount === 0}>
                {exporting ? '내보내는 중...' : '스프레드시트로 내보내기'}
              </button>
            </h2>
            {exportResult && (
              <div className={`adm-export-msg ${exportResult.error ? 'adm-export-error' : 'adm-export-success'}`}>
                {exportResult.url ? (
                  <>
                    <span>스프레드시트가 생성되었습니다.</span>
                    <a href={exportResult.url} target="_blank" rel="noopener noreferrer">열기</a>
                    <button onClick={() => setExportResult(null)}>✕</button>
                  </>
                ) : (
                  <>
                    <span>{exportResult.error}</span>
                    <button onClick={() => setExportResult(null)}>✕</button>
                  </>
                )}
              </div>
            )}
            {totalCount === 0 ? (
              <p className="adm-empty">데이터가 없습니다</p>
            ) : (
              <>
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr><th>날짜/시간</th><th>연령대</th><th>판별 유형</th><th>기기</th><th>카카오</th></tr>
                    </thead>
                    <tbody>
                      {visibleDocs.map(d => (
                        <tr key={d.id} className="adm-row" onClick={() => setSelectedDoc(d)}>
                          <td>{formatDate(d.createdAt)}</td>
                          <td>{d.preAnswers?.age || '-'}</td>
                          <td>
                            <span className="adm-badge" style={{ backgroundColor: TYPE_COLORS[d.resultLabel || '미판별'] || '#ccc' }}>
                              {d.resultLabel || '미판별'}
                            </span>
                          </td>
                          <td>{d.deviceInfo?.deviceType || '-'}</td>
                          <td className={d.kakaoClicked ? 'adm-kakao-yes' : ''}>{d.kakaoClicked ? '✓' : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {hasMore && (
                  <button className="adm-btn adm-btn-more" onClick={() => setVisibleCount(c => c + PAGE_SIZE)}>
                    더 보기 ({docs.length - visibleCount}건 남음)
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedDoc && (
        <div className="adm-modal-backdrop" onClick={() => setSelectedDoc(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-head">
              <h2>응답 상세</h2>
              <button className="adm-modal-close" onClick={() => setSelectedDoc(null)}>✕</button>
            </div>
            <div className="adm-modal-body">
              <section className="adm-detail-sec">
                <h3>기본 정보</h3>
                <p className="adm-detail-time">{formatDate(selectedDoc.createdAt)}</p>
                <div className="adm-detail-grid">
                  {Object.entries(PRE_LABELS).map(([key, label]) => (
                    <div key={key} className="adm-detail-item">
                      <span className="adm-detail-key">{label}</span>
                      <span className="adm-detail-val">{selectedDoc.preAnswers?.[key] || '-'}</span>
                    </div>
                  ))}
                </div>
              </section>
              <section className="adm-detail-sec">
                <h3>기기 정보 / 소요 시간</h3>
                <div className="adm-detail-grid">
                  <div className="adm-detail-item">
                    <span className="adm-detail-key">기기</span>
                    <span className="adm-detail-val">{selectedDoc.deviceInfo?.deviceType || '-'}</span>
                  </div>
                  <div className="adm-detail-item">
                    <span className="adm-detail-key">OS</span>
                    <span className="adm-detail-val">{selectedDoc.deviceInfo?.os || '-'}</span>
                  </div>
                  <div className="adm-detail-item">
                    <span className="adm-detail-key">브라우저</span>
                    <span className="adm-detail-val">{selectedDoc.deviceInfo?.browser || '-'}</span>
                  </div>
                  <div className="adm-detail-item">
                    <span className="adm-detail-key">화면 너비</span>
                    <span className="adm-detail-val">{selectedDoc.deviceInfo?.screenWidth ? `${selectedDoc.deviceInfo.screenWidth}px` : '-'}</span>
                  </div>
                  <div className="adm-detail-item">
                    <span className="adm-detail-key">소요 시간</span>
                    <span className="adm-detail-val">{selectedDoc.durationSec != null ? `${Math.floor(selectedDoc.durationSec / 60)}분 ${selectedDoc.durationSec % 60}초` : '-'}</span>
                  </div>
                </div>
              </section>
              <section className="adm-detail-sec">
                <h3>유입 경로</h3>
                <div className="adm-detail-grid">
                  <div className="adm-detail-item">
                    <span className="adm-detail-key">Referrer</span>
                    <span className="adm-detail-val">{selectedDoc.referrer || '-'}</span>
                  </div>
                  {selectedDoc.utmParams && Object.entries(selectedDoc.utmParams).map(([k, v]) => (
                    <div key={k} className="adm-detail-item">
                      <span className="adm-detail-key">{k}</span>
                      <span className="adm-detail-val">{v}</span>
                    </div>
                  ))}
                </div>
              </section>
              <section className="adm-detail-sec">
                <h3>판별 결과</h3>
                <div className="adm-detail-result">
                  <span className="adm-badge adm-badge-lg" style={{ backgroundColor: TYPE_COLORS[selectedDoc.resultLabel || '미판별'] || '#ccc' }}>
                    {selectedDoc.resultLabel || '미판별'}
                  </span>
                  <span className="adm-detail-kakao">카카오 상담: {selectedDoc.kakaoClicked ? '클릭함' : '클릭 안 함'}</span>
                </div>
              </section>
              <section className="adm-detail-sec">
                <h3>본설문 응답</h3>
                <div className="adm-detail-answers">
                  {Object.entries(Q_TITLES).map(([qId, title]) => (
                    <div key={qId} className="adm-detail-answer">
                      <span className="adm-detail-q">{title}</span>
                      <span className="adm-detail-a">{selectedDoc.mainAnswers?.[qId]?.text || '-'}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
