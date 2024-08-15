import { Vector2 } from "three";

const MaskShader = {
    uniforms: {
        "center": { value: new Vector2(0.5, 0.5) },
        "radius": { value: 0.3 }
    },
    vertexShader: `
        varying highp vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform vec2 center;
        uniform float radius;
        varying highp vec2 vUv;

        void main() {
            float dist = distance(vUv, center);
            float mask = smoothstep(radius, radius + 0.02, dist);
            gl_FragColor = vec4(vec3(1.0 - mask), 1.0);
        }
    `
};

export { MaskShader };