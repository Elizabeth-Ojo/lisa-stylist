'use client';
import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [looks, setLooks] = useState(null);
  const [weather, setWeather] = useState(null);
  const fileRef = useRef();
  const cameraRef = useRef();

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=53.3498&longitude=-6.2603&current=temperature_2m,weathercode&timezone=Europe/Dublin')
      .then(r => r.json())
      .then(d => setWeather({ temp: Math.round(d.current.temperature_2m), code: d.current.weathercode }))
      .catch(() => {});
  }, []);

  const weatherDesc = (code) => {
    if (code === 0) return 'Clear';
    if (code <= 3) return 'Cloudy';
    if (code <= 67) return 'Rainy';
    if (code <= 77) return 'Snowy';
    return 'Mixed';
  };

  const handleFile = (file) => {
    if (!file) return;
    setImage(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onload = (e) => setImageBase64(e.target.result.split(',')[1]);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImage(null);
    setImageBase64(null);
    if (fileRef.current) fileRef.current.value = '';
    if (cameraRef.current) cameraRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!input.trim() && !imageBase64) return;
    setLoading(true);
    setLooks(null);
    try {
      const res = await fetch('/api/style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: input,
          imageBase64,
          weather: weather ? `${weather.temp}°C, ${weatherDesc(weather.code)} in Dublin` : 'Dublin weather'
        })
      });
      const data = await res.json();
      setLooks(data.looks);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const quickStarts = [
    'High-waisted white wide-leg trousers with cream cardigan as top',
    'Black midi bodycon dress with long sleeves',
    'Emerald green knit tucked into wide-leg jeans with brown belt',
    'Cream linen shirt tucked into white trousers with tan loafers',
    'Burgundy mohair sweater tucked into light wash jeans',
  ];

  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f5f0e8', fontFamily: "'Jost', sans-serif", padding: '0 0 80px' }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 24px 0' }}>
        <div>
          <div style={{ fontFamily: 'Cormorant Garamond', fontSize: 22, letterSpacing: 4, color: '#c9a84c' }}>STYLE.</div>
          <div style={{ fontSize: 9, letterSpacing: 3, color: '#666', marginTop: 2 }}>LISA'S PERSONAL STYLIST</div>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#c9a84c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond', fontSize: 16, color: '#0a0a0a', fontWeight: 600 }}>L</div>
      </div>

      {/* Weather */}
      {weather && (
        <div style={{ padding: '12px 24px 0', fontSize: 11, color: '#888', letterSpacing: 1 }}>
          ☁ {weather.temp}° · Dublin · {weatherDesc(weather.code)}
        </div>
      )}

      {/* Hero */}
      <div style={{ padding: '32px 24px 24px' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond', fontSize: 38, fontWeight: 300, lineHeight: 1.2, margin: 0 }}>
          What are you<br />wearing <em style={{ color: '#c9a84c' }}>today</em>?
        </h1>
        <p style={{ fontSize: 13, color: '#888', marginTop: 12, lineHeight: 1.6 }}>
          Describe your outfit or take a photo. I'll style it three ways — built around your body, your colours, and Dublin weather.
        </p>
      </div>

      {/* Photo Upload */}
      <div style={{ padding: '0 24px 16px' }}>
        {image ? (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img src={image} alt="uploaded" style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 12, border: '1px solid #222' }} />
            <button onClick={clearImage} style={{ position: 'absolute', top: 8, right: 8, background: '#0a0a0a', border: '1px solid #444', borderRadius: '50%', width: 28, height: 28, color: '#f5f0e8', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 12 }}>
            {/* Camera */}
            <button onClick={() => cameraRef.current.click()} style={{ flex: 1, padding: '14px', background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, color: '#c9a84c', fontSize: 13, letterSpacing: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>📷</span> Take Photo
            </button>
            {/* Upload */}
            <button onClick={() => fileRef.current.click()} style={{ flex: 1, padding: '14px', background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, color: '#888', fontSize: 13, letterSpacing: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🖼</span> Upload
            </button>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
          </div>
        )}
      </div>

      {/* Text input */}
      <div style={{ padding: '0 24px 16px' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={imageBase64 ? "Add details if you like (optional)..." : "Describe what you're wearing or want to style..."}
          rows={3}
          style={{ width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, color: '#f5f0e8', padding: '14px 16px', fontSize: 14, resize: 'none', fontFamily: 'Jost', boxSizing: 'border-box', outline: 'none' }}
        />
      </div>

      {/* CTA */}
      <div style={{ padding: '0 24px 24px' }}>
        <button
          onClick={handleSubmit}
          disabled={loading || (!input.trim() && !imageBase64)}
          style={{ width: '100%', padding: '16px', background: loading ? '#555' : '#c9a84c', color: '#0a0a0a', border: 'none', borderRadius: 12, fontSize: 12, fontFamily: 'Jost', fontWeight: 500, letterSpacing: 3, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
        >
          {loading ? 'STYLING YOU...' : 'STYLE MY OUTFIT'}
        </button>
      </div>

      {/* Quick starts */}
      {!looks && !loading && (
        <div style={{ padding: '0 24px' }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: '#444', marginBottom: 12 }}>QUICK STARTS</div>
          {quickStarts.map((q, i) => (
            <button key={i} onClick={() => setInput(q)} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: '1px solid #1a1a1a', borderRadius: 8, color: '#666', padding: '12px 14px', fontSize: 13, fontFamily: 'Jost', cursor: 'pointer', marginBottom: 8 }}>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {looks && (
        <div style={{ padding: '0 24px' }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: '#c9a84c', marginBottom: 20 }}>3 WAYS TO WEAR IT</div>
          {looks.map((look, i) => (
            <div key={i} style={{ marginBottom: 32, background: '#111', borderRadius: 16, padding: 20, border: '1px solid #1a1a1a' }}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: '#c9a84c', marginBottom: 8 }}>LOOK {i + 1}</div>
              <div style={{ fontFamily: 'Cormorant Garamond', fontSize: 22, marginBottom: 12 }}>{look.title}</div>
              <div style={{ fontSize: 13, color: '#aaa', lineHeight: 1.7, marginBottom: 16 }}>{look.description}</div>
              <div style={{ fontSize: 11, letterSpacing: 2, color: '#555', marginBottom: 8 }}>ADD TO THIS LOOK</div>
              {look.pieces && look.pieces.map((p, j) => (
                <div key={j} style={{ fontSize: 13, color: '#888', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>· {p}</div>
              ))}
            </div>
          ))}
          <button onClick={() => { setLooks(null); setInput(''); clearImage(); }} style={{ width: '100%', padding: '14px', background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 12, color: '#888', fontSize: 12, letterSpacing: 3, cursor: 'pointer', fontFamily: 'Jost' }}>
            START OVER
          </button>
        </div>
      )}
    </main>
  );
}
