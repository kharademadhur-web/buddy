import React, { useEffect, useRef } from 'react';

interface AnimatedGalaxyProps {
  isListening: boolean;
}

/**
 * Animated galaxy/particle effect similar to ChatGPT and Comet AI
 * Particles orbit around a central point with dynamic intensity based on listening state
 */
export default function AnimatedGalaxy({ isListening }: AnimatedGalaxyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.parentElement?.getBoundingClientRect();
    canvas.width = rect?.width || 400;
    canvas.height = rect?.height || 400;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(canvas.width, canvas.height) / 2 - 40;

    // Particle system
    const particles: Particle[] = [];
    let animationId: number;
    let time = 0;

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      angle: number;
      distance: number;
      speed: number;
      opacity: number;
      color: string;

      constructor() {
        this.angle = Math.random() * Math.PI * 2;
        this.distance = Math.random() * maxRadius * 0.6 + maxRadius * 0.2;
        this.speed = (Math.random() - 0.5) * 0.02 + 0.01;
        this.radius = Math.random() * 1.5 + 0.5;
        this.opacity = Math.random() * 0.6 + 0.4;
        this.color = `hsl(${Math.random() * 120 + 160}, ${Math.random() * 50 + 50}%, ${Math.random() * 40 + 50}%)`;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
      }

      update(time: number, isListening: boolean) {
        const intensityMultiplier = isListening ? 1.5 : 1;
        this.angle += this.speed * intensityMultiplier;
        this.distance += (Math.sin(time * 0.005 + this.angle) * 0.2 - 0.1) * intensityMultiplier;
        this.distance = Math.max(maxRadius * 0.1, Math.min(maxRadius, this.distance));

        this.x = centerX + Math.cos(this.angle) * this.distance;
        this.y = centerY + Math.sin(this.angle) * this.distance;

        // Pulsing effect
        this.opacity = Math.sin(time * 0.003 + this.angle) * 0.3 + 0.5;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // Initialize particles
    const particleCount = 60;
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Connection drawing
    const drawConnections = (ctx: CanvasRenderingContext2D) => {
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.1)';
      ctx.lineWidth = 0.5;

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            const opacity = 1 - distance / 100;
            ctx.strokeStyle = `rgba(100, 200, 255, ${opacity * 0.2})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    };

    // Center glow
    const drawCenterGlow = (ctx: CanvasRenderingContext2D) => {
      const pulseSize = 30 + Math.sin(time * 0.01) * 10;
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseSize * 2);
      gradient.addColorStop(0, 'rgba(100, 200, 255, 0.4)');
      gradient.addColorStop(0.5, 'rgba(100, 200, 255, 0.1)');
      gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(centerX - pulseSize * 2, centerY - pulseSize * 2, pulseSize * 4, pulseSize * 4);

      // Inner core
      ctx.fillStyle = 'rgba(150, 220, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
      ctx.fill();
    };

    // Animation loop
    const animate = () => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      time++;

      // Update and draw particles
      particles.forEach((p) => {
        p.update(time, isListening);
        p.draw(ctx);
      });

      // Draw connections
      drawConnections(ctx);

      // Draw center glow
      drawCenterGlow(ctx);

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isListening]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        margin: 0,
        padding: 0,
      }}
    />
  );
}
