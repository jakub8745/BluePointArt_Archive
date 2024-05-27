//import * as THREE from 'three';

//import { MeshLambertMaterial } from 'three';
import { MeshBasicMaterial } from 'three';


//export default class FadeInMaterial extends MeshLambertMaterial {
  export default class FadeInMaterial extends MeshBasicMaterial {

  constructor(options) {

    super(options);
    this.name = options.name || 'FadeInMaterial';
    this.fadeDuration = options.fadeDuration || 2000; // Duration of the fade-in animation in milliseconds
    this.fadeInterval = options.fadeInterval || 40; // Interval between opacity updates
    this.opacity = 0;
    this.isFadingIn = false;

    this.onLoad();

  }

  onLoad() {

    this.fadeIn();

  }

  fadeIn() {
    if (this.isFadingIn) return;
    this.isFadingIn = true;

    const totalSteps = this.fadeDuration / this.fadeInterval;
    let currentStep = 0;

    const fadeIn = () => {

      if (currentStep >= totalSteps) {
        this.opacity = 1;
        this.isFadingIn = false;

        return;
      }

      const opacity = currentStep / totalSteps;
      this.opacity = opacity;

      currentStep++;
      requestAnimationFrame(fadeIn);
    };

    fadeIn();
  }
}