const TransitionShader = {
  uniforms: {
    'tDiffuse1': { value: null },  // First scene texture
    'tDiffuse2': { value: null },  // Second scene texture
    'mixRatio': { value: 0.0 },    // Transition ratio (0 = first scene, 1 = second scene)
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse1;
    uniform sampler2D tDiffuse2;
    uniform float mixRatio;
    varying vec2 vUv;

    void main() {
      vec4 texel1 = texture2D(tDiffuse1, vUv);
      vec4 texel2 = texture2D(tDiffuse2, vUv);
      gl_FragColor = mix(texel1, texel2, mixRatio);  // Blend between the two textures
    }
  `
};

export  {TransitionShader};  