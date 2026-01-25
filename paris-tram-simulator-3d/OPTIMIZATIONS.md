# Performance Optimization Report

After analyzing the codebase, the following performance bottlenecks and optimization opportunities were identified:

## 1. High CPU Overhead from React Components (Critical)
**Issue:** The game creates ~200 `Car` components and many `StreetLight` components. Each component has its own `useFrame` hook.
**Impact:** This causes hundreds of React hook calls and reconciliation steps every frame (~60fps), putting significant load on the main thread (CPU).
**Solution:** 
- **Centralized Logic:** Move the physics/logic for all cars into a single loop (e.g., inside `TrafficManager` or a custom Store).
- **Reduced Hooks:** Remove `useFrame` from individual static objects like Street Lights.

## 2. Expensive Collision Detection (Critical)
**Issue:** Each of the 200 cars checks for collisions against *every other car* every frame. This is an O(N^2) operation (40,000 checks per frame).
**Impact:** Massive CPU usage as the number of cars increases.
**Solution:**
- **Spatial Partitioning:** Implement a Grid or Spatial Hash to only check collisions with nearby cars.
- **Logic Simplification:** Only check for cars on the *same track* or approaching intersections.

## 3. Excessive Draw Calls (Rendering)
**Issue:** Each rendering of a car, street light, or pole is a separate "Draw Call" to the GPU.
- 200 Cars * ~6 meshes per car = ~1200 draw calls.
- Street lights and poles add hundreds more.
**Impact:** High GPU driver overhead, leading to lower frame rates even on powerful GPUs.
**Solution:**
- **InstancedMesh:** Use `InstancedMesh` for Cars, Street Lights, and Catenary Poles. This draws all 200 cars of the same type in a single draw call.
- **Geometry Merging:** Merge static wires into a single mesh.

## 4. Redundant Manual Frustum Culling
**Issue:** `City.tsx` (StreetLight) and `StopMarker` implement manual frustum culling using `GLOBAL_FRUSTUM.intersectsSphere`.
**Impact:** Three.js already performs frustum culling automatically and efficiently using object bounding spheres. Doing it manually in JavaScript adds unnecessary CPU overhead.
**Solution:** Remove manual frustum checks and rely on the engine's built-in culling.

## 5. Lighting Optimization
**Issue:** Usage of many real-time `SpotLights` (even with distance culling) is expensive.
**Solution:** Use "Baked" lighting where possible, or strictly limit the number of active shadow-casting lights to only those nearest the camera.

---

## Recommended Action Plan

1.  **Refactor Cars to use Instancing**: This is the single biggest performance win. Convert `Car.tsx` to a logic-only system that updates an `InstancedMesh`.
2.  **Remove Manual Culling**: Delete the logic in `City.tsx` that manually checks visibility.
3.  **Optimize Traffic Logic**: Optimize the `getOtherCars` scan.
