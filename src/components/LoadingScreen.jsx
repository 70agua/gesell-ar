// ============================================================
//  src/components/LoadingScreen.jsx
//  Pantalla de carga global — usa loading-casa.webm
// ============================================================

export default function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#fff',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{ width: 140, height: 'auto' }}
      >
        <source src="/loading-casa.webm" type="video/webm" />
      </video>
    </div>
  );
}
