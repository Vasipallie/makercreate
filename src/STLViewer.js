import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';

export function STLViewer({ url }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return undefined;
    }

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });
    renderer.setClearColor(0x121212, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x121212);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 5000);
    camera.position.set(0, 0, 600);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enableZoom = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.5;
    controls.minDistance = 60;
    controls.maxDistance = 2000;
    controls.target.set(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 1.05));

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.6);
    directionalLight.position.set(80, 120, 80);
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x9be8b3, 0.7);
    fillLight.position.set(-80, 20, -80);
    scene.add(fillLight);

    let disposed = false;
    let animationFrameId = 0;
    let isPageVisible = !document.hidden;
    let isInViewport = true;
    let isLoopRunning = false;
    let mesh = null;

    const getPixelRatio = () => {
      const width = canvas.clientWidth || 0;
      const height = canvas.clientHeight || 0;
      const area = width * height;
      const baseRatio = window.devicePixelRatio || 1;

      if (area > 260000) {
        return Math.min(baseRatio, 1);
      }

      if (area > 140000) {
        return Math.min(baseRatio, 1.15);
      }

      return Math.min(baseRatio, 1.25);
    };

    const shouldRender = () => isPageVisible && isInViewport;

    const stopRenderLoop = () => {
      if (!isLoopRunning) {
        return;
      }

      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = 0;
      isLoopRunning = false;
    };

    const startRenderLoop = () => {
      if (disposed || isLoopRunning || !shouldRender()) {
        return;
      }

      isLoopRunning = true;

      const render = () => {
        if (disposed || !shouldRender()) {
          isLoopRunning = false;
          animationFrameId = 0;
          return;
        }

        animationFrameId = window.requestAnimationFrame(render);
        controls.update();
        renderer.render(scene, camera);
      };

      render();
    };

    const resizeRenderer = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (!width || !height) {
        return;
      }

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(getPixelRatio());
      renderer.setSize(width, height, false);
    };

    const loader = new STLLoader();
    loader.load(
      url,
      (geometry) => {
        if (disposed) {
          geometry.dispose();
          return;
        }

        geometry.center();
        geometry.computeVertexNormals();

        mesh = new THREE.Mesh(
          geometry,
          new THREE.MeshStandardMaterial({
            color: 0x06b100,
            metalness: 0,
            roughness: 0.9,
          })
        );
        mesh.rotation.x = -Math.PI / 2;
        scene.add(mesh);

        const bounds = new THREE.Box3().setFromObject(mesh);
        const size = bounds.getSize(new THREE.Vector3());
        const radius = Math.max(size.x, size.y, size.z) || 1;

        controls.target.set(0, 0, 0);
        controls.minDistance = radius * 0.5;
        controls.maxDistance = radius * 8;

        camera.position.set(0, 0, radius * 2.2);
        camera.near = Math.max(radius / 100, 0.1);
        camera.far = radius * 20;
        camera.updateProjectionMatrix();

        resizeRenderer();
        startRenderLoop();
      },
      undefined,
      (error) => {
        console.error('Error loading STL:', error);
      }
    );

    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden;

      if (shouldRender()) {
        resizeRenderer();
        startRenderLoop();
      } else {
        stopRenderLoop();
      }
    };

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        isInViewport = Boolean(entry && entry.isIntersecting && entry.intersectionRatio > 0);

        if (shouldRender()) {
          resizeRenderer();
          startRenderLoop();
        } else {
          stopRenderLoop();
        }
      },
      {
        root: null,
        threshold: 0.05,
      }
    );

    intersectionObserver.observe(canvas);
    window.addEventListener('resize', resizeRenderer);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    resizeRenderer();
    startRenderLoop();

    return () => {
      disposed = true;
      stopRenderLoop();
      window.removeEventListener('resize', resizeRenderer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      intersectionObserver.disconnect();
      controls.dispose();

      if (mesh) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
      }

      renderer.dispose();
    };
  }, [url]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
}

export default STLViewer;
