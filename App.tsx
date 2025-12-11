import React, { useState, useEffect, useRef, useCallback } from 'react';
import Experience from './components/Experience';
import UI from './components/UI';
import { AppState } from './types';
import * as THREE from 'three';
import { CONFIG } from './constants';

const App: React.FC = () => {
    // State
    const [isLoaded, setIsLoaded] = useState(false);
    const [targetProgress, setTargetProgress] = useState(0);
    const [statusText, setStatusText] = useState("State: FORMED");
    const [handActive, setHandActive] = useState(false);
    const [photos, setPhotos] = useState<THREE.Texture[]>([]);
    
    // Physics State (using Ref for performance in update loop, but syncing specific parts to React state for UI)
    const physicsState = useRef<AppState['actualProgress']>({
        foliage: 0,
        ornaments: 0,
        gifts: 0,
        photos: 0
    });
    
    // Camera Ref for MediaPipe
    const videoRef = useRef<HTMLVideoElement>(null);
    const rotationOffsetRef = useRef(0);

    // --- Helper: Polaroid Texture Generation ---
    const createPolaroidTexture = useCallback((image: HTMLImageElement) => {
        const cvs = document.createElement('canvas');
        const ctx = cvs.getContext('2d');
        if (!ctx) return null;
        
        cvs.width = 512; cvs.height = 640;
        
        // White Border
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, 512, 640);
        
        // Image Containment
        const aspect = image.width / image.height;
        let dw = 460, dh = 460;
        if (aspect > 1) dh = dw / aspect;
        else dw = dh * aspect;
        
        ctx.drawImage(image, (512-dw)/2, 40, dw, dh);
        
        // Text
        ctx.font = "40px 'Cinzel'";
        ctx.fillStyle = "#333";
        ctx.textAlign = "center";
        ctx.fillText("Memories", 256, 600);

        const tex = new THREE.CanvasTexture(cvs);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.uuid = THREE.MathUtils.generateUUID(); // Unique key for React list
        return tex;
    }, []);

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            Array.from(e.target.files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const img = new Image();
                    img.onload = () => {
                        const tex = createPolaroidTexture(img);
                        if (tex) setPhotos(prev => [...prev, tex]);
                    };
                    img.src = ev.target?.result as string;
                };
                reader.readAsDataURL(file);
            });
        }
    };

    // --- Physics Loop for Smooth Interpolation ---
    useEffect(() => {
        let animationFrameId: number;
        
        const updatePhysics = () => {
            // Weighted Interpolation
            const s = physicsState.current;
            s.foliage += (targetProgress - s.foliage) * 0.1;
            s.ornaments += (targetProgress - s.ornaments) * 0.05;
            s.gifts += (targetProgress - s.gifts) * 0.02;
            s.photos += (targetProgress - s.photos) * 0.06;
            
            animationFrameId = requestAnimationFrame(updatePhysics);
        };
        
        updatePhysics();
        return () => cancelAnimationFrame(animationFrameId);
    }, [targetProgress]);

    // --- UI Text Update ---
    useEffect(() => {
        if (targetProgress < 0.1) setStatusText("State: FORMED (Tree)");
        else if (targetProgress > 0.9) setStatusText("State: CHAOS (Unleashed)");
        else setStatusText("State: TRANSITIONING...");
    }, [targetProgress]);

    // --- MediaPipe Setup ---
    useEffect(() => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.warn("Camera access not supported or not HTTPS");
            return;
        }

        const videoElement = videoRef.current;
        if (!videoElement) return;

        let camera: any;
        let hands: any;

        const onResults = (results: any) => {
            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                setHandActive(true);
                const landmarks = results.multiHandLandmarks[0];
                
                // Open Palm vs Fist Logic
                const wrist = landmarks[0];
                let totalDist = 0;
                [8, 12, 16, 20].forEach(idx => {
                    const p = landmarks[idx];
                    totalDist += Math.sqrt(Math.pow(p.x - wrist.x, 2) + Math.pow(p.y - wrist.y, 2));
                });
                const avgDist = totalDist / 4;

                if (avgDist > 0.35) setTargetProgress(1); // Open
                else if (avgDist < 0.2) setTargetProgress(0); // Fist

                // Rotation Control (Hand X)
                const handX = landmarks[9].x; 
                rotationOffsetRef.current = (handX - 0.5) * 2;
            } else {
                setHandActive(false);
            }
        };

        const initMediaPipe = async () => {
            if (window.Hands && window.Camera) {
                hands = new window.Hands({locateFile: (file: string) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                }});
                
                hands.setOptions({
                    maxNumHands: 1,
                    modelComplexity: 1,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });

                hands.onResults(onResults);

                camera = new window.Camera(videoElement, {
                    onFrame: async () => { await hands.send({image: videoElement}); },
                    width: 640, height: 480
                });
                
                await camera.start();
            }
        };

        initMediaPipe();

        return () => {
            // Cleanup logic if available in library
            // Typically MediaPipe keeps running on the video element, hard to fully stop without reload
        };
    }, []);

    // Prepare state object for Experience
    const appState: AppState = {
        targetProgress,
        actualProgress: physicsState.current, // Note: This ref object is mutated, so Three fiber frame loop will read updated values
        handActive,
        rotationOffset: rotationOffsetRef.current,
        photos
    };

    return (
        <div className="w-full h-screen bg-black font-sans text-white overflow-hidden select-none">
            {/* Hidden Video for Analysis */}
            <video ref={videoRef} className="absolute top-0 left-0 opacity-0 pointer-events-none w-px h-px" playsInline />

            <UI 
                targetProgress={targetProgress} 
                setTargetProgress={setTargetProgress} 
                handlePhotoUpload={handlePhotoUpload}
                isLoaded={isLoaded}
                handActive={handActive}
                status={statusText}
            />

            <Experience 
                appState={appState} 
                setLoaded={setIsLoaded}
            />
        </div>
    );
};

export default App;
