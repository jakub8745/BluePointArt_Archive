import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { PositionalAudioHelper } from 'three/addons/helpers/PositionalAudioHelper.js';

import * as THREE from 'three';
const loader = new THREE.TextureLoader();
let i



export const modifyObjects = {
    SpotLight: (mesh, deps) => {
        mesh.matrixWorldAutoUpdate = true;
        // mesh.userData.intensity = 10//mesh.intensity;

        const targetObject = new THREE.Object3D();
        mesh.target = targetObject;
        const target = deps.environment.getObjectByName(mesh.userData.whichTarget);
        if (target) {
            target.getWorldPosition(mesh.target.position);
            mesh.castShadow = true;
            mesh.shadow.mapSize.set(1024, 1024);
            mesh.shadow.camera.near = 0.5;
            mesh.shadow.camera.far = 500;
            mesh.shadow.bias = -0.005;
            //mesh.shadow.blurSamples = 15;
            //mesh.shadow.radius = 1;
            deps.environment.attach(targetObject);

            if (mesh.userData.name === "lightsArTour") {

                let gui = deps.gui

                gui.add(mesh, "visible").name("visible" + mesh.name);
                gui.add(mesh, "intensity", 0, 50, 0.01).name("intensity" + mesh.name);
                gui.add(mesh, "distance", 0, 500, 0.1).name("distance" + mesh.name);
                gui.add(mesh, "decay", 0, 10, 0.01).name("decay" + mesh.name);
                gui.add(mesh.position, "y", -10, 50, 0.01).name("y" + mesh.name);
            }
        }
        deps.lightsToTurn.push(mesh);
    },
    PointLight: (mesh, deps) => {

        mesh.visible = true;
        mesh.userData.intensity = mesh.intensity;
        mesh.castShadow = true;
        mesh.shadow.mapSize.set(1024, 1024);
        mesh.shadow.camera.near = 0.5;
        mesh.shadow.camera.far = 500;
        mesh.shadow.bias = -0.005;
        //mesh.shadow.blurSamples = 15;
        //mesh.shadow.radius = 1;

        if (mesh.userData.name === "lightsArTour") {
            let gui = deps.gui


            gui.add(mesh, "visible").name("visible" + mesh.name);
            gui.add(mesh, "intensity", 0, 50, 0.01).name("intensity" + mesh.name);
            gui.add(mesh, "distance", 0, 500, 0.1).name("distance" + mesh.name);
            gui.add(mesh, "decay", 0, 10, 0.01).name("decay" + mesh.name);
            gui.add(mesh.position, "y", -10, 50, 0.01).name("y" + mesh.name);
        }
        deps.lightsToTurn.push(mesh);
    },
    AmbientLight: () => {
        console.log("ambientLight");
    },
    SpotLightTarget: (mesh, deps) => {
        mesh.visible = false;
        //
        //
    },
    ShaderBox: (mesh) => {
        //
        //
    },
    VisitorEnter: (mesh, deps) => {
        //mesh.getWorldPosition(visitorEnter);
        mesh.visible = false;
        mesh.removeFromParent();
        //
        //
    },
    Text: (mesh, deps) => {
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
            const material = new THREE.MeshLambertMaterial({
                color: mesh.material.color,
            });
            const object = new THREE.Mesh(geometry, material);
            object.castShadow = true;
            object.visible = true;
            object.position.copy(mesh.position);
            object.rotation.copy(mesh.rotation);
            deps.scene.add(object);
            mesh.removeFromParent();
        });
        //
        //
    },
    visitorLocation: (mesh, deps) => {

        const { Map, wS, wT } = mesh.userData;
        const material = new THREE.MeshLambertMaterial({ map: loader.load(Map), transparent: true });
        material.map.wrapS = THREE.RepeatWrapping;
        material.map.wrapT = THREE.RepeatWrapping;
        material.map.anisotropy = deps.anisotropy;
        material.map.repeat.set(wS, wT);
        material.minFilter = THREE.LinearMipMapLinearFilter;
        material.magFilter = THREE.LinearFilter;


        material.map.rotate = Math.PI / 2;

        if (mesh.userData.name === "FloorArTour") {
            console.log("FloorArTour");
            material.opacity = 1;
        }

        mesh.material = material;
        mesh.receiveShadow = true;
        mesh.castShadow = false;
        mesh.material.needsUpdate = true;
        //
    },
    element: (mesh, receiveShadow, castShadow) => {
        const { userData, material } = mesh;
        const { Map, normalhMap, RoughMap, name } = userData;
        if (Map) material.map = loader.load(Map);
        if (normalhMap) material.normalMap = loader.load(normalhMap);
        if (RoughMap) material.roughnessMap = loader.load(RoughMap);
        if (name === "Wall") { receiveShadow = true; castShadow = true; }
        mesh.receiveShadow = receiveShadow;
        mesh.castShadow = castShadow;
        Object.assign(material, {
            mapping: THREE.UVMapping,
            colorSpace: THREE.SRGBColorSpace,
            minFilter: THREE.NearestFilter,//THREE.LinearMipmapNearestFilter,
            magFilter: THREE.NearestFilter,//THREE.LinearFilter,
            needsUpdate: true,
            depthWrite: true,

        });
        if (mesh.name === "Wall_ArTour") {
            if (mesh.material && mesh.material.map) {
                // Set texture wrapping to repeat (this might already be set, but it's safe to ensure it)
                mesh.material.map.wrapS = THREE.RepeatWrapping;
                mesh.material.map.wrapT = THREE.RepeatWrapping; // Also set for vertical if necessary

                // Flip the texture horizontally
                mesh.material.map.repeat.x = -1;

                // Update the texture settings to apply changes
                mesh.material.map.needsUpdate = true;
            }
        } else if (mesh.name === "photoScreen") {
            mesh.geometry.thetaStart = Math.PI / 2
            mesh.geometry.thetaLength = Math.PI
        }
        //
    },
    Image: (mesh, deps) => {
        mesh.material = new THREE.MeshLambertMaterial({ transparent: true });
        modifyObjects.element(mesh, false, false);
    },
    Sculpture: (mesh, deps) => {
        if (mesh.userData.name === "dzbanDystopia") {
            deps.control._gizmo.visible = deps.params.gizmoVisible;
            deps.control.setMode(deps.params.transControlsMode);
            deps.control.attach(mesh);
            deps.scene.add(deps.control);

        }

        modifyObjects.element(mesh, deps, true, true);
    },
    Video: (mesh, deps) => {
        const video = document.getElementById(mesh.userData.elementID);

        let texture = new THREE.VideoTexture(video);
        texture.colorSpace = THREE.SRGBColorSpace;
        mesh.material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            color: 0xffffff,
        });
        mesh.receiveShadow = false;
        mesh.castShadow = false;
        mesh.material.needsUpdate = true;

        //
        //
    },
    Audio: (mesh, deps) => {
        mesh.scale.setScalar(0.1)

        const sound = new THREE.PositionalAudio(deps.listener);
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load(mesh.userData.audio, (buffer) => {
            sound.name = mesh.userData.name;
            sound.setBuffer(buffer);
            sound.setLoop(true);
            sound.setRefDistance(mesh.userData.audioRefDistance);
            sound.setRolloffFactor(mesh.userData.audioRolloffFactor);
            //sound.setMaxDistance(mesh.userData.audioMaxDistance);
            sound.setVolume(mesh.userData.audioVolume);
            sound.setDirectionalCone(10, 23, 0.1)
            //if(mesh.userData.audioDirectionalCone) sound.setDirectionalCone(mesh.userData.audioDirectionalCone)

            let gui = deps.gui
            gui.add(sound.panner, "coneInnerAngle", 0, 500, 0.01).name("Inner")// + mesh.name);refDistance
            gui.add(sound.panner, "coneOuterAngle", 0, 500, 0.01).name("Outer")
            gui.add(sound.panner, "coneOuterGain", 0, 1, 0.01).name("Outer")
            gui.add(sound.panner, "refDistance", 0, 10, 0.01).name("refDistance")
            gui.add(sound.panner, "rolloffFactor", 0, 100, 0.01).name("rolloffFactor")

            gui.add(mesh.rotation, "y", 0, 10, 0.01).name("Rotate")
            // */
            const helper = new PositionalAudioHelper(sound, 20);
            sound.add(helper);
            mesh.add(sound);
            deps.audioObjects.push(mesh);


            console.log("audioObjects", sound.panner.coneInnerAngle);
        });
    },
};


