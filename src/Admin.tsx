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

type GAPeriod = 'today' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'custom'

const PERIOD_OPTIONS: { key: GAPeriod; label: string }[] = [
  { key: 'today', label: '오늘' },
  { key: 'thisWeek', label: '이번 주' },
  { key: 'thisMonth', label: '이번 달' },
  { key: 'lastMonth', label: '지난 달' },
  { key: 'custom', label: '직접 선택' },
]

const SOURCE_LABELS: Record<string, string> = {
  '(direct)': '직접 접속',
  '(not set)': '기타',
  'google': '구글',
  'naver': '네이버 검색',
  'naver.com': '네이버 검색',
  'daum': '다음',
  'bing': '빙',
  'yahoo': '야후',
  'instagram': '인스타그램',
  'facebook': '페이스북',
  'kakaotalk': '카카오톡',
  'kakao': '카카오톡',
  'band': '밴드',
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
  visitors: number
  sources: Array<{ source: string; count: number }>
  conversions: { kakao: number; phone: number; naverMap: number }
}

function formatDate(ts: Timestamp | null) {
  if (!ts) return '-'
  const d = ts.toDate()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function computeDateRange(period: GAPeriod, customStart: string, customEnd: string) {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  switch (period) {
    case 'today': return { startDate: fmt(now), endDate: fmt(now) }
    case 'thisWeek': {
      const dow = now.getDay()
      const toMon = dow === 0 ? 6 : dow - 1
      const ws = new Date(now); ws.setDate(now.getDate() - toMon)
      return { startDate: fmt(ws), endDate: fmt(now) }
    }
    case 'thisMonth': return { startDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`, endDate: fmt(now) }
    case 'lastMonth': {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lmEnd = new Date(now.getFullYear(), now.getMonth(), 0)
      return { startDate: fmt(lm), endDate: fmt(lmEnd) }
    }
    case 'custom': return { startDate: customStart, endDate: customEnd }
  }
}

function getSourceLabel(source: string): string {
  if (SOURCE_LABELS[source]) return SOURCE_LABELS[source]
  const s = source.toLowerCase()
  if (s.includes('place.naver') || s.startsWith('pcmap.') || s.includes('place.n')) return '네이버 플레이스'
  if (s.includes('map.naver')) return '네이버 지도'
  if (s.includes('blog.naver')) return '네이버 블로그'
  if (s.includes('cafe.naver')) return '네이버 카페'
  if (s.includes('search.naver')) return '네이버 검색'
  if (s.includes('naver')) return '네이버'
  if (s.includes('kakao')) return '카카오톡'
  if (s.includes('google')) return '구글'
  if (s.includes('youtube')) return '유튜브'
  if (s.includes('instagram')) return '인스타그램'
  if (s.includes('facebook') || s.includes('fb.')) return '페이스북'
  if (s.includes('band.us')) return '밴드'
  if (s.includes('twitter') || s.includes('x.com') || s === 't.co') return 'X(트위터)'
  if (s.includes('daum')) return '다음'
  if (s.includes('bing')) return '빙'
  return source
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
  const [gaPropertyId, setGaPropertyId] = useState<string | null>(null)
  const [gaData, setGaData] = useState<GA4Data | null>(null)
  const [gaLoading, setGaLoading] = useState(false)
  const [gaError, setGaError] = useState('')
  const [gaPeriod, setGaPeriod] = useState<GAPeriod>('thisMonth')
  const [gaCustomStart, setGaCustomStart] = useState('')
  const [gaCustomEnd, setGaCustomEnd] = useState('')
  const [gaExporting, setGaExporting] = useState(false)
  const [gaExportResult, setGaExportResult] = useState<{ url?: string; error?: string } | null>(null)

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setAuthLoading(false)
      if (u) {
        if (ADMIN_EMAILS.includes(u.email || '')) { setUser(u); setDenied(false) }
        else { setDenied(true); signOut(auth) }
      } else { setUser(null) }
    })
  }, [])

  useEffect(() => { if (user) loadData() }, [user])

  useEffect(() => {
    if (user && gaToken && !gaPropertyId && !gaLoading) initGA4(gaToken)
  }, [user, gaToken])

  async function loadData() {
    setLoading(true)
    try {
      const snap = await getDocs(query(collection(db, 'surveyResults'), orderBy('createdAt', 'desc')))
      setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() }) as SurveyDoc))
    } catch (e) { console.error('Failed to load survey data:', e) }
    finally { setLoading(false) }
  }

  async function initGA4(token: string) {
    setGaLoading(true)
    setGaError('')
    try {
      const pid = await findGA4PropertyId(token)
      setGaPropertyId(pid)
      await fetchGA4Data(token, pid)
    } catch (e: any) {
      setGaError(e?.message || 'GA4 데이터를 불러오는 중 오류가 발생했습니다')
      setGaLoading(false)
    }
  }

  async function fetchGA4Data(token: string, propertyId: string, period?: GAPeriod, cStart?: string, cEnd?: string) {
    const p = period ?? gaPeriod
    const cs = cStart ?? gaCustomStart
    const ce = cEnd ?? gaCustomEnd
    setGaLoading(true)
    setGaError('')
    try {
      const dateRange = computeDateRange(p, cs, ce)
      const [vR, sR, eR] = await Promise.all([
        runGA4Report(token, propertyId, {
          dateRanges: [dateRange],
          metrics: [{ name: 'activeUsers' }],
        }),
        runGA4Report(token, propertyId, {
          dateRanges: [dateRange],
          dimensions: [{ name: 'sessionSource' }],
          metrics: [{ name: 'sessions' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 20,
        }),
        runGA4Report(token, propertyId, {
          dateRanges: [dateRange],
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

      const visitors = parseInt(vR.rows?.[0]?.metricValues?.[0]?.value, 10) || 0
      const merged: Record<string, number> = {}
      for (const row of sR.rows || []) {
        const label = getSourceLabel(row.dimensionValues[0].value)
        merged[label] = (merged[label] || 0) + (parseInt(row.metricValues[0].value, 10) || 0)
      }
      const sources = Object.entries(merged)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
      const evts: Record<string, number> = {}
      for (const row of eR.rows || []) evts[row.dimensionValues[0].value] = parseInt(row.metricValues[0].value, 10) || 0

      setGaData({
        visitors,
        sources,
        conversions: { kakao: evts['kakao_consult_click'] || 0, phone: evts['phone_click'] || 0, naverMap: evts['naver_map_click'] || 0 },
      })
    } catch (e: any) {
      setGaError(e?.message || 'GA4 데이터를 불러오는 중 오류가 발생했습니다')
    } finally { setGaLoading(false) }
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
      await initGA4(token)
    } catch (e: any) {
      if (e?.code === 'auth/popup-closed-by-user') return
      setGaError(e?.message || 'GA4 연동 중 오류가 발생했습니다')
    }
  }

  function handlePeriodChange(p: GAPeriod) {
    setGaPeriod(p)
    if (p !== 'custom' && gaToken && gaPropertyId) fetchGA4Data(gaToken, gaPropertyId, p)
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
    setDocs([]); setVisibleCount(PAGE_SIZE)
    setGaData(null); setGaToken(null); setGaPropertyId(null)
    setGaError(''); setGaPeriod('thisMonth')
    setGaCustomStart(''); setGaCustomEnd('')
    setGaExportResult(null)
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

  async function pickFolder(token: string): Promise<string> {
    await loadPickerApi()
    return new Promise<string>((resolve, reject) => {
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
  }

  async function getExportToken(): Promise<string> {
    const provider = new GoogleAuthProvider()
    EXPORT_SCOPES.forEach(s => provider.addScope(s))
    provider.setCustomParameters({ login_hint: user!.email! })
    const result = await signInWithPopup(auth, provider)
    const credential = GoogleAuthProvider.credentialFromResult(result)
    const token = credential?.accessToken
    if (!token) throw new Error('인증 토큰을 가져올 수 없습니다')
    return token
  }

  async function createSheet(token: string, title: string, sheetName: string, folderId: string) {
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        properties: { title },
        sheets: [{ properties: { title: sheetName } }],
      }),
    })
    if (!createRes.ok) throw new Error('스프레드시트 생성 실패')
    const { spreadsheetId } = await createRes.json()
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${spreadsheetId}?addParents=${folderId}&removeParents=root`,
      { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } }
    )
    return spreadsheetId
  }

  async function handleGA4Export() {
    if (!gaData) return
    setGaExporting(true)
    setGaExportResult(null)
    try {
      const token = await getExportToken()
      const folderId = await pickFolder(token)
      const today = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const dateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
      const { startDate, endDate } = computeDateRange(gaPeriod, gaCustomStart, gaCustomEnd)
      const periodStr = startDate === endDate ? startDate : `${startDate} ~ ${endDate}`

      const sheetName = 'GA4 분석'
      const spreadsheetId = await createSheet(token, `리셋클리닉 GA4 분석_${dateStr}`, sheetName, folderId)

      const rows: (string | number)[][] = [
        ['리셋클리닉 GA4 방문자 분석'],
        [],
        ['기간', periodStr],
        ['방문자 수', gaData.visitors],
        [],
        ['유입 경로', '세션 수'],
        ...gaData.sources.map(s => [s.source, s.count]),
        [],
        ['전환 항목', '클릭 수'],
        ['카카오톡 클릭', gaData.conversions.kakao],
        ['전화 클릭', gaData.conversions.phone],
        ['네이버 지도 클릭', gaData.conversions.naverMap],
      ]

      const writeRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName + '!A1')}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ range: `${sheetName}!A1`, majorDimension: 'ROWS', values: rows }),
        }
      )
      if (!writeRes.ok) throw new Error('데이터 입력 실패')

      const convHeaderRow = 7 + gaData.sources.length
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            { repeatCell: { range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 }, cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 14 } } }, fields: 'userEnteredFormat(textFormat)' } },
            { repeatCell: { range: { sheetId: 0, startRowIndex: 2, endRowIndex: 4 }, cell: { userEnteredFormat: { textFormat: { bold: true } } }, fields: 'userEnteredFormat(textFormat.bold)' } },
            { repeatCell: { range: { sheetId: 0, startRowIndex: 5, endRowIndex: 6 }, cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.94, green: 0.94, blue: 0.94 } } }, fields: 'userEnteredFormat(textFormat.bold,backgroundColor)' } },
            { repeatCell: { range: { sheetId: 0, startRowIndex: convHeaderRow, endRowIndex: convHeaderRow + 1 }, cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.94, green: 0.94, blue: 0.94 } } }, fields: 'userEnteredFormat(textFormat.bold,backgroundColor)' } },
            { autoResizeDimensions: { dimensions: { sheetId: 0, dimension: 'COLUMNS', startIndex: 0, endIndex: 2 } } },
          ]
        }),
      })

      setGaExportResult({ url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}` })
    } catch (e: any) {
      if (e?.code === 'auth/popup-closed-by-user' || e?.message === 'cancel') { /* cancelled */ }
      else setGaExportResult({ error: e?.message || '내보내기 중 오류가 발생했습니다' })
    } finally { setGaExporting(false) }
  }

  async function handleExport() {
    setExporting(true)
    setExportResult(null)
    try {
      const token = await getExportToken()
      const folderId = await pickFolder(token)
      const today = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const dateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`

      const sheetName = '설문결과'
      const spreadsheetId = await createSheet(token, `리셋클리닉 자가진단 결과_${dateStr}`, sheetName, folderId)

      const rows: (string | number)[][] = [SHEET_HEADERS]
      for (const d of docs) {
        rows.push([
          formatDate(d.createdAt), d.preAnswers?.age || '', d.preAnswers?.menopause || '',
          d.preAnswers?.hrt || '', d.resultLabel || '미판별', d.kakaoClicked ? 'O' : 'X',
          d.mainAnswers?.q1?.text || '', d.mainAnswers?.q2?.text || '', d.mainAnswers?.q3?.text || '',
          d.mainAnswers?.q4?.text || '', d.mainAnswers?.q5?.text || '', d.mainAnswers?.q6?.text || '',
          d.mainAnswers?.q7?.text || '', d.mainAnswers?.q8?.text || '',
          d.deviceInfo?.deviceType || '', d.deviceInfo?.os || '', d.deviceInfo?.browser || '',
          d.durationSec != null ? d.durationSec : '', d.referrer || '',
          d.utmParams?.utm_source || '', d.utmParams?.utm_medium || '', d.utmParams?.utm_campaign || '',
        ])
      }

      const writeRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName + '!A1')}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ range: `${sheetName}!A1`, majorDimension: 'ROWS', values: rows }),
        }
      )
      if (!writeRes.ok) throw new Error('데이터 입력 실패')

      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            { repeatCell: { range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 }, cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.94, green: 0.94, blue: 0.94 } } }, fields: 'userEnteredFormat(textFormat.bold,backgroundColor)' } },
            { updateSheetProperties: { properties: { sheetId: 0, gridProperties: { frozenRowCount: 1 } }, fields: 'gridProperties.frozenRowCount' } },
            { autoResizeDimensions: { dimensions: { sheetId: 0, dimension: 'COLUMNS', startIndex: 0, endIndex: 22 } } },
          ]
        }),
      })

      setExportResult({ url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}` })
    } catch (e: any) {
      if (e?.code === 'auth/popup-closed-by-user' || e?.message === 'cancel') { /* cancelled */ }
      else setExportResult({ error: e?.message || '내보내기 중 오류가 발생했습니다' })
    } finally { setExporting(false) }
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
          <div className="adm-ga-header">
            <h2 className="adm-group-title">방문자 분석</h2>
            {gaData && (
              <div className="adm-ga-actions">
                <button className="adm-btn adm-btn-ga-action" onClick={() => gaToken && gaPropertyId && fetchGA4Data(gaToken, gaPropertyId)} disabled={gaLoading}>
                  새로고침
                </button>
                <button className="adm-btn adm-btn-ga-action adm-ga-export-btn" onClick={handleGA4Export} disabled={gaExporting || gaLoading}>
                  {gaExporting ? '내보내는 중...' : '내보내기'}
                </button>
              </div>
            )}
          </div>

          {gaExportResult && (
            <div className={`adm-export-msg ${gaExportResult.error ? 'adm-export-error' : 'adm-export-success'}`}>
              {gaExportResult.url ? (
                <>
                  <span>스프레드시트가 생성되었습니다.</span>
                  <a href={gaExportResult.url} target="_blank" rel="noopener noreferrer">열기</a>
                  <button onClick={() => setGaExportResult(null)}>✕</button>
                </>
              ) : (
                <>
                  <span>{gaExportResult.error}</span>
                  <button onClick={() => setGaExportResult(null)}>✕</button>
                </>
              )}
            </div>
          )}

          {!gaData && !gaLoading && (
            <div className="adm-ga-connect">
              <button className="adm-btn adm-btn-ga" onClick={handleLoadGA4}>GA4 데이터 불러오기</button>
              {gaError && <p className="adm-ga-error">{gaError}</p>}
            </div>
          )}

          {gaLoading && !gaData && (
            <div className="adm-ga-connect">
              <p className="adm-loading">GA4 데이터 로딩 중...</p>
            </div>
          )}

          {gaData && (
            <div style={{ opacity: gaLoading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
              <div className="adm-period-bar">
                <div className="adm-period-pills">
                  {PERIOD_OPTIONS.map(({ key, label }) => (
                    <button key={key} className={`adm-period-pill ${gaPeriod === key ? 'active' : ''}`} onClick={() => handlePeriodChange(key)} disabled={gaLoading}>
                      {label}
                    </button>
                  ))}
                </div>
                {gaPeriod === 'custom' && (
                  <div className="adm-period-custom">
                    <input type="date" value={gaCustomStart} onChange={e => setGaCustomStart(e.target.value)} />
                    <span className="adm-period-sep">~</span>
                    <input type="date" value={gaCustomEnd} onChange={e => setGaCustomEnd(e.target.value)} />
                    <button className="adm-btn adm-period-apply" onClick={() => gaToken && gaPropertyId && fetchGA4Data(gaToken, gaPropertyId)} disabled={!gaCustomStart || !gaCustomEnd || gaLoading}>
                      조회
                    </button>
                  </div>
                )}
              </div>

              <div className="adm-ga-summary">
                <span className="adm-ga-visitor-label">방문자 수</span>
                <span className="adm-ga-visitor-value">{gaData.visitors}</span>
                <span className="adm-ga-visitor-unit">명</span>
              </div>

              <div className="adm-section">
                <h2 className="adm-section-title">유입 경로별 방문자</h2>
                {gaData.sources.length === 0 ? (
                  <p className="adm-empty">데이터가 없습니다</p>
                ) : (
                  <div className="adm-dist">
                    {gaData.sources.map(({ source, count }) => (
                      <div key={source} className="adm-dist-row">
                        <span className="adm-dist-label" style={{ color: '#1A3270' }}>{source}</span>
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
                <h2 className="adm-section-title">전환 행동</h2>
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
            </div>
          )}

          {/* ── Self-diagnosis Analytics ── */}
          <h2 className="adm-group-title">자가진단 분석</h2>

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
