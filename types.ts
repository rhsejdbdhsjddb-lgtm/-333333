import * as THREE from 'three';

export interface AppState {
    targetProgress: number; // 0 to 1
    actualProgress: {
        foliage: number;
        ornaments: number;
        gifts: number;
        photos: number;
    };
    handActive: boolean;
    rotationOffset: number;
    photos: THREE.Texture[];
}

export interface TreeConfig {
    colors: {
        emeraldStart: THREE.Color;
        emeraldEnd: THREE.Color;
        gold: THREE.Color;
        red: THREE.Color;
        silver: THREE.Color;
    };
    particleCount: number;
    treeHeight: number;
    treeRadius: number;
    chaosRadius: number;
}

// MediaPipe Globals loaded via script tags
declare global {
    interface Window {
        Hands: any;
        Camera: any;
        drawConnectors: any;
        drawLandmarks: any;
    }

    // Fix for React Three Fiber intrinsic elements not being recognized
    namespace JSX {
        interface IntrinsicElements {
            points: any;
            bufferGeometry: any;
            bufferAttribute: any;
            shaderMaterial: any;
            instancedMesh: any;
            boxGeometry: any;
            sphereGeometry: any;
            meshStandardMaterial: any;
            mesh: any;
            planeGeometry: any;
            group: any;
            ambientLight: any;
            spotLight: any;
            directionalLight: any;
            // Catch-all for other R3F elements to prevent TS errors
            [elemName: string]: any;
        }
    }
}