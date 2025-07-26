import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Carousel } from 'react-responsive-carousel';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { users } from '../utils/configuraciones/config.js';

const images = [
  "ImagenesAmbiocom/ambiocom1.png",
  "ImagenesAmbiocom/ambiocom2.png",
  "ImagenesAmbiocom/ambiocom3.avif",
  "ImagenesAmbiocom/ambiocom11.jpeg",
  "ImagenesAmbiocom/ambiocom5.jpeg",
  "ImagenesAmbiocom/ambiocom6.jpeg",
  "ImagenesAmbiocom/ambiocom7.jpeg",
  "ImagenesAmbiocom/ambiocom8.jpeg",
  "ImagenesAmbiocom/ambiocom9.jpeg",
];

const LoginBox = () => {
  const navigate = useNavigate();
  const [capsLock, setCapsLock] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleLogin = () => {
    console.log("email y passwor recibidos:", email, password);
    
    if (!email || !password) {
      setError("Por favor completa ambos campos");
      return;
    }
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      setError("Credenciales incorrectas");
      return;
    }
    sessionStorage.setItem("usuario", JSON.stringify({
      email: user.email,
      rol: user.rol
    }));
    navigate("/principal");
  };

  const handleKeyDown = (e) => {
    setCapsLock(e.getModifierState("CapsLock"));
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 9999
    }}>
      <Carousel
        autoPlay
        infiniteLoop
        interval={5000}
        showThumbs={false}
        showStatus={false}
        showArrows={false}
        transitionTime={1000}
        stopOnHover={false}
        swipeable={false}
        emulateTouch={false}
        dynamicHeight={false}
      >
        {images.map((src, index) => (
          <div key={index} style={{ height: '100vh' }}>
            <img src={src} alt={`slide-${index}`} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
          </div>
        ))}
      </Carousel>

      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        padding: '40px 30px',
        borderRadius: '10px',
        width: '100%',
        maxWidth: '450px',
        boxShadow: '0 0 15px rgba(0,0,0,0.3)',
        textAlign: 'center',
        backdropFilter: 'blur(5px)'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <img src="/ambiocom.png" alt="Logo" style={{ maxWidth: '250px', height: 'auto' }} />
        </div>
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '15px',
            border: '1px solid #ccc',
            borderRadius: '5px',
            fontSize: '16px',
            textAlign: 'left',
            boxSizing: 'border-box'
          }}
        />
        <div style={{ position: 'relative', marginBottom: '15px', width: '100%' }}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
            style={{
              width: '100%',
              padding: '10px 40px 10px 10px',
              border: '1px solid #ccc',
              borderRadius: '5px',
              fontSize: '16px',
              textAlign: 'left',
              boxSizing: 'border-box'
            }}
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              right: '10px',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>
        {capsLock && (
          <div style={{ color: 'red', fontSize: '14px', marginBottom: '10px' }}>
            ¡Bloq Mayús está activado!
          </div>
        )}
        {error && (
          <div style={{ color: 'red', fontSize: '14px', marginBottom: '10px' }}>
            {error}
          </div>
        )}
        <button
          onClick={handleLogin}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#212D63',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          Ingresar
        </button>
      </div>
    </div>
  );
};

export default LoginBox;
