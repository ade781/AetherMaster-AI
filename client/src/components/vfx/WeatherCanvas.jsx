import React, { useEffect, useRef } from 'react';

export const WeatherCanvas = ({ weather = 'embers' }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let width = (canvas.width = canvas.parentElement.clientWidth);
    let height = (canvas.height = canvas.parentElement.clientHeight);

    const particles = [];
    const count = weather === 'rain' ? 80 : weather === 'snow' ? 50 : 35;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * (weather === 'snow' ? 3 : 2) + 1,
        speedX: weather === 'rain' ? 1.5 : (Math.random() - 0.5) * 1.2,
        speedY: weather === 'rain' ? Math.random() * 8 + 6 : weather === 'snow' ? Math.random() * 1.5 + 0.5 : -Math.random() * 1.5 - 0.5,
        opacity: Math.random() * 0.7 + 0.3,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap around bounds
        if (weather === 'embers') {
          if (p.y < 0) { p.y = height; p.x = Math.random() * width; }
        } else {
          if (p.y > height) { p.y = 0; p.x = Math.random() * width; }
        }
        if (p.x > width) p.x = 0;
        if (p.x < 0) p.x = width;

        ctx.beginPath();
        if (weather === 'rain') {
          ctx.strokeStyle = `rgba(174, 214, 241, ${p.opacity * 0.6})`;
          ctx.lineWidth = 1.2;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.speedX * 2, p.y + p.speedY * 2);
          ctx.stroke();
        } else if (weather === 'snow') {
          ctx.fillStyle = `rgba(240, 243, 244, ${p.opacity * 0.8})`;
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Embers / Fire particles
          ctx.fillStyle = `rgba(243, 156, 18, ${p.opacity * 0.75})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#e67e22';
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [weather]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10 w-full h-full"
    />
  );
};
