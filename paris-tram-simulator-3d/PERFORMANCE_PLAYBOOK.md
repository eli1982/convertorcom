# 🚀 React Three Fiber (R3F) Performance Playbook

This guide outlines the optimization patterns used to scale from laggy prototypes to high-performance 3D applications. These techniques focus on reducing **CPU Overhead (React)** and **Draw Calls (GPU)**.

---

## 1. The "Instance" Pattern (For Dynamic Objects)
**Use Case:** Crowds, traffic, particles, projectiles, foliages.
**Problem:** Creating 1000 `<Car />` components means 1000 React lifecycles, 1000 `useFrame` hooks, and 1000 GPU draw calls.
**Solution:** `InstancedMesh`.

### ❌ Bad Approach (Component Heavy)
```tsx
// 1000 draw calls, 1000 hooks
{cars.map(car => (
  <mesh key={car.id} position={car.pos} geometry={geo} material={mat}>
    <useFrame(() => updateLogic()) /> // 💀 Kills CPU
  </mesh>
))}
```

### ✅ Optimized Approach (Instanced)
```tsx
// 1 draw call, 1 hook
const TrafficSystem = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  useFrame(() => {
    // ⚡ Single loop updating all matrices directly
    const dummy = new THREE.Object3D();
    cars.forEach((car, i) => {
      dummy.position.copy(car.position);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, 1000]} />
  );
};
```

---

## 2. Geometry Merging (For Static Objects)
**Use Case:** Fences, power lines, distant buildings, trees that don't move.
**Problem:** Even valid static objects have overhead if they are separate meshes.
**Solution:** `mergeBufferGeometries` from `three-stdlib`.

### ✅ Implementation
```tsx
import { mergeBufferGeometries } from 'three-stdlib';

const StaticWorld = () => {
  const mergedGeometry = useMemo(() => {
    const geometries = [];
    // Generate geometries programmatically
    const part = new THREE.BoxGeometry();
    part.translate(10, 0, 0);
    geometries.push(part);
    
    // ⚡ Merge into one giant buffer
    return mergeBufferGeometries(geometries);
  }, []);

  return <mesh geometry={mergedGeometry} material={standardMat} />;
};
```

---

## 3. Centralized Logic Manager
**Use Case:** Game state, physics, collision detection.
**Problem:** Distributed logic (logic inside every child component) scales poorly ($O(N)$ hooks). React Reconciliation detects changes too slowly for 60FPS physics.
**Solution:** A Single Loop Manager.

### ✅ Implementation
```tsx
// TrafficManager.tsx
useFrame((state, delta) => {
  // 1. Physics Step
  // Update raw JS objects (not React state)
  gameEntities.forEach(entity => {
      entity.x += entity.velocity * delta;
      
      // ⚡ Optimized Collision: Check only relevant neighbors
      // (e.g. entities on the same 'track' or grid cell)
      const neighbors = grid.get(entity.sector); 
      checkCollisions(entity, neighbors);
  });
  
  // 2. Render Sync
  // Sync raw data to the InstancedMesh references
  syncVisuals();
});
```

---

## 4. Material Sharing & Global Animation
**Use Case:** Blinking lights, day/night cycles, fading effects.
**Problem:** Changing a prop on 100 components causes 100 re-renders.
**Solution:** Share a single Material and animate its properties.

### ✅ Implementation
```tsx
const sharedMaterial = useRef(new THREE.MeshStandardMaterial({ color: 'white' }));

useFrame(({ clock }) => {
  // Animate one material, affect 1000 objects instantly
  const t = Math.sin(clock.elapsedTime);
  sharedMaterial.current.emissiveIntensity = t;
});

return <instancedMesh material={sharedMaterial.current} ... />
```

---

## 5. Avoid Manual Culling (Let Three.js do it)
**Problem:** Calculating `frustum.intersectsSphere()` in a JS loop is slower than letting the GPU/Engine handle it, especially for InstancedMeshes where you want batching.
**Rule:** Only use manual distance checks (LOD - Level of Detail) to completely stop processing logic for far-away items. For rendering visibility, trust the engine.

---

## Checklist for New Features
1. [ ] **Is it static?** Merge the geometry.
2. [ ] **Is it repeated > 50 times?** Use Instancing.
3. [ ] **Does it need per-frame logic?** Put it in a central manager, not individual hooks.
4. [ ] **Collision Checks?** Use a spatial lookup (Grid/Track ID), never iterate all-vs-all.
