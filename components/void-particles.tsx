"use client"

import { useRef, useMemo, useEffect, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

interface ParticleFieldProps {
  count?: number
  mousePosition: { x: number; y: number }
  timeOfDay: "night" | "twilight" | "day"
  intensity: number
}

function ParticleField({ count = 2000, mousePosition, timeOfDay, intensity }: ParticleFieldProps) {
  const mesh = useRef<THREE.Points>(null)
  const { viewport } = useThree()

  const colorPalette = useMemo(() => {
    switch (timeOfDay) {
      case "night":
        return {
          primary: new THREE.Color("#1b263b"),
          secondary: new THREE.Color("#0d1b2a"),
          accent: new THREE.Color("#415a77"),
        }
      case "twilight":
        return {
          primary: new THREE.Color("#1b263b"),
          secondary: new THREE.Color("#2a3f5f"),
          accent: new THREE.Color("#8b0000"),
        }
      case "day":
        return {
          primary: new THREE.Color("#0d1b2a"),
          secondary: new THREE.Color("#1b263b"),
          accent: new THREE.Color("#ffd700"),
        }
    }
  }, [timeOfDay])

  const [positions, velocities, colors, sizes] = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      positions[i3] = (Math.random() - 0.5) * 20
      positions[i3 + 1] = (Math.random() - 0.5) * 20
      positions[i3 + 2] = (Math.random() - 0.5) * 10

      velocities[i3] = (Math.random() - 0.5) * 0.01
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.01
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.005

      const colorChoice = Math.random()
      const color =
        colorChoice < 0.6
          ? colorPalette.primary
          : colorChoice < 0.9
            ? colorPalette.secondary
            : colorPalette.accent

      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b

      sizes[i] = Math.random() * 3 + 0.5
    }

    return [positions, velocities, colors, sizes]
  }, [count, colorPalette])

  useFrame((state) => {
    if (!mesh.current) return

    const positionAttribute = mesh.current.geometry.attributes.position as THREE.BufferAttribute
    const positionArray = positionAttribute.array as Float32Array
    const colorAttribute = mesh.current.geometry.attributes.color as THREE.BufferAttribute
    const colorArray = colorAttribute.array as Float32Array

    const time = state.clock.elapsedTime
    const mouseX = (mousePosition.x - 0.5) * viewport.width
    const mouseY = (mousePosition.y - 0.5) * viewport.height

    for (let i = 0; i < count; i++) {
      const i3 = i * 3

      // Calculate distance from mouse
      const dx = positionArray[i3] - mouseX
      const dy = positionArray[i3 + 1] + mouseY
      const distance = Math.sqrt(dx * dx + dy * dy)

      // Particles react to mouse - gentle push away
      if (distance < 3) {
        const force = ((3 - distance) / 3) * 0.02 * intensity
        positionArray[i3] += dx * force
        positionArray[i3 + 1] += dy * force
      }

      // Organic movement
      positionArray[i3] += velocities[i3] + Math.sin(time * 0.5 + i) * 0.002
      positionArray[i3 + 1] += velocities[i3 + 1] + Math.cos(time * 0.3 + i) * 0.002
      positionArray[i3 + 2] += velocities[i3 + 2]

      // Wrap around
      if (positionArray[i3] > 10) positionArray[i3] = -10
      if (positionArray[i3] < -10) positionArray[i3] = 10
      if (positionArray[i3 + 1] > 10) positionArray[i3 + 1] = -10
      if (positionArray[i3 + 1] < -10) positionArray[i3 + 1] = 10
      if (positionArray[i3 + 2] > 5) positionArray[i3 + 2] = -5
      if (positionArray[i3 + 2] < -5) positionArray[i3 + 2] = 5

      // Pulsing colors for accent particles
      if (i % 10 === 0) {
        const pulse = Math.sin(time * 2 + i) * 0.3 + 0.7
        colorArray[i3] = colorPalette.accent.r * pulse
        colorArray[i3 + 1] = colorPalette.accent.g * pulse
        colorArray[i3 + 2] = colorPalette.accent.b * pulse
      }
    }

    positionAttribute.needsUpdate = true
    colorAttribute.needsUpdate = true
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={count} array={sizes} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.8 * intensity}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function FloatingOrbs({ mousePosition, intensity }: { mousePosition: { x: number; y: number }; intensity: number }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!groupRef.current) return
    const time = state.clock.elapsedTime
    
    groupRef.current.rotation.x = Math.sin(time * 0.1) * 0.1
    groupRef.current.rotation.y = time * 0.05
    
    // Respond to mouse
    groupRef.current.position.x = (mousePosition.x - 0.5) * 0.5
    groupRef.current.position.y = (mousePosition.y - 0.5) * -0.5
  })

  return (
    <group ref={groupRef}>
      {[...Array(5)].map((_, i) => (
        <mesh key={i} position={[
          Math.sin(i * 1.2) * 4,
          Math.cos(i * 1.2) * 4,
          Math.sin(i * 0.8) * 2
        ]}>
          <sphereGeometry args={[0.1 + i * 0.02, 16, 16]} />
          <meshBasicMaterial
            color={i % 2 === 0 ? "#1b263b" : "#ffd700"}
            transparent
            opacity={0.3 * intensity}
          />
        </mesh>
      ))}
    </group>
  )
}

export function VoidParticles({ visible }: { visible: boolean }) {
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 })
  const [timeOfDay, setTimeOfDay] = useState<"night" | "twilight" | "day">("night")
  const [intensity, setIntensity] = useState(0)

  useEffect(() => {
    // Determine time of day
    const hour = new Date().getHours()
    if (hour >= 6 && hour < 8) {
      setTimeOfDay("twilight")
    } else if (hour >= 8 && hour < 18) {
      setTimeOfDay("day")
    } else if (hour >= 18 && hour < 20) {
      setTimeOfDay("twilight")
    } else {
      setTimeOfDay("night")
    }

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        setIntensity(1)
      }, 100)
      return () => clearTimeout(timer)
    } else {
      setIntensity(0)
    }
  }, [visible])

  return (
    <div 
      className="fixed inset-0 z-0 transition-opacity duration-2000"
      style={{ opacity: intensity }}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ParticleField 
          count={1500} 
          mousePosition={mousePosition} 
          timeOfDay={timeOfDay}
          intensity={intensity}
        />
        <FloatingOrbs mousePosition={mousePosition} intensity={intensity} />
        <ambientLight intensity={0.1} />
      </Canvas>
    </div>
  )
}
