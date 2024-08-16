/**
 * Luminosity
 * http://en.wikipedia.org/wiki/Luminosity
 * 
 * added:  New uniform for exposure control
 */

const LuminosityShader = {

	name: 'LuminosityShader',

	uniforms: {

		'tDiffuse': { value: null },
		'exposure': { value: 1.0 }  //

	},

	vertexShader: /* glsl */`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,

	fragmentShader: /* glsl */`

		#include <common>

		uniform sampler2D tDiffuse;
		uniform float exposure;  // New uniform for exposure control
		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float l = luminance( texel.rgb ) * exposure;  // Apply exposure to the luminance

			gl_FragColor = vec4( l, l, l, texel.w );

		}`

};

export { LuminosityShader };
