import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { PositionalAudioHelper } from 'three/addons/helpers/PositionalAudioHelper.js';
import FadeInMaterial from 'three/addons/libs/FadeInMaterial.js';
import { TextureLoader, Object3D, MeshLambertMaterial, MeshBasicMaterial, Mesh, Color, PositionalAudio, AudioLoader, VideoTexture, RepeatWrapping, DoubleSide, SRGBColorSpace } from 'three';


//import * as THREE from 'three';
const loader = new TextureLoader();

export const modifyObjects = {
    SpotLight: (mesh, deps) => {

        mesh.matrixWorldAutoUpdate = true;
        mesh.userData.intensity = mesh.intensity;

        const targetObject = new Object3D();
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
    },
    ShaderBox: (mesh) => {
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
            const material = new MeshLambertMaterial({
                color: mesh.material.color,
            });
            const object = new Mesh(geometry, material);
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

        mesh.material = new MeshLambertMaterial({ transparent: false });

        deps.receiveShadow = true
        deps.castShadow = false

        modifyObjects.element(mesh, deps);

    },
    element: (mesh, deps) => {

        const { userData, material } = mesh;
        const { Map, normalhMap, RoughMap, name, wS, wT } = userData;

        if (Map) material.map = loader.load(Map);
        if (normalhMap) material.normalMap = loader.load(normalhMap);
        if (RoughMap) material.roughnessMap = loader.load(RoughMap);
        if (wS) {
            material.map.wrapS = RepeatWrapping;
            material.map.wrapT = RepeatWrapping;
            material.map.repeat.set(wS, wT);
            material.map.rotate = Math.PI / 2;

        }

        if (name === "Wall") { deps.receiveShadow = true; deps.castShadow = true; }
        mesh.receiveShadow = deps.receiveShadow
        mesh.castShadow = deps.castShadow

/*
        if (

            /Wall/.test(mesh.userData.name) ||
            /visitorLocation/.test(mesh.userData.type)

        ) {

            const cClone = mesh.clone();
            cClone.material = new MeshBasicMaterial();

            if (cClone.userData.type === "visitorLocation") {

                cClone.material.color.set(0x1b689f);

            } else {

                cClone.material.color = new Color(0xffffff);

            }

            cClone.material.needsUpdate = true;
            cClone.position.copy(mesh.position);
            cClone.scale.copy(mesh.scale);

            if (deps.sceneMap) deps.sceneMap.add(cClone);

        }
        */
        //
    },
    photoScreen: (mesh, deps) => {

        mesh.material = new FadeInMaterial({ map: loader.load(mesh.userData.Map), transparent: true, side: DoubleSide });
        mesh.material.map.wrapT = RepeatWrapping;
        mesh.material.map.wrapS = RepeatWrapping; // Ensure wrapping is enabled
        mesh.material.map.repeat.x = -1;

        deps.receiveShadow = false
        deps.castShadow = true

        modifyObjects.element(mesh, deps);

    },
    Image: (mesh, deps) => {

        mesh.material = new FadeInMaterial({ transparent: true, side: DoubleSide, color: 0xffffff });
        mesh.material.needsUpdate = true;

        deps.receiveShadow = false
        deps.castShadow = false

        modifyObjects.element(mesh, deps);
    },
    Sculpture: (mesh, deps) => {

        if (mesh.userData.name === "dzbanDystopia") {

            deps.control._gizmo.visible = deps.params.gizmoVisible;
            deps.control.setMode(deps.params.transControlsMode);
            deps.control.attach(mesh);
            deps.scene.add(deps.control);

        }

        deps.receiveShadow = true
        deps.castShadow = true

        modifyObjects.element(mesh, deps);
    },
    Video: (mesh, deps) => {
        const video = document.getElementById(mesh.userData.elementID);

        let texture = new VideoTexture(video);
        texture.colorSpace = SRGBColorSpace;
        mesh.material = new MeshBasicMaterial({
            map: texture,
            side: DoubleSide,
            color: 0xffffff,
        });
        mesh.receiveShadow = false;
        mesh.castShadow = false;
        mesh.material.needsUpdate = true;


       //console.log("mesh.userData.belongsTo", mesh.userData.belongsTo, mesh);

        //
    },
    Audio: (mesh, deps) => {
        mesh.scale.setScalar(0.1)

        const sound = new PositionalAudio(deps.listener);
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

