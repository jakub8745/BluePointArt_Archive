import { Font, FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { PositionalAudioHelper } from 'three/addons/helpers/PositionalAudioHelper.js';
import FadeInMaterial from 'three/addons/libs/FadeInMaterial.js';

import {  TextureLoader, Object3D,  MeshLambertMaterial, MeshBasicMaterial, Mesh, PositionalAudio, AudioLoader, VideoTexture, RepeatWrapping, DoubleSide, FrontSide, SRGBColorSpace } from 'three';

//import { UniformsUtils, TextureLoader, Object3D, ShaderMaterial, MeshLambertMaterial, MeshBasicMaterial, Mesh, Color, PositionalAudio, AudioLoader, VideoTexture, RepeatWrapping, DoubleSide, FrontSide, SRGBColorSpace } from 'three';

//import { BrightnessContrastShader } from 'three/addons/shaders/BrightnessContrastShader.js'


const loader = new TextureLoader();


export const modifyObjects = {

    SpotLight: (SpotLight, options) => {

        SpotLight.matrixWorldAutoUpdate = true;
        SpotLight.userData.intensity = SpotLight.intensity;

        const targetObject = new Object3D();
        SpotLight.target = targetObject;
        const target = options.environment.getObjectByName(SpotLight.userData.whichTarget);

        if (target) {

            target.getWorldPosition(SpotLight.target.position);

            SpotLight.options.castShadow = true;
            SpotLight.shadow.mapSize.set(2048, 2048);
            SpotLight.shadow.camera.near = 0.5;
            SpotLight.shadow.camera.far = 500;
            SpotLight.shadow.bias = -0.005;
            //mesh.shadow.blurSamples = 15;
            //mesh.shadow.radius = 1;
            options.environment.attach(targetObject);

        }

        options.lightsToTurn.push(SpotLight);
    },
    PointLight: (PointLight, options) => {

        PointLight.visible = true;

        PointLight.userData.intensity = PointLight.intensity;
        PointLight.options.castShadow = true;
        PointLight.shadow.mapSize.set(1024, 1024);

        PointLight.shadow.camera.near = 0.5;
        PointLight.shadow.camera.far = 500;
        PointLight.shadow.bias = -0.005;
        //mesh.shadow.blurSamples = 15;
        //mesh.shadow.radius = 1;

        options.lightsToTurn.push(PointLight);
    },
    AmbientLight: () => {
        console.log("ambientLight");
    },
    SpotLightTarget: (mesh) => {
        mesh.visible = false;

        //
    },
    Room: (mesh) => {
        //

    },
    VisitorEnter: (mesh) => {

        mesh.visible = false;
        mesh.removeFromParent();
        //

    },
    Text: (mesh, options) => {
        new FontLoader().load("txt/Lato_Regular.json", function (font) {
            const geometry = new TextGeometry(mesh.userData.name, {
                font: font,
                size: mesh.scale.y * 0.7, //mesh.userData.size,
                height: mesh.userData.size / 4,
                curveSegments: 6,
                bevelEnabled: false,
                bevelThickness: 1,
                bevelSize: 0.5,
                bevelOffset: 0,
                bevelSegments: 5,
            });
            const material = new MeshLambertMaterial({
                color: mesh.material.color,
            });
            const object = new Mesh(geometry, material);
            object.castShadow = true;
            object.visible = true;
            object.position.copy(mesh.position);
            object.rotation.copy(mesh.rotation);
            object.name = mesh.name;
            options.exhibitScene.add(object);
            mesh.removeFromParent();
        });
        //
        //
    },
    visitorLocation: (mesh) => {

        const { userData, material } = mesh;
        const { Map, normalMap, RoughMap, name, wS, wT } = userData;

        loader.load(Map, (texture) => {
            /*
                        mesh.material = new ShaderMaterial({
                            uniforms: UniformsUtils.clone(BrightnessContrastShader.uniforms),
                            vertexShader: BrightnessContrastShader.vertexShader,
                            fragmentShader: BrightnessContrastShader.fragmentShader
                        });
            
                        mesh.material.uniforms.tDiffuse.value = texture;
                        //mesh.material.uniforms.exposure.value = 1.5;
            
                        */

            mesh.material = new MeshLambertMaterial({ map: texture });

            mesh.material.needsUpdate = true;
        });

    },
    element: (mesh, options) => {

        //const gui = deps.gui

        const { userData, material } = mesh;
        const { Map, normalMap, RoughMap, name, wS, wT } = userData;



        if (Map) {
            const extension = Map.split('.').pop();

            if (extension === 'ktx2') {


                options.ktx2Loader.load(Map, (texture) => {

                    mesh.material = new MeshLambertMaterial({ map: texture });

                });

            } else {

                loader.load(Map, (texture) => {
                    mesh.material.map = texture;
                });

            }
        }

        if (normalMap) {
            const extension = normalMap.split('.').pop();

            if (extension === 'ktx2') {

                options.ktx2Loader.load(normalMap, (texture) => {

                    texture.center.set(0.5, 0.5);
                    texture.repeat.y = -1;


                    mesh.material = new MeshLambertMaterial({ normalMap: texture, side: FrontSide });

                });

            } else {

                const textureLoader = new TextureLoader();
                material.normalMap = textureLoader.load(normalMap);
            }
        }

        // if (RoughMap) material.roughnessMap = loader.load(RoughMap);
        if (wS) {
            material.map.wrapS = RepeatWrapping;
            material.map.wrapT = RepeatWrapping;
            material.map.repeat.set(wS, wT);
            material.map.rotate = Math.PI / 2;


        }
        else if (wS && normalMap) {
            material.normalMap.wrapS = RepeatWrapping;
            material.normalMap.wrapT = RepeatWrapping;
            material.normalMap.repeat.set(wS, wT);
            material.normalMap.rotate = Math.PI / 2;
        }

        if (name === "Wall") { options.receiveShadow = true; options.castShadow = true; }

        mesh.material.needsUpdate = true;

    },
    photoScreen: (mesh, options) => {

        mesh.material = options.isLowEndDevice ? new MeshBasicMaterial({ map: loader.load(mesh.userData.Map), transparent: false, side: DoubleSide, color: 0xffffff }) : new FadeInMaterial({ map: loader.load(mesh.userData.Map), transparent: true, side: DoubleSide, color: 0xffffff });
        //mesh.material = new FadeInMaterial({ map: loader.load(mesh.userData.Map), transparent: true, side: DoubleSide, color: 0xffffff });
        mesh.material.map.wrapT = RepeatWrapping;
        mesh.material.map.wrapS = RepeatWrapping; // Ensure wrapping is enabled
        mesh.material.map.repeat.x = -1;

        options.receiveShadow = false
        options.castShadow = true

        modifyObjects.element(mesh, options);

    },
    Image: (mesh, options) => {

        mesh.material = options.isLowEndDevice ? new MeshBasicMaterial({ map: loader.load(mesh.userData.Map), transparent: false, side: DoubleSide, color: 0xffffff }) : new FadeInMaterial({ map: loader.load(mesh.userData.Map), transparent: true, side: DoubleSide, color: 0xffffff });
        //mesh.material.color.convertSRGBToLinear();
        mesh.material.needsUpdate = true;

        //deps.options.receiveShadow = false
        //deps.options.castShadow = false

        modifyObjects.element(mesh, options);
    },
    Sculpture: (mesh, options) => {

        if (mesh.userData.name === "dzbanDystopia") {

            options.control._gizmo.visible = options.gizmoVisible;
            // options.control.setMode(transControlsMode);
            options.control.attach(mesh);
            options.exhibitScene.add(options.control);

        }

        options.receiveShadow = true
        options.castShadow = true

        modifyObjects.element(mesh, options);
    },
    Video: (mesh) => {
        //const gui = deps.gui;

        const video = document.getElementById(mesh.userData.elementID);

        const texture = new VideoTexture(video);
        texture.colorSpace = SRGBColorSpace;

        // Create the material
        const material = new MeshBasicMaterial({
            map: texture,
            side: DoubleSide,
            color: 0xffffff,
        });
        /*
                // Modify the shader to include brightness and contrast options.controls
                material.onBeforeCompile = (shader) => {
                    // Inject uniforms for brightness and contrast
                    shader.uniforms.uBrightness = { value: 1.0 };
                    shader.uniforms.uContrast = { value: 1.0 };
        
                    // Inject the brightness and contrast functions and update the fragment shader
                    shader.fragmentShader = `
                        uniform float uBrightness;
                        uniform float uContrast;
            
                        vec3 applyContrast(vec3 color, float contrast) {
                            return (color - 0.5) * contrast + 0.5;
                        }
            
                        vec3 applyBrightness(vec3 color, float brightness) {
                            return color * brightness;
                        }
                    ` + shader.fragmentShader;
        
                    // Replace the gl_FragColor assignment to apply brightness and contrast
                    shader.fragmentShader = shader.fragmentShader.replace(
                        `#include <color_fragment>`,
                        `
                        // Apply brightness
                        diffuseColor.rgb = applyBrightness(diffuseColor.rgb, uBrightness);
            
                        // Apply contrast
                        diffuseColor.rgb = applyContrast(diffuseColor.rgb, uContrast);
                        `
                    );
        
                    // Save the shader reference for later use if needed
                    material.userData.shader = shader;
        
                    // Now that the shader is available, add the GUI options.controls
                    // gui.add(shader.uniforms.uBrightness, 'value', 0.0, 3.0).name('Brightness');
                    // gui.add(shader.uniforms.uContrast, 'value', 0.0, 3.0).name('Contrast');
                    //gui.show(false);
                };
                */

        // Apply the material to the mesh
        mesh.material = material;
        mesh.receiveShadow = false;
        mesh.castShadow = false;
        mesh.material.needsUpdate = true;
    },

    Audio: (mesh, { listener, audioObjects }) => {
        mesh.scale.setScalar(0.1)

        const sound = new PositionalAudio(listener);
        const audioLoader = new AudioLoader();
        audioLoader.load(mesh.userData.audio, (buffer) => {
            sound.name = mesh.userData.name;
            sound.setBuffer(buffer);
            sound.setLoop(true);
            sound.setRefDistance(mesh.userData.audioRefDistance);
            sound.setRolloffFactor(mesh.userData.audioRolloffFactor);
            //sound.setMaxDistance(mesh.userData.audioMaxDistance);
            sound.setVolume(mesh.userData.audioVolume);
            sound.setDirectionalCone(10, 23, 0.1)

            /*
            let gui = deps.gui
            gui.add(sound.panner, "coneInnerAngle", 0, 500, 0.01).name("Inner")// + mesh.name);refDistance
            gui.add(sound.panner, "coneOuterAngle", 0, 500, 0.01).name("Outer")
            gui.add(sound.panner, "coneOuterGain", 0, 1, 0.01).name("Outer")
            gui.add(sound.panner, "refDistance", 0, 10, 0.01).name("refDistance")
            gui.add(sound.panner, "rolloffFactor", 0, 100, 0.01).name("rolloffFactor")
 
            gui.add(mesh.rotation, "y", 0, 10, 0.01).name("Rotate")
 
         */
            const helper = new PositionalAudioHelper(sound, 20);
            sound.add(helper);
            mesh.add(sound);
            audioObjects.push(mesh);

        });
    },
};

