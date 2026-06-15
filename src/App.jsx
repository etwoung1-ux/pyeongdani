import { useState, useMemo, useEffect, useRef } from "react";

/* ════════════════════════════════════════
   평단이 — 물타기 불타기 계산기 V2 Final
   AdSense 정책 준수 버전
   ════════════════════════════════════════ */

const FOOD_ITEMS = [
  { name: "치킨", emoji: "🍗", price: 22000, unit: "마리" },
  { name: "짜장면", emoji: "🍜", price: 7000, unit: "그릇" },
  { name: "소주", emoji: "🍶", price: 5000, unit: "병" },
  { name: "아이패드", emoji: "📱", price: 700000, unit: "대" },
  { name: "PS5", emoji: "🎮", price: 600000, unit: "대" },
  { name: "월세", emoji: "🏠", price: 500000, unit: "개월" },
  { name: "로또", emoji: "🎰", price: 1000, unit: "장" },
];

const DREAM_CATS = [
  {
    id: "daily", label: "🍗 일상", items: [
      { name: "치킨", emoji: "🍗", price: 22000, unit: "마리" },
      { name: "오마카세 식사", emoji: "🍣", price: 200000, unit: "회" },
      { name: "제주도 여행", emoji: "🏝️", price: 500000, unit: "회" },
    ]
  },
  {
    id: "big", label: "💰 큰돈", items: [
      { name: "아이폰", emoji: "📱", price: 1500000, unit: "대" },
      { name: "맥북 프로", emoji: "💻", price: 2800000, unit: "대" },
      { name: "유럽여행", emoji: "✈️", price: 5000000, unit: "회" },
    ]
  },
  {
    id: "serious", label: "🏦 목돈", items: [
      { name: "국산차 (아반떼)", emoji: "🚗", price: 30000000, unit: "대" },
      { name: "테슬라 Model 3", emoji: "⚡", price: 52000000, unit: "대" },
      { name: "지바겐", emoji: "🚙", price: 200000000, unit: "대" },
      { name: "은행이자 월 100만원", emoji: "🏦", price: 350000000, unit: "배" },
    ]
  },
  {
    id: "wealth", label: "👑 부의 상징", items: [
      { name: "지방 대장급 아파트", emoji: "🏠", price: 500000000, unit: "채" },
      { name: "서울 아파트 (평균)", emoji: "🏢", price: 1500000000, unit: "채" },
      { name: "강남 아파트 (평균)", emoji: "🏙️", price: 4000000000, unit: "채" },
    ]
  },
];

const FALLBACK_RATE = 1450;
const commafy = (n) => (n == null || isNaN(n)) ? "0" : Math.round(n).toLocaleString("ko-KR");
const shortNum = (n) => {
  if (n === 0) return "0";
  const a = Math.abs(n), s = n < 0 ? "-" : "";
  if (a >= 1_0000_0000) return s + (a / 1_0000_0000).toFixed(1) + "억";
  if (a >= 10000) return s + Math.round(a / 10000).toLocaleString() + "만";
  return s + commafy(a);
};
const formatNum = (val) => {
  const v = val.replace(/[^0-9]/g, "");
  if (v === "") return { d: "", r: "" };
  const i = v.replace(/^0+(?=\d)/, "");
  return { d: i ? Number(i).toLocaleString("ko-KR") : "0", r: i || "0" };
};
const useCI = () => {
  const [d, setD] = useState("");
  const r = useRef("");
  const onChange = (e) => { const { d: dd, r: rr } = formatNum(e.target.value); r.current = rr; setD(dd); };
  return { d, onChange, num: parseFloat(r.current) || 0, reset: () => { setD(""); r.current = ""; } };
};

/* ═══ Ad Slot Components ═══
   배포 시 각 컴포넌트의 주석 부분을 실제 애드센스 코드로 교체:
   
   <ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-XXXXXXX"
     data-ad-slot="XXXXXXX"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
   <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
*/

/* 인라인 배너 (콘텐츠 사이) */
const AdBanner = ({ dark, size = "normal" }) => (
  <div style={{
    background: dark ? "#1a1a1a" : "#f5f5f5",
    border: `1px dashed ${dark ? "#333" : "#ddd"}`,
    borderRadius: 12, textAlign: "center",
    margin: "12px 0",
    minHeight: size === "large" ? 120 : 90,
    display: "flex", alignItems: "center", justifyContent: "center",
  }}>
    <span style={{ fontSize: 11, color: dark ? "#333" : "#ddd" }}>광고 영역{size === "large" ? " (대형)" : ""}</span>
  </div>
);

/* 사이드바 (PC 전용) */
const AdSidebar = ({ dark }) => (
  <div style={{
    width: 160, minHeight: 600,
    background: dark ? "#1a1a1a" : "#f5f5f5",
    border: `1px dashed ${dark ? "#333" : "#ddd"}`,
    borderRadius: 12, display: "flex",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0, position: "sticky", top: 20,
  }}>
    <span style={{ fontSize: 11, color: dark ? "#333" : "#ddd", writingMode: "vertical-rl" }}>SIDEBAR AD</span>
  </div>
);

/* 하단 앵커 (sticky bottom) */
const AdAnchor = ({ dark }) => (
  <div style={{
    position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 8000,
    background: dark ? "#1a1a1a" : "#fff",
    borderTop: `1px solid ${dark ? "#333" : "#e0e0e0"}`,
    padding: "8px 16px",
    display: "flex", alignItems: "center", justifyContent: "center",
    minHeight: 50,
  }}>
    <span style={{ fontSize: 11, color: dark ? "#333" : "#ddd" }}>앵커 광고 영역 (Sticky Bottom)</span>
  </div>
);

/* ═══ Candle Face ═══ */
const CandleFace = ({ profit, size = 48 }) => {
  const w = size * .55, h = size, bH = h * .55, bY = h * .2, wW = size * .08;
  const col = profit >= 0 ? "#0B8A4B" : "#E24B4A";
  const eY = bY + bH * .35, mY = bY + bH * .65;
  const lE = (size - w) / 2 + w * .3, rE = (size - w) / 2 + w * .7, cx = size / 2;
  let face;
  if (profit > 100) face = (<><path d={`M${lE - 3} ${eY} Q${lE} ${eY - 5} ${lE + 3} ${eY}`} fill="none" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" /><path d={`M${rE - 3} ${eY} Q${rE} ${eY - 5} ${rE + 3} ${eY}`} fill="none" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" /><path d={`M${cx - 5} ${mY - 2} Q${cx} ${mY + 6} ${cx + 5} ${mY - 2}`} fill="#fff" opacity={.9} /></>);
  else if (profit > 30) face = (<><circle cx={lE} cy={eY} r={2} fill="#fff" /><circle cx={rE} cy={eY} r={2} fill="#fff" /><path d={`M${cx - 4} ${mY} Q${cx} ${mY + 5} ${cx + 4} ${mY}`} fill="none" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" /></>);
  else if (profit > 0) face = (<><circle cx={lE} cy={eY} r={1.8} fill="#fff" /><circle cx={rE} cy={eY} r={1.8} fill="#fff" /><path d={`M${cx - 3} ${mY} Q${cx} ${mY + 3} ${cx + 3} ${mY}`} fill="none" stroke="#fff" strokeWidth={1.2} strokeLinecap="round" /></>);
  else if (profit >= 0) face = (<><circle cx={lE} cy={eY} r={1.8} fill="#fff" /><circle cx={rE} cy={eY} r={1.8} fill="#fff" /><line x1={cx - 3} y1={mY} x2={cx + 3} y2={mY} stroke="#fff" strokeWidth={1.2} strokeLinecap="round" /></>);
  else if (profit > -20) face = (<><circle cx={lE} cy={eY} r={2} fill="#fff" /><circle cx={rE} cy={eY} r={2} fill="#fff" /><path d={`M${cx - 3} ${mY + 2} Q${cx} ${mY - 2} ${cx + 3} ${mY + 2}`} fill="none" stroke="#fff" strokeWidth={1.2} strokeLinecap="round" /></>);
  else face = (<><circle cx={lE} cy={eY - 1} r={2} fill="#fff" /><circle cx={rE} cy={eY - 1} r={2} fill="#fff" /><path d={`M${cx - 4} ${mY + 3} Q${cx} ${mY - 3} ${cx + 4} ${mY + 3}`} fill="none" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" /><line x1={lE} y1={eY + 3} x2={lE - 1} y2={eY + 7} stroke="#fff" strokeWidth={.8} opacity={.6} /></>);
  return (<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}><rect x={cx - wW / 2} y={2} width={wW} height={bY - 2} rx={1} fill={col} opacity={.5} /><rect x={(size - w) / 2} y={bY} width={w} height={bH} rx={4} fill={col} /><rect x={cx - wW / 2} y={bY + bH} width={wW} height={h - bY - bH - 2} rx={1} fill={col} opacity={.5} />{face}</svg>);
};

/* ═══ Canvas Share Card ═══ */
const drawCandle = (ctx, x, y, size, profit) => {
  const w = size * .55, h = size, bH = h * .55, bY = y + h * .2, wW = size * .08;
  const col = profit >= 0 ? "#0B8A4B" : "#E24B4A";
  const cx = x + size / 2, lx = x + (size - w) / 2;
  const eY = bY + bH * .35, mY = bY + bH * .65;
  const lE = lx + w * .3, rE = lx + w * .7;

  ctx.fillStyle = col; ctx.globalAlpha = .5;
  roundRect(ctx, cx - wW / 2, y + 2, wW, bY - y - 2, 2);
  roundRect(ctx, cx - wW / 2, bY + bH, wW, h - h * .2 - bH - 2, 2);
  ctx.globalAlpha = 1;
  roundRect(ctx, lx, bY, w, bH, 6);

  ctx.fillStyle = "#fff";
  if (profit > 30) {
    ctx.beginPath(); ctx.arc(lE, eY, size * .05, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(rE, eY, size * .05, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx - size * .08, mY);
    ctx.quadraticCurveTo(cx, mY + size * .1, cx + size * .08, mY);
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
  } else if (profit >= 0) {
    ctx.beginPath(); ctx.arc(lE, eY, size * .04, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(rE, eY, size * .04, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx - size * .06, mY);
    ctx.quadraticCurveTo(cx, mY + size * .06, cx + size * .06, mY);
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(lE, eY, size * .05, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(rE, eY, size * .05, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx - size * .07, mY + size * .06);
    ctx.quadraticCurveTo(cx, mY - size * .04, cx + size * .07, mY + size * .06);
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
  }
};

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath(); ctx.fill();
};

const ShareModal = ({ data, dark, onClose }) => {
  const canvasRef = useRef(null);
  const [saved, setSaved] = useState(false);

  const { market, newAvg, targetPrice, profitRate, grossProfit, netProfit, tax, taxLabel, exRate, item, itemCount, type } = data;
  const isUp = profitRate >= 0;
  const accent = isUp ? "#0B8A4B" : "#E24B4A";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = 680, H = 880;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");

    /* Header gradient */
    const grad = ctx.createLinearGradient(0, 0, W, H * .4);
    if (isUp) { grad.addColorStop(0, "#0B8A4B"); grad.addColorStop(1, "#07633a"); }
    else { grad.addColorStop(0, "#E24B4A"); grad.addColorStop(1, "#a32d2d"); }
    ctx.fillStyle = grad;
    roundRect(ctx, 0, 0, W, H, 0);

    /* White bottom */
    ctx.fillStyle = "#fff";
    roundRect(ctx, 0, 360, W, H - 360, 0);

    /* Header content */
    ctx.fillStyle = "#fff"; ctx.font = "bold 36px -apple-system, sans-serif";
    ctx.fillText("평단이", 40, 60);
    ctx.font = "18px -apple-system, sans-serif"; ctx.globalAlpha = .8;
    ctx.fillText(market === "kr" ? "🇰🇷 국내주식" : "🇺🇸 미국주식", 40, 92);
    ctx.globalAlpha = 1;

    /* Candle character */
    drawCandle(ctx, W - 120, 20, 80, profitRate);

    /* Profit rate */
    ctx.fillStyle = "#fff";
    ctx.font = "900 96px -apple-system, sans-serif";
    const pText = (isUp ? "+" : "") + profitRate.toFixed(1) + "%";
    ctx.fillText(pText, 40, 210);

    /* Avg → Target */
    ctx.font = "22px -apple-system, sans-serif"; ctx.globalAlpha = .85;
    ctx.fillText(`평단 ${commafy(newAvg)}원 → 목표 ${commafy(targetPrice)}원`, 40, 260);
    ctx.globalAlpha = 1;

    /* Divider line */
    ctx.fillStyle = isUp ? "#2ECC71" : "#E24B4A"; ctx.globalAlpha = .3;
    roundRect(ctx, 40, 290, W - 80, 3, 2);
    ctx.globalAlpha = 1;

    /* Total qty info */
    ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = "18px -apple-system, sans-serif";
    ctx.fillText(`${taxLabel} · 세금 약 ${shortNum(tax)}원`, 40, 330);

    /* White section — Profit boxes */
    const boxY = 390;
    ctx.fillStyle = "#f5f5f5";
    roundRect(ctx, 40, boxY, (W - 100) / 2, 100, 14);
    roundRect(ctx, W / 2 + 10, boxY, (W - 100) / 2, 100, 14);

    ctx.fillStyle = "#999"; ctx.font = "16px -apple-system, sans-serif";
    ctx.fillText("세전 수익", 65, boxY + 32);
    ctx.fillStyle = "#222"; ctx.font = "bold 28px -apple-system, sans-serif";
    ctx.fillText(shortNum(grossProfit) + "원", 65, boxY + 72);

    ctx.fillStyle = "#999"; ctx.font = "16px -apple-system, sans-serif";
    ctx.fillText("세후 실수익", W / 2 + 35, boxY + 32);
    ctx.fillStyle = accent; ctx.font = "bold 28px -apple-system, sans-serif";
    ctx.fillText(shortNum(netProfit) + "원", W / 2 + 35, boxY + 72);

    /* USD conversion */
    if (market === "us") {
      ctx.fillStyle = "#999"; ctx.font = "16px -apple-system, sans-serif";
      ctx.fillText(`환율 ${commafy(exRate)}원 기준 ≈ $${commafy(netProfit / exRate)}`, 40, boxY + 130);
    }

    /* Item conversion box */
    const itemBoxY = market === "us" ? boxY + 155 : boxY + 125;
    ctx.fillStyle = isUp ? "#e8f8ee" : "#fce8e8";
    roundRect(ctx, 40, itemBoxY, W - 80, 140, 18);

    ctx.fillStyle = "#666"; ctx.font = "20px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${item.emoji} ${item.name} 환산`, W / 2, itemBoxY + 40);

    ctx.fillStyle = accent; ctx.font = "bold 56px -apple-system, sans-serif";
    ctx.fillText(`${itemCount.toLocaleString()}${item.unit}`, W / 2, itemBoxY + 105);
    ctx.textAlign = "left";

    /* Footer */
    ctx.fillStyle = "#e0e0e0";
    roundRect(ctx, 40, H - 100, W - 80, 1, 0);

    ctx.fillStyle = "#bbb"; ctx.font = "16px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("평단이 🕯️ 물타기 불타기 계산기", W / 2, H - 55);
    ctx.font = "14px -apple-system, sans-serif";
    ctx.fillText("pyeongdani.com", W / 2, H - 28);
    ctx.textAlign = "left";
  }, [data]);

  const saveImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pyeongdani-result.png";
      a.click();
      URL.revokeObjectURL(url);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16, backdropFilter: "blur(6px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>

        {/* Canvas preview */}
        <canvas
          ref={canvasRef}
          style={{
            width: "100%", maxWidth: 340,
            borderRadius: 20,
            boxShadow: "0 20px 60px rgba(0,0,0,.4)",
          }}
        />

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8, width: "100%", maxWidth: 340 }}>
          <button onClick={saveImage} style={{
            flex: 1, padding: 16,
            background: saved ? "#2ECC71" : accent,
            color: "#fff", border: "none", borderRadius: 14,
            fontSize: 16, fontWeight: 600, cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,.2)",
          }}>
            {saved ? "저장 완료! ✅" : "📥 이미지 저장"}
          </button>
          <button onClick={onClose} style={{
            padding: "16px 20px",
            background: "rgba(255,255,255,.15)",
            color: "#fff", border: "none", borderRadius: 14,
            fontSize: 16, cursor: "pointer",
            backdropFilter: "blur(4px)",
          }}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════
   MAIN APP
   ════════════════════════════════════════ */
export default function Pyeongdani() {
  const [dark, setDark] = useState(false);
  const [market, setMarket] = useState("kr");
  const [tab, setTab] = useState("calc");
  const [showResult, setShowResult] = useState(false);
  const [shareData, setShareData] = useState(null);
  const [selItem, setSelItem] = useState(0);
  const [sliderP, setSliderP] = useState(null);
  const [exRate, setExRate] = useState(FALLBACK_RATE);
  const [rateLive, setRateLive] = useState(false);
  const [dreamCat, setDreamCat] = useState("daily");
  const [dreamSlider, setDreamSlider] = useState(null);

  const ap = useCI(), qt = useCI(), tgt = useCI();
  const [adds, setAdds] = useState([{ pd: "", pr: "", qd: "", qr: "" }]);
  const resultRef = useRef(null);

  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/USD").then(r => r.json())
      .then(d => { if (d?.rates?.KRW) { setExRate(Math.round(d.rates.KRW)); setRateLive(true); } }).catch(() => { });
  }, []);

  const addRow = () => setAdds([...adds, { pd: "", pr: "", qd: "", qr: "" }]);
  const removeRow = i => { if (adds.length > 1) setAdds(adds.filter((_, idx) => idx !== i)); };
  const updateAdd = (i, field, val) => {
    const n = [...adds]; const { d, r } = formatNum(val);
    if (field === "price") n[i] = { ...n[i], pd: d, pr: r };
    else n[i] = { ...n[i], qd: d, qr: r }; setAdds(n);
  };

  const base = useMemo(() => {
    if (!ap.num || !qt.num) return null;
    let tCost = ap.num * qt.num, tQty = qt.num, aCnt = 0;
    adds.forEach(a => { const p = parseFloat(a.pr) || 0, q = parseFloat(a.qr) || 0; if (p > 0 && q > 0) { tCost += p * q; tQty += q; aCnt++; } });
    return { newAvg: tCost / tQty, totalQty: tQty, totalCost: tCost, addCount: aCnt, avgChange: ((tCost / tQty - ap.num) / ap.num) * 100 };
  }, [ap.num, qt.num, adds]);

  const calc = useMemo(() => {
    if (!base) return null;
    const t = sliderP !== null ? sliderP : tgt.num;
    const pR = t > 0 ? ((t - base.newAvg) / base.newAvg) * 100 : 0;
    const gP = t > 0 ? (t - base.newAvg) * base.totalQty : 0;
    let tax = 0, tL = "";
    if (market === "kr") { tax = t > 0 ? t * base.totalQty * 0.0018 : 0; tL = "거래세 0.18%"; }
    else { if (gP > 2500000) tax = (gP - 2500000) * 0.22; tL = "양도세 22% (250만 공제)"; }
    return { ...base, profitRate: pR, grossProfit: gP, tax, taxLabel: tL, netProfit: gP - tax };
  }, [base, tgt.num, sliderP, market]);

  const dreamCalc = useMemo(() => {
    if (!base) return null;
    const all = DREAM_CATS.flatMap(c => c.items);
    const sl = dreamSlider !== null ? dreamSlider : base.newAvg * 3;
    const gP = (sl - base.newAvg) * base.totalQty;
    let tax = 0;
    if (market === "kr") tax = sl * base.totalQty * 0.0018;
    else if (gP > 2500000) tax = (gP - 2500000) * 0.22;
    const nP = gP - tax, pR = ((sl - base.newAvg) / base.newAvg) * 100;
    const items = all.map(item => {
      let need; if (market === "kr") need = (item.price / base.totalQty + base.newAvg) / (1 - 0.0018);
      else { const pre = item.price + 2500000 * 0.22; need = pre / 0.78 / base.totalQty + base.newAvg; }
      return { ...item, unlocked: nP >= item.price, count: nP > 0 ? Math.floor(nP / item.price) : 0, needPrice: need, needRate: ((need - base.newAvg) / base.newAvg) * 100 };
    });
    return { slider: sl, netProfit: nP, profitRate: pR, items, unlocked: items.filter(i => i.unlocked).length, total: all.length };
  }, [base, dreamSlider, market]);

  const handleCalc = () => {
    setSliderP(null);
    setShowResult(true);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };
  const handleReset = () => { ap.reset(); qt.reset(); tgt.reset(); setAdds([{ pd: "", pr: "", qd: "", qr: "" }]); setSliderP(null); setShowResult(false); setDreamSlider(null); };

  const C = {
    bg: dark ? "#111" : "#FAFDF7", card: dark ? "#1a1a1a" : "#fff",
    bd: dark ? "#2a2a2a" : "#e0e8d8", t1: dark ? "#eee" : "#1a1a1a",
    t2: dark ? "#aaa" : "#666", t3: dark ? "#555" : "#bbb",
    g: "#0B8A4B", gL: dark ? "#0a2a16" : "#E8F8EE",
    r: "#E24B4A", rL: dark ? "#2a1010" : "#FCEBEB",
    iBg: dark ? "#222" : "#fff", tBg: dark ? "#222" : "#f0f4ec",
    pBg: dark ? "#222" : "#f5f5f5",
  };
  const iS = { width: "100%", padding: "12px 14px", border: `1.5px solid ${C.bd}`, borderRadius: 12, fontSize: 16, background: C.iBg, color: C.t1, outline: "none", boxSizing: "border-box" };
  const focus = e => e.target.style.borderColor = C.g;
  const blr = e => e.target.style.borderColor = C.bd;
  const tp = sliderP !== null ? sliderP : tgt.num;

  const holdingsBlock = (
    <div style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.bd}`, marginBottom: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.g, marginBottom: 14 }}>📊 현재 보유</div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, color: C.t2, marginBottom: 4, display: "block" }}>평균 매수 단가 (원)</label>
        <input type="text" inputMode="numeric" placeholder="예: 55,000" value={ap.d} onChange={ap.onChange} style={iS} onFocus={focus} onBlur={blr} />
        {market === "us" && ap.num > 0 && <div style={{ fontSize: 11, color: C.t3, marginTop: 4, paddingLeft: 4 }}>≈ ${(ap.num / exRate).toFixed(2)}</div>}
      </div>
      <div>
        <label style={{ fontSize: 12, color: C.t2, marginBottom: 4, display: "block" }}>보유 수량 (주)</label>
        <input type="text" inputMode="numeric" placeholder="예: 100" value={qt.d} onChange={qt.onChange} style={iS} onFocus={focus} onBlur={blr} />
      </div>
    </div>
  );

  const addsBlock = (
    <div style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.bd}`, marginBottom: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.g, marginBottom: 14 }}>
        💧 추가 매수{adds.filter(a => a.pr && a.qr).length > 0 && <span style={{ color: C.t3, fontWeight: 400 }}> ({adds.filter(a => a.pr && a.qr).length}회)</span>}
      </div>
      {adds.map((a, i) => (
        <div key={i} style={{ marginBottom: i < adds.length - 1 ? 16 : 0 }}>
          {adds.length > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: C.t3 }}>{i + 1}번째 {"💧".repeat(Math.min(i + 1, 5))}</span>
              <button onClick={() => removeRow(i)} style={{ background: "none", border: "none", color: C.r, fontSize: 18, cursor: "pointer", padding: "0 4px", lineHeight: 1 }}>×</button>
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: C.t3, marginBottom: 2, display: "block" }}>매수 단가</label>
              <input type="text" inputMode="numeric" placeholder="단가" value={a.pd} onChange={e => updateAdd(i, "price", e.target.value)} style={{ ...iS, padding: "10px 12px", fontSize: 15 }} onFocus={focus} onBlur={blr} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: C.t3, marginBottom: 2, display: "block" }}>수량</label>
              <input type="text" inputMode="numeric" placeholder="수량" value={a.qd} onChange={e => updateAdd(i, "qty", e.target.value)} style={{ ...iS, padding: "10px 12px", fontSize: 15 }} onFocus={focus} onBlur={blr} />
            </div>
          </div>
        </div>
      ))}
      <button onClick={addRow} style={{ width: "100%", marginTop: 14, padding: 10, background: C.gL, border: `1px dashed ${C.g}40`, borderRadius: 10, color: C.g, fontSize: 14, cursor: "pointer" }}>+ 한 번 더 물타기 💧</button>
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: '-apple-system,"Noto Sans KR",sans-serif', color: C.t1, transition: "background .3s" }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 20, maxWidth: 900, margin: "0 auto", padding: "0 8px" }}>

        {/* ══ Main Column ══ */}
        <div style={{ maxWidth: 420, width: "100%", padding: "0 16px 20px" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0 8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CandleFace profit={calc ? calc.profitRate : 0} size={36} />
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.g }}>평단이</div>
                <div style={{ fontSize: 11, color: C.t2, marginTop: -2 }}>물타기 불타기 계산기</div>
              </div>
            </div>
            <button onClick={() => setDark(!dark)} style={{ background: C.tBg, border: "none", borderRadius: 20, padding: "6px 14px", fontSize: 13, color: C.t2, cursor: "pointer" }}>{dark ? "☀️" : "🌙"}</button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", background: C.tBg, borderRadius: 14, padding: 4, marginBottom: 16, marginTop: 4 }}>
            {[["calc", "💧 물불 계산"], ["dream", "🎯 꿈 계산기"]].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} style={{
                flex: 1, padding: "12px 0", border: "none", borderRadius: 12, fontSize: 15, fontWeight: tab === k ? 700 : 400, cursor: "pointer", transition: "all .25s",
                background: tab === k ? (k === "dream" ? "linear-gradient(135deg,#E67E22,#F39C12)" : C.g) : "transparent",
                color: tab === k ? "#fff" : C.t2, boxShadow: tab === k ? "0 2px 8px rgba(0,0,0,.15)" : "none",
              }}>{l}</button>
            ))}
          </div>

          {/* Market */}
          <div style={{ display: "flex", background: C.tBg, borderRadius: 12, padding: 4, marginBottom: 10 }}>
            {[["kr", "🇰🇷 국내주식"], ["us", "🇺🇸 미국주식"]].map(([k, l]) => (
              <button key={k} onClick={() => setMarket(k)} style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 10, background: market === k ? C.g : "transparent", color: market === k ? "#fff" : C.t2, fontSize: 14, fontWeight: market === k ? 600 : 400, cursor: "pointer" }}>{l}</button>
            ))}
          </div>
          {market === "us" && (
            <div style={{ background: dark ? "#1a1f2a" : "#EEF2FF", borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
              <span style={{ color: dark ? "#8899bb" : "#5566aa" }}>💱 USD/KRW</span>
              <span style={{ fontWeight: 600, color: dark ? "#aabbdd" : "#3344aa" }}>$1 = {commafy(exRate)}원 <span style={{ fontSize: 10, fontWeight: 400, color: C.t3, marginLeft: 4 }}>{rateLive ? "실시간" : "기본값"}</span></span>
            </div>
          )}

          {/* ══════ TAB 1 ══════ */}
          {tab === "calc" && (
            <>
              {holdingsBlock}
              {addsBlock}
              <div style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.bd}`, marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.g, marginBottom: 14 }}>🎯 목표 주가</div>
                <input type="text" inputMode="numeric" placeholder="이 가격 되면 팔 거야! (원)" value={tgt.d} onChange={e => { tgt.onChange(e); setSliderP(null); }} style={iS} onFocus={focus} onBlur={blr} />
                {market === "us" && tgt.num > 0 && <div style={{ fontSize: 11, color: C.t3, marginTop: 4, paddingLeft: 4 }}>≈ ${(tgt.num / exRate).toFixed(2)}</div>}
              </div>
              <button onClick={handleCalc} style={{ width: "100%", padding: 16, background: C.g, color: "#fff", border: "none", borderRadius: 14, fontSize: 17, fontWeight: 600, cursor: "pointer" }}>계산하기 🕯️</button>
              <button onClick={handleReset} style={{ width: "100%", marginTop: 8, padding: 12, background: "transparent", border: `1px solid ${C.bd}`, borderRadius: 12, color: C.t2, fontSize: 14, cursor: "pointer" }}>초기화</button>

              {showResult && calc && (
                <div ref={resultRef} style={{ marginTop: 24 }}>
                  {/* AD: 결과 노출형 (대형) — CTR 최고 위치 */}
                  <AdBanner dark={dark} size="large" />

                  {/* Card 1 */}
                  <div style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.bd}`, borderLeft: `4px solid ${C.g}`, marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <CandleFace profit={calc.profitRate} size={44} />
                      <div>
                        <div style={{ fontSize: 13, color: C.t2 }}>새 평단가</div>
                        <div style={{ fontSize: 26, fontWeight: 700 }}>{commafy(calc.newAvg)}원</div>
                        {market === "us" && <div style={{ fontSize: 12, color: C.t3 }}>≈ ${(calc.newAvg / exRate).toFixed(2)}</div>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: calc.avgChange <= 0 ? C.gL : C.rL, color: calc.avgChange <= 0 ? C.g : C.r }}>평단 {calc.avgChange > 0 ? "▲" : "▼"} {Math.abs(calc.avgChange).toFixed(1)}%</span>
                      <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 12, background: C.pBg, color: C.t2 }}>총 {commafy(calc.totalQty)}주 · {shortNum(calc.totalCost)}원</span>
                      {calc.addCount > 0 && <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 12, background: C.gL, color: C.g }}>{"💧".repeat(Math.min(calc.addCount, 5))} {calc.addCount}번</span>}
                    </div>
                  </div>

                  {/* Card 2 */}
                  {tp > 0 && (
                    <div style={{ background: calc.profitRate >= 0 ? (dark ? "#0a1f0f" : "#f7fdf5") : (dark ? "#1f0a0a" : "#fdf5f5"), borderRadius: 16, padding: 20, border: `1px solid ${C.bd}`, borderLeft: `4px solid ${calc.profitRate >= 0 ? C.g : C.r}`, marginBottom: 12 }}>
                      <div style={{ fontSize: 13, color: C.t2, marginBottom: 4 }}>🎯 목표가 {commafy(tp)}원 도달 시</div>
                      <div style={{ fontSize: 34, fontWeight: 700, color: calc.profitRate >= 0 ? C.g : C.r, lineHeight: 1.2, marginBottom: 8 }}>{calc.profitRate >= 0 ? "+" : ""}{calc.profitRate.toFixed(1)}%</div>
                      <div style={{ display: "flex", gap: 16, margin: "12px 0", flexWrap: "wrap" }}>
                        <div><div style={{ fontSize: 11, color: C.t3 }}>세전</div><div style={{ fontSize: 18, fontWeight: 600 }}>{shortNum(calc.grossProfit)}원</div></div>
                        <div><div style={{ fontSize: 11, color: C.t3 }}>세후</div><div style={{ fontSize: 18, fontWeight: 600, color: calc.netProfit >= 0 ? C.g : C.r }}>{shortNum(calc.netProfit)}원</div></div>
                        {market === "us" && <div><div style={{ fontSize: 11, color: C.t3 }}>달러</div><div style={{ fontSize: 18, fontWeight: 600, color: C.t2 }}>${commafy(calc.netProfit / exRate)}</div></div>}
                      </div>
                      <div style={{ fontSize: 10, color: C.t3, marginBottom: 14 }}>{calc.taxLabel} · 세금 약 {shortNum(calc.tax)}원</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                        {FOOD_ITEMS.map((it, i) => (<button key={i} onClick={() => setSelItem(i)} style={{ padding: "6px 10px", borderRadius: 20, border: selItem === i ? `2px solid ${C.g}` : `1px solid ${C.bd}`, background: selItem === i ? C.gL : "transparent", fontSize: 13, cursor: "pointer", color: C.t1 }}>{it.emoji}</button>))}
                      </div>
                      <div style={{ background: dark ? "#152215" : "#eef8e8", borderRadius: 14, padding: "14px 16px", textAlign: "center" }}>
                        <div style={{ fontSize: 14, color: C.t2, marginBottom: 4 }}>{FOOD_ITEMS[selItem].emoji} {FOOD_ITEMS[selItem].name} 환산</div>
                        <div style={{ fontSize: 30, fontWeight: 700, color: calc.netProfit >= 0 ? C.g : C.r }}>{Math.floor(Math.abs(calc.netProfit) / FOOD_ITEMS[selItem].price).toLocaleString()}{FOOD_ITEMS[selItem].unit}</div>
                        <div style={{ fontSize: 11, color: C.t3, marginTop: 4 }}>기준가격 {commafy(FOOD_ITEMS[selItem].price)}원</div>
                      </div>
                    </div>
                  )}

                  {/* Card 3 — Slider */}
                  <div style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.bd}`, marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.g, marginBottom: 12 }}>📈 주가 시뮬레이션</div>
                    {(() => {
                      const ba = calc.newAvg, mn = Math.round(ba * .3), mx = Math.round(ba * 5);
                      const cur = sliderP !== null ? sliderP : (tp > 0 ? tp : ba);
                      const sR = ((cur - ba) / ba) * 100, sG = (cur - ba) * calc.totalQty;
                      let sT = 0; if (market === "kr") sT = cur * calc.totalQty * 0.0018; else if (sG > 2500000) sT = (sG - 2500000) * 0.22;
                      const sN = sG - sT;
                      return (<>
                        <div style={{ textAlign: "center", marginBottom: 10 }}>
                          <span style={{ fontSize: 26, fontWeight: 700 }}>{commafy(cur)}원</span>
                          {market === "us" && <span style={{ fontSize: 13, color: C.t3, marginLeft: 8 }}>(${(cur / exRate).toFixed(2)})</span>}
                        </div>
                        <input type="range" min={mn} max={mx} step={Math.round(ba * .005) || 1} value={cur} onChange={e => setSliderP(Number(e.target.value))} style={{ width: "100%", accentColor: sR >= 0 ? C.g : C.r, height: 34, cursor: "pointer" }} />
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.t3, marginBottom: 14 }}><span>-70%</span><span style={{ color: C.g, fontWeight: 600 }}>평단 {commafy(ba)}</span><span>+400%</span></div>
                        <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center", padding: "12px 0", borderTop: `1px solid ${C.bd}` }}>
                          <div><div style={{ fontSize: 11, color: C.t3 }}>수익률</div><div style={{ fontSize: 18, fontWeight: 700, color: sR >= 0 ? C.g : C.r }}>{sR >= 0 ? "+" : ""}{sR.toFixed(1)}%</div></div>
                          <div><div style={{ fontSize: 11, color: C.t3 }}>세후</div><div style={{ fontSize: 18, fontWeight: 700, color: sN >= 0 ? C.g : C.r }}>{shortNum(sN)}원</div></div>
                          <div><div style={{ fontSize: 11, color: C.t3 }}>{FOOD_ITEMS[selItem].emoji}</div><div style={{ fontSize: 18, fontWeight: 700, color: sN >= 0 ? C.g : C.r }}>{Math.floor(Math.abs(sN) / FOOD_ITEMS[selItem].price).toLocaleString()}{FOOD_ITEMS[selItem].unit}</div></div>
                        </div>
                      </>);
                    })()}
                  </div>

                  <button onClick={() => {
                    const item = FOOD_ITEMS[selItem], cnt = Math.floor(Math.abs(calc.netProfit) / item.price);
                    setShareData({ type: "calc", market, newAvg: calc.newAvg, targetPrice: tp, profitRate: calc.profitRate, grossProfit: calc.grossProfit, netProfit: calc.netProfit, tax: calc.tax, taxLabel: calc.taxLabel, exRate, item, itemCount: cnt });
                  }} style={{ width: "100%", padding: 16, background: C.g, color: "#fff", border: "none", borderRadius: 14, fontSize: 16, fontWeight: 600, cursor: "pointer", marginTop: 4 }}>📋 결과 공유하기</button>
                </div>
              )}
            </>
          )}

          {/* ══════ TAB 2 ══════ */}
          {tab === "dream" && (
            <>
              <div style={{ background: "linear-gradient(145deg,#E67E22,#F1C40F)", borderRadius: 18, padding: "24px 20px", marginBottom: 16, textAlign: "center", color: "#fff" }}>
                <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>🎯 꿈 계산기</div>
                <div style={{ fontSize: 14, opacity: .9 }}>내 주식 수익으로 뭘 살 수 있을까?</div>
              </div>
              {holdingsBlock}
              {addsBlock}

              {!base && (
                <div style={{ textAlign: "center", padding: "40px 20px", color: C.t3 }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🕯️</div>
                  <div style={{ fontSize: 14 }}>위에 보유 정보를 입력하면<br />꿈 계산이 시작됩니다!</div>
                </div>
              )}

              {base && dreamCalc && (() => {
                const ba = base.newAvg, mn = Math.round(ba * .5), mx = Math.round(ba * 15);
                const cur = dreamCalc.slider, pct = dreamCalc.total > 0 ? (dreamCalc.unlocked / dreamCalc.total * 100) : 0;
                return (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.bd}`, marginBottom: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#E67E22", marginBottom: 4 }}>🎯 목표 주가를 설정해보세요</div>
                      <div style={{ fontSize: 11, color: C.t3, marginBottom: 14 }}>슬라이더를 밀면 꿈이 하나씩 잠금해제돼요!</div>
                      <div style={{ textAlign: "center", marginBottom: 8 }}>
                        <div style={{ fontSize: 28, fontWeight: 700, color: C.t1 }}>{commafy(cur)}원</div>
                        <div style={{ fontSize: 13, color: dreamCalc.profitRate >= 0 ? C.g : C.r, fontWeight: 600 }}>
                          {dreamCalc.profitRate >= 0 ? "+" : ""}{dreamCalc.profitRate.toFixed(1)}% · 세후 {shortNum(dreamCalc.netProfit)}원
                          {market === "us" && <span style={{ color: C.t3, fontWeight: 400 }}> (${commafy(dreamCalc.netProfit / exRate)})</span>}
                        </div>
                      </div>
                      <input type="range" min={mn} max={mx} step={Math.round(ba * .01) || 1} value={cur} onChange={e => setDreamSlider(Number(e.target.value))} style={{ width: "100%", accentColor: "#E67E22", height: 36, cursor: "pointer" }} />
                      <div style={{ marginTop: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                          <span style={{ color: C.t2 }}>잠금해제 {dreamCalc.unlocked}/{dreamCalc.total}</span>
                          <span style={{ color: "#E67E22", fontWeight: 600 }}>{pct.toFixed(0)}%</span>
                        </div>
                        <div style={{ height: 8, background: dark ? "#333" : "#eee", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#E67E22,#F1C40F)", borderRadius: 4, transition: "width .3s" }} />
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 8 }}>
                      {DREAM_CATS.map(cat => {
                        const ci = dreamCalc.items.filter(i => cat.items.some(c => c.name === i.name));
                        const cu = ci.filter(i => i.unlocked).length;
                        return (<button key={cat.id} onClick={() => setDreamCat(cat.id)} style={{
                          padding: "8px 14px", borderRadius: 20, border: dreamCat === cat.id ? "2px solid #E67E22" : `1px solid ${C.bd}`,
                          background: dreamCat === cat.id ? (dark ? "#2a1f0a" : "#FFF3E0") : "transparent",
                          fontSize: 13, cursor: "pointer", color: C.t1, whiteSpace: "nowrap", flexShrink: 0,
                        }}>{cat.label} <span style={{ fontSize: 11, color: cu === cat.items.length ? C.g : C.t3 }}>{cu}/{cat.items.length}</span></button>);
                      })}
                    </div>

                    {DREAM_CATS.filter(c => c.id === dreamCat).map(cat => (
                      <div key={cat.id} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {dreamCalc.items.filter(i => cat.items.some(c => c.name === i.name)).sort((a, b) => a.price - b.price).map((item, idx) => (
                          <div key={idx} style={{
                            background: item.unlocked ? (dark ? "linear-gradient(135deg,#0a2a16,#1a3a26)" : "linear-gradient(135deg,#f0faf0,#e8f8ee)") : C.card,
                            borderRadius: 16, padding: "16px 18px",
                            border: item.unlocked ? `1.5px solid ${C.g}40` : `1px solid ${C.bd}`,
                            opacity: item.unlocked ? 1 : 0.65, transition: "all .3s",
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ fontSize: 28 }}>{item.unlocked ? item.emoji : "🔒"}</div>
                                <div>
                                  <div style={{ fontSize: 15, fontWeight: 600, color: C.t1 }}>{item.name}</div>
                                  <div style={{ fontSize: 12, color: C.t3 }}>{shortNum(item.price)}원</div>
                                </div>
                              </div>
                              {item.unlocked ? (
                                <div style={{ textAlign: "right" }}>
                                  <div style={{ fontSize: 12, color: C.g, fontWeight: 600 }}>✅ 가능!</div>
                                  {item.count > 1 && <div style={{ fontSize: 20, fontWeight: 700, color: C.g }}>{item.count.toLocaleString()}{item.unit || "개"}</div>}
                                </div>
                              ) : (
                                <div style={{ textAlign: "right" }}>
                                  <div style={{ fontSize: 12, color: C.r }}>부족</div>
                                  <div style={{ fontSize: 12, color: C.t3 }}>{shortNum(item.price - dreamCalc.netProfit)}원 더</div>
                                </div>
                              )}
                            </div>
                            {!item.unlocked && (
                              <div style={{ marginTop: 10, padding: "8px 12px", background: dark ? "#222" : "#f8f8f8", borderRadius: 10, fontSize: 12, color: C.t2 }}>
                                필요 목표가: <span style={{ fontWeight: 600, color: "#E67E22" }}>{commafy(item.needPrice)}원</span>
                                <span style={{ color: C.t3 }}> (+{item.needRate.toFixed(0)}%)</span>
                                {market === "us" && <span style={{ color: C.t3 }}> ≈ ${(item.needPrice / exRate).toFixed(2)}</span>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}

                    <button onClick={() => {
                      const ul = dreamCalc.items.filter(i => i.unlocked);
                      const topItem = ul.length > 0 ? ul[ul.length - 1] : dreamCalc.items[0];
                      const cnt = topItem ? Math.floor(Math.abs(dreamCalc.netProfit) / topItem.price) : 0;
                      const gP = (dreamCalc.slider - base.newAvg) * base.totalQty;
                      let tax = 0; if (market === "kr") tax = dreamCalc.slider * base.totalQty * 0.0018; else if (gP > 2500000) tax = (gP - 2500000) * 0.22;
                      setShareData({ type: "dream", market, newAvg: base.newAvg, targetPrice: dreamCalc.slider, profitRate: dreamCalc.profitRate, grossProfit: gP, netProfit: dreamCalc.netProfit, tax, taxLabel: market === "kr" ? "거래세 0.18%" : "양도세 22% (250만 공제)", exRate, item: topItem, itemCount: cnt });
                    }} style={{ width: "100%", padding: 16, marginTop: 16, background: "linear-gradient(135deg,#E67E22,#F39C12)", color: "#fff", border: "none", borderRadius: 14, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>📋 꿈 계산 결과 공유하기</button>
                  </div>
                );
              })()}
            </>
          )}

          {/* 콘텐츠 / SEO 섹션 */}
          <div style={{ marginTop: 32, lineHeight: 1.8 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.g, marginBottom: 12 }}>물타기·불타기 계산기란?</h2>
            <p style={{ fontSize: 14, color: C.t2, marginBottom: 16 }}>
              평단이는 주식 투자자가 물타기와 불타기를 할 때 변하는 평균 매수 단가(평단가)와, 목표 주가 도달 시 예상되는 세전·세후 수익을 한 번에 계산해 주는 무료 도구입니다.
              복잡한 수식 없이 보유 단가와 수량, 추가 매수 정보만 입력하면 새로운 평단가와 수익률이 즉시 계산됩니다. 국내주식과 미국주식의 세금 차이까지 반영해 실제 손에 쥐는 금액을 보여줍니다.
            </p>

            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.g, marginBottom: 12 }}>물타기와 불타기의 차이</h2>
            <p style={{ fontSize: 14, color: C.t2, marginBottom: 16 }}>
              물타기는 보유 종목의 주가가 평단가보다 내려갔을 때 추가로 매수해 평균 매수 단가를 낮추는 전략입니다.
              평단가가 낮아지면 주가가 조금만 반등해도 손익분기점에 빨리 도달할 수 있습니다.
              반대로 불타기는 주가가 평단가보다 올라갔을 때 추가 매수하는 것으로, 상승 추세에 올라타되 평균 단가는 높아집니다.
              두 전략 모두 평단이의 추가 매수 입력란에 가격과 수량을 넣으면 결과를 바로 확인할 수 있습니다.
            </p>

            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.g, marginBottom: 12 }}>평단가 계산 방법</h2>
            <p style={{ fontSize: 14, color: C.t2, marginBottom: 16 }}>
              평균 매수 단가는 '총 매수 금액 ÷ 총 보유 수량'으로 계산합니다.
              예를 들어 5만 원에 100주를 사고, 이후 4만 원에 100주를 추가 매수하면 총 매수 금액은 900만 원, 총 수량은 200주이므로 평단가는 4만 5천 원이 됩니다.
              평단이는 여러 번의 추가 매수도 누적해서 자동으로 계산해 줍니다.
            </p>

            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.g, marginBottom: 12 }}>국내주식과 미국주식 세금 차이</h2>
            <p style={{ fontSize: 14, color: C.t2, marginBottom: 16 }}>
              국내주식은 매도 시 증권거래세 0.18%가 부과됩니다(2025년 기준). 별도의 양도소득세는 대주주가 아닌 일반 투자자에게는 적용되지 않습니다.
              미국주식은 양도소득세가 22%이며, 연간 250만 원까지는 기본 공제됩니다. 즉 한 해 동안의 매매 차익에서 250만 원을 뺀 금액에 대해 22%가 과세됩니다.
              평단이는 시장을 선택하면 이 차이를 자동으로 반영해 세후 실수익을 계산합니다.
            </p>

            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.g, marginBottom: 12 }}>평단이 사용법</h2>
            <p style={{ fontSize: 14, color: C.t2, marginBottom: 16 }}>
              먼저 국내주식 또는 미국주식을 선택합니다. 현재 보유한 평균 매수 단가와 수량을 입력하고, 물타기나 불타기로 추가 매수한 내역을 넣습니다.
              팔고 싶은 목표 주가를 입력한 뒤 계산하기를 누르면 새 평단가, 수익률, 세전·세후 수익, 그리고 그 수익이 치킨 몇 마리에 해당하는지까지 보여 줍니다.
              꿈 계산기 탭에서는 내 주식 수익으로 살 수 있는 물건들을 게임처럼 확인할 수 있습니다.
            </p>

            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.g, marginBottom: 12 }}>자주 묻는 질문</h2>
            <div style={{ fontSize: 14, color: C.t2, marginBottom: 8 }}>
              <p style={{ fontWeight: 600, color: C.t1, marginBottom: 4 }}>Q. 평단이는 무료인가요?</p>
              <p style={{ marginBottom: 14 }}>네, 평단이의 모든 계산 기능은 무료로 제공됩니다.</p>

              <p style={{ fontWeight: 600, color: C.t1, marginBottom: 4 }}>Q. 입력한 정보가 저장되나요?</p>
              <p style={{ marginBottom: 14 }}>모든 계산은 사용자의 브라우저에서만 처리되며, 서버에 저장되거나 전송되지 않습니다.</p>

              <p style={{ fontWeight: 600, color: C.t1, marginBottom: 4 }}>Q. 세금 계산 결과는 정확한가요?</p>
              <p style={{ marginBottom: 14 }}>일반적인 세율을 기준으로 한 추정치이며, 실제 세금은 개인의 상황에 따라 다를 수 있습니다. 참고용으로만 활용하시기 바랍니다.</p>

              <p style={{ fontWeight: 600, color: C.t1, marginBottom: 4 }}>Q. 미국주식 환율은 어떻게 적용되나요?</p>
              <p style={{ marginBottom: 0 }}>당일 USD/KRW 환율을 자동으로 가져와 원화와 달러를 함께 표시합니다.</p>
            </div>

            <p style={{ fontSize: 12, color: C.t3, marginTop: 16, fontStyle: "italic" }}>
              ※ 평단이가 제공하는 정보는 투자 권유나 세무 자문이 아니며, 투자 판단의 책임은 본인에게 있습니다.
            </p>
          </div>

          {/* Footer */}
          <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: C.t3, lineHeight: 1.8 }}>
            <div style={{ fontWeight: 600 }}>평단이 🕯️</div>
            <div>세금은 참고용이며 실제와 차이가 있을 수 있습니다</div>
            <div>국내: 거래세 0.18% · 미국: 양도세 22% (250만 공제)</div>
            {market === "us" && <div>환율: {commafy(exRate)}원/$ {rateLive ? "(실시간)" : "(기본값)"}</div>}

            <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.bd}`, display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
              <a href="/guide-multaegi.html" style={{ color: C.t3, textDecoration: "none", fontSize: 11 }}>물타기 가이드</a>
              <a href="/guide-average.html" style={{ color: C.t3, textDecoration: "none", fontSize: 11 }}>평단가 계산법</a>
              <a href="/guide-tax.html" style={{ color: C.t3, textDecoration: "none", fontSize: 11 }}>세금 가이드</a>
            </div>
            <div style={{ marginTop: 8, display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
              <a href="/about.html" style={{ color: C.t3, textDecoration: "none", fontSize: 11 }}>서비스 소개</a>
              <a href="/privacy.html" style={{ color: C.t3, textDecoration: "none", fontSize: 11 }}>개인정보처리방침</a>
            </div>

            <div style={{ marginTop: 10, fontSize: 11, color: C.t3 }}>
              광고 및 협업 문의: <a href="mailto:pyeongdani@gmail.com" style={{ color: C.g, textDecoration: "none", fontWeight: 500 }}>pyeongdani@gmail.com</a>
            </div>

            <div style={{ marginTop: 8, fontSize: 10, color: dark ? "#333" : "#ddd" }}>© 2025 평단이. All rights reserved.</div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {shareData && <ShareModal data={shareData} dark={dark} onClose={() => setShareData(null)} />}
    </div>
  );
}