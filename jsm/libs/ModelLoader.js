import { Group, Box3, Vector3, Mesh, Matrix4, Scene, CircleGeometry, MeshBasicMaterial, DoubleSide, LoadingManager } from 'three';
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { MeshBVH, StaticGeometryGenerator } from "https://unpkg.com/three-mesh-bvh@0.7.6/build/index.module.js";
import { modifyObjects } from 'three/addons/libs/modifyObjects.js';
//import { PlaneGeometry } from 'three';


import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

class ModelLoader {

    constructor(deps, scene, newFloor, layer) {

        this.addToSceneMapRun = false;

        this.deps = deps;
        this.collider = null;

        this.scene = scene;
        this.environment = new Group();
    
        this.toMerge = {};
        this.typeOfmesh = "";

        this.gltfLoader = new GLTFLoader();

        this.exhibits = [];

        this.ktx2Loader = this.deps.ktx2Loader;

        this.newFloor = newFloor;

        this.box = new Box3();

        this.mainScene = deps.visitor.mainScene;

        this.layer = layer;

    }

    async loadModel(modelPath, layer) {

        //this.scene.layers.set(layer);

        const manager = new LoadingManager();

        const dracoLoader = new DRACOLoader(manager);
        dracoLoader.setDecoderPath('./jsm/libs/draco/');

        this.gltfLoader.setDRACOLoader(dracoLoader);
        this.gltfLoader.setMeshoptDecoder(MeshoptDecoder);


        try {
            const { scene: gltfScene } = await this.gltfLoader.loadAsync(modelPath);

            if (this.newFloor) {

                const { scene: exhibitObjects } = await this.gltfLoader.loadAsync(this.newFloor.userData.exhibitObjectsPath);

                gltfScene.add(exhibitObjects);

                const newFloorMatrixWorld = new Matrix4();
                newFloorMatrixWorld.clone(this.newFloor.matrixWorld);

                const newFloor = this.newFloor.clone();

                newFloor.getWorldPosition(gltfScene.position);
                newFloor.getWorldQuaternion(gltfScene.quaternion);

                gltfScene.applyMatrix4(newFloorMatrixWorld);

            }

            gltfScene.scale.setScalar(1);

            this.box.setFromObject(gltfScene);
            const center = new Vector3();
            this.box.getCenter(center);

            const floor = this.mainScene.getObjectByName("FloorOut")?.clone();
            if (floor) gltfScene.add(floor);

            gltfScene.updateMatrixWorld(true);

            gltfScene.traverse((c) => {
                if (c.isMesh || c.isLight) {
                    if (c.isLight) {
                        c.visible = false;
                    }
                    this.typeOfmesh = c.userData.type;
                    this.toMerge[this.typeOfmesh] = this.toMerge[this.typeOfmesh] || [];
                    this.toMerge[this.typeOfmesh].push(c);
                }
            });

            this.environment.layers.set(this.layer);

            for (const typeOfmesh in this.toMerge) {
                const arr = this.toMerge[typeOfmesh];

                arr.forEach((mesh) => {
                    if (mesh.userData.name !== "VisitorEnter") {
                        this.environment.attach(mesh);
                    }
                });
            }

            // Generate the collider using the populated environment
            const staticGenerator = new StaticGeometryGenerator(this.environment);
            staticGenerator.attributes = ["position"];

            const mergedGeometry = staticGenerator.generate();
            mergedGeometry.boundsTree = new MeshBVH(mergedGeometry, {
                lazyGeneration: false,
            });

            this.collider = new Mesh(mergedGeometry);
            this.collider.layers.set(layer);
            this.collider.material.wireframe = true;
            this.collider.material.opacity = 0;
            this.collider.material.transparent = true;

            this.collider.name = "collider";
            this.collider.visible = false;

           // this.scene.layers.set(layer);

            //this.collider.layers.set(layer);
            this.scene.add(this.collider);
            this.deps.collider = this.collider;

           // this.collider.layers.set(layer);
            this.environment.name = "environment";
            this.scene.add(this.environment);

            this.environment.traverse((c) => {
                if (c.isLight || c.isMesh) {

                    const options = {
                        gizmoVisible: this.deps.params.gizmoVisible,
                        ktx2Loader: this.ktx2Loader,
                        environment: this.deps.environment,
                        lightsToTurn: this.deps.lightsToTurn,
                        scene: this.scene,
                        receiveShadow: this.deps.receiveShadow,
                        castShadow: this.deps.castShadow,
                        gui: this.deps.gui,
                        control: this.deps.control,
                        listener: this.deps.listener,
                        audioObjects: this.deps.audioObjects,
                        isLowEndDevice: this.deps.params.isLowEndDevice,
                        gizmoVisible: this.deps.params.gizmoVisible,
                        transControlsMode: this.deps.params.transControlsMode,
                    };

                    modifyObjects[c.userData.type]?.(c, options);
                }

                if (this.scene.name === "mainScene" &&
                    (/Wall|FloorOut|Room/.test(c.userData.name) ||
                        /FloorOut|Room/.test(c.userData.type))) {
                    this.addToSceneMap(c);
                }
            });

            this.addToSceneMapRun = true;



            return this.collider;
        } catch (error) {
            console.error('Error loading model:', error);
            throw error;
        }
    }


    addToSceneMap(mesh) {

        if (!this.addToSceneMapRun) {

            const { sceneMap } = this.deps;

            const cClone = mesh.clone();
            cClone.material = new MeshBasicMaterial({
                color: mesh.userData.type === 'FloorOut' || mesh.userData.type === 'Room' ? 0x1b689f : 0xffffff,
                opacity: mesh.userData.type === 'FloorOut' || mesh.userData.type === 'Room' ? 0.8 : 1,
                transparent: true,
            });

            if (mesh.userData.label) {
                const labelDiv = document.createElement('div');
                labelDiv.className = 'label';
                labelDiv.textContent = mesh.userData.label;
                labelDiv.style.marginTop = '1em';
                labelDiv.style.pointerEvents = 'auto';

                // Add click event to label to move the visitor
                labelDiv.addEventListener('click', () => {

                    const targetPosition = mesh.position.clone();

                    this.deps.visitorEnter.copy(targetPosition);

                    this.deps.resetVisitor();
                });

                const labelObject = new CSS2DObject(labelDiv);
                labelObject.position.set(0, 0, 0);
                cClone.add(labelObject);
            }

            sceneMap.add(cClone);

        }
    }
}

export default ModelLoader;
