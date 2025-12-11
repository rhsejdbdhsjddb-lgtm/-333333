import * as THREE from 'three';
import { TreeConfig } from './types';

export const CONFIG: TreeConfig = {
    colors: {
        emeraldStart: new THREE.Color('#002211'),
        emeraldEnd: new THREE.Color('#004422'),
        gold: new THREE.Color('#FFD700'),
        red: new THREE.Color('#D40000'),
        silver: new THREE.Color('#E0E0E0')
    },
    particleCount: 25000,
    treeHeight: 60,
    treeRadius: 25,
    chaosRadius: 80
};

export const UI_COLORS = {
    gold: '#FFD700',
    glassBg: 'rgba(20, 20, 20, 0.6)',
    glassBorder: 'rgba(255, 215, 0, 0.3)',
};
