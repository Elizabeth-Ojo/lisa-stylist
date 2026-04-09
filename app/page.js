"use client";
import { useState, useEffect } from "react";

const OCC = [
  ["Casual Day Out","☀️"],["Brunch","🥂"],["Work / Office","💼"],
  ["Date Night","🌙"],["Formal Event","✨"],["Church","🙏🏾"],
  ["Girls' Night","💃🏾"],["Shopping","🛍️"],["Weekend Chill","🧘🏾"],["Travel / Airport","✈️"],
];
const QUICK = [
  "High-waisted white wide-leg trousers with cream cardigan as top",
  "Black midi bodycon dress with long sleeves",
  "Emerald green knit tucked into wide-leg jeans with brown belt",
  "Cream linen shirt tucked into white trousers with tan loafers",
  "Burgundy mohair sweater tucked into light wash jeans",
];
const PCOLS = [
  ["#2E7D32","Emerald"],["#7B1FA2","Purple"],["#880E4F","Burgundy"],
  ["#E91E63","Fuchsia"],["#F48FB1","Pink"],["#F9A825","Yellow"],
  ["#00695C","Teal"],["#FFF","White"],["#1A1A1A","Black"],
];

async function getWx() {
  try {
    const r = await fetch("https://api.open-meteo.com/v1/forecast?latitude=53.3498&longitude=-6.2603&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&daily=precipitation_probability_max&timezone=Europe%2FDublin&forecast_days=1");
    const d = await r.json(); const c = d.current.weather_code;
    return {
      t: Math.round(d.current.temperature_2m), f: Math.round(d.current.apparent_temperature),
      txt: c<=1?"Clear":c<=3?"Partly cloudy":c<=48?"Foggy":c<=57?"Drizzle":c<=67?"Rainy":c<=77?"Snow":"Showers",
      ico: c<=1?"☀️":c<=3?"⛅":c<=48?"🌫️":c<=67?"🌧️":c<=77?"❄️":"⛈️",
      wind: Math.round(d.current.wind_speed_10m), rain: d.daily?.precipitation_probability_max?.[0]||0
    };
  } catch { return {t:11,f:9,txt:"Overcast",ico:"⛅",wind:18,rain:55}; }
}

function ProdCard({ query, cat }) {
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bad, setBad] = useState(false);

  useEffect(() => {
    let x = false;
    setLoading(true); setBad(false); setD(null);
    fetch("/api/images", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({query}) })
      .then(r => r.json())
      .then(j => { if (!x && j.imageUrl) setD(j); else if (!x) setBad(true); })
      .catch(() => { if (!x) setBad(true); })
      .finally(() => { if (!x) setLoading(false); });
    return () => { x = true; };
  }, [query]);

  if (loading) return <div className="shim"><div className="shim-sp"/><span className="shim-t">Finding</span></div>;
  if (bad || !d) return <div className="empty"><span style={{fontSize:28}}>👗</span><span style={{fontSize:10,color:"var(--muted)"}}>{cat}</span></div>;

  return (
    <div className="fade-in">
      <div className="img-w"><img src={d.imageUrl} alt={d.productName||cat} onError={()=>setBad(true)}/></div>
      <div style={{marginTop:8}}>
        {d.brand && <div className="p-brand">{d.brand}</div>}
        {d.productName && <div className="p-name">{d.productName.length>38?d.productName.slice(0,38)+"…":d.productName}</div>}
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
          {d.price && <span className="p-price">{d.price}</span>}
          {d.shopUrl && <a href={d.shopUrl} target="_blank" rel="noopener noreferrer" className="shop">Shop →</a>}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [v, setV] = useState("home");
  const [outfit, setOutfit] = useState("");
  const [occ, setOcc] = useState("");
  const [wx, setWx] = useState({t:11,f:9,txt:"Loading…",ico:"⛅",wind:18,rain:55});
  const [res, setRes] = useState(null);
  const [tab, setTab] = useState(0);
  const [hist, setHist] = useState([]);
  const [err, setErr] = useState(null);
  const [prof, setProf] = useState(false);

  useEffect(() => { getWx().then(setWx); }, []);
  const wStr = `${wx.t}°C (feels ${wx.f}°C), ${wx.txt}, wind ${wx.wind}km/h, ${wx.rain}% rain`;

  async function go() {
    if (!outfit.trim()||!occ) return;
    setErr(null); setV("loading");
    try {
      const r = await fetch("/api/style", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({outfit:outfit.trim(),occasion:occ,weather:wStr}),
      });
      const data = await r.json();
      if (!r.ok) { setErr(data.error||`Error ${r.status}`); setV("input"); return; }
      if (data.options?.length) {
        setRes(data); setTab(0);
        setHist(h=>[{outfit:outfit.trim(),occ,date:new Date().toLocaleDateString(),result:data},...h.slice(0,9)]);
        setV("results");
      } else { setErr("No options returned. Try again."); setV("input"); }
    } catch(e) { setErr("Connection error: "+(e.message||"Check internet")); setV("input"); }
  }
  function reset(){setOutfit("");setOcc("");setRes(null);setErr(null);setV("input")}

  const Wx=()=>(
    <div className="wx">
      <span style={{fontSize:18}}>{wx.ico}</span>
      <span style={{fontWeight:600,color:"var(--text)",fontSize:14}}>{wx.t}°</span>
      <span>Dublin · {wx.txt}</span>
      <span style={{marginLeft:"auto",fontSize:11,color:wx.rain>40?"#D4816B":"var(--muted)"}}>{wx.rain}% 🌧</span>
    </div>
  );

  return (
    <div className="container">
      <header className="header">
        <div>
          <div className="logo">STYLE<span className="logo-dot">.</span></div>
          <div className="logo-sub">Lisa&apos;s Personal Stylist</div>
        </div>
        <button className="prof-btn" onClick={()=>setProf(true)}>L</button>
      </header>

      {v==="home"&&(
        <div className="fade-in">
          <Wx/>
          <div className="sec" style={{paddingTop:40}}>
            <h1 className="hero-t">What are you<br/>wearing <span className="hero-acc">today</span>?</h1>
            <p className="hero-sub">Describe your outfit. I&apos;ll style it three ways with product photos — built around your body, your colours, and Dublin weather.</p>
            <button className="btn" onClick={()=>setV("input")}>Style My Outfit</button>
          </div>
          <div className="sec">
            <div className="sec-lbl">Quick starts</div>
            {QUICK.map((s,i)=><button key={i} className="q-btn" onClick={()=>{setOutfit(s);setV("input")}}>{s}</button>)}
          </div>
          {hist.length>0&&(
            <div className="sec" style={{paddingBottom:32}}>
              <div className="sec-lbl">Recent looks</div>
              {hist.map((h,i)=>(
                <div key={i} className="hist" onClick={()=>{setRes(h.result);setTab(0);setV("results")}}>
                  <div style={{fontSize:13,fontWeight:500,marginBottom:3}}>{h.outfit.length>50?h.outfit.slice(0,50)+"…":h.outfit}</div>
                  <div style={{fontSize:11,color:"var(--muted)"}}>{h.occ} · {h.date}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {v==="input"&&(
        <div className="fade-in">
          <Wx/>
          <div className="sec">
            <button className="back" onClick={()=>setV("home")}>← Back</button>
            <h2 className="pg-title">Describe your <span className="hero-acc">outfit</span></h2>
            <textarea className="textarea" value={outfit} onChange={e=>setOutfit(e.target.value)} placeholder="e.g. High-waisted cream trousers with a green cardigan…"/>
            <div className="sec-lbl" style={{marginTop:28}}>Where are you headed?</div>
            <div className="chips">
              {OCC.map(([l,e])=><button key={l} className={`chip ${occ===l?"chip-on":""}`} onClick={()=>setOcc(occ===l?"":l)}>{e} {l}</button>)}
            </div>
            {err&&<div className="err">{err}</div>}
            <div style={{marginTop:28}}>
              <button className="btn" onClick={go} disabled={!outfit.trim()||!occ}>Get My Styling + Photos</button>
            </div>
          </div>
        </div>
      )}

      {v==="loading"&&(
        <div className="load fade-in">
          <div className="ring-wrap"><div className="ring-o"/><div className="ring-i"/></div>
          <p style={{fontFamily:"var(--serif)",fontSize:24,fontWeight:300,marginTop:32,letterSpacing:1}}>Styling your look</p>
          <p style={{color:"var(--muted)",fontSize:12,marginTop:8,lineHeight:1.5}}>Checking colours, finding products,<br/>factoring in Dublin weather…</p>
        </div>
      )}

      {v==="results"&&res?.options&&(()=>{
        const o=res.options[tab]; if(!o) return null;
        return(
          <div className="fade-in">
            <Wx/>
            <div className="sec">
              <button className="back" onClick={reset}>← New Outfit</button>
              <div className="summary">
                <div className="summary-lbl">Your Outfit</div>
                <div style={{fontSize:13,lineHeight:1.5}}>{hist[0]?.outfit||outfit}</div>
                <div style={{fontSize:11,color:"var(--muted)",marginTop:6}}>{hist[0]?.occ||occ} · {wx.t}° {wx.txt}</div>
              </div>
              {res.colourNote&&(
                <div className="colour-note">
                  <div style={{fontSize:8,fontWeight:700,textTransform:"uppercase",letterSpacing:2,color:"#B88AD4",marginBottom:4}}>🎨 Colour Analysis</div>
                  <div style={{fontSize:12,lineHeight:1.6,color:"#c8b8d8"}}>{res.colourNote}</div>
                </div>
              )}
              <div className="tabs">
                {res.options.map((x,i)=>(
                  <button key={i} className={`tab ${tab===i?"tab-on":""}`} onClick={()=>setTab(i)}>
                    <div className={`tab-n ${tab===i?"tab-n-on":""}`}>{i+1}</div>
                    <div className="tab-lbl">{x.title.length>14?x.title.slice(0,14)+"…":x.title}</div>
                  </button>
                ))}
              </div>
              <div key={tab} className="fade-in">
                <h2 className="opt-t">{o.title}</h2>
                <p className="opt-v">{o.vibe}</p>
                <div className="grid">
                  {o.pieces?.map((p,j)=>(
                    <div key={`${tab}-${j}`} style={{animation:`fadeUp .4s ease-out ${j*.08}s both`}}>
                      <ProdCard query={p.imageSearch} cat={p.category}/>
                      <div style={{marginTop:10}}>
                        <div className="p-cat">{p.category}</div>
                        <div className="p-rec">{p.rec}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="tip tip-p">
                  <div className="tip-lbl" style={{color:"#7AB87A"}}>👑 Petite Power</div>
                  <div style={{fontSize:12,lineHeight:1.6,color:"#a8c8a8"}}>{o.petiteTip}</div>
                </div>
                <div className="tip tip-l">
                  <div className="tip-lbl" style={{color:"var(--gold)"}}>💎 Look Expensive</div>
                  <div style={{fontSize:12,lineHeight:1.6,color:"var(--gold-l)"}}>{o.luxeTip}</div>
                </div>
                <button className="btn-ghost" onClick={reset}>Style Another Outfit</button>
              </div>
            </div>
          </div>
        );
      })()}

      {prof&&(
        <div className="overlay" onClick={()=>setProf(false)}>
          <div className="sheet" onClick={e=>e.stopPropagation()}>
            <div className="handle"/>
            <h2 style={{fontFamily:"var(--serif)",fontSize:26,fontWeight:300,marginBottom:24}}>My Style <span className="hero-acc">Profile</span></h2>
            {[["Height",'5\'2"'],["Bust",'34"'],["Waist",'26-27"'],["Hips",'38"'],["Shape","Pear/Hourglass"],["Skin","Deep warm melanin"],["Location","Dublin"]].map(([k,val])=>(
              <div key={k} className="prof-row"><span style={{color:"var(--muted)"}}>{k}</span><span style={{fontWeight:500}}>{val}</span></div>
            ))}
            <div style={{marginTop:24,padding:18,background:"var(--gold-p)",borderRadius:16,border:"1px solid rgba(196,150,74,.12)"}}>
              <div style={{fontSize:8,fontWeight:700,letterSpacing:2,color:"var(--gold)",marginBottom:8,textTransform:"uppercase"}}>Power Colours</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {PCOLS.map(([c,n])=>(
                  <div key={n} style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:16,height:16,borderRadius:"50%",background:c,border:c==="#FFF"?"1px solid #333":"none"}}/>
                    <span style={{fontSize:10,color:"var(--muted)"}}>{n}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{marginTop:16,padding:18,background:"var(--card)",borderRadius:16,border:"1px solid var(--border)",marginBottom:24}}>
              <div style={{fontSize:8,fontWeight:700,letterSpacing:2,color:"var(--gold)",marginBottom:8,textTransform:"uppercase"}}>How I Style You</div>
              <div style={{fontSize:12,lineHeight:1.7,color:"var(--muted)"}}>Built from 85+ photos. I know your pear/hourglass shape, your power colours, your Dublin jackets, and your aesthetic. Product photos from real retailers.</div>
            </div>
            <button className="btn-ghost" onClick={()=>setProf(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
