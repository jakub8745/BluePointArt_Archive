import { Group, Box3, Mesh, MeshBasicMaterial, LoadingManager } from 'three';
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { MeshBVH, StaticGeometryGenerator } from "three-mesh-bvh";
import { modifyObjects } from './modifyObjects.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

class ModelLoader {

    constructor(deps, scene, newFloor) {

        this.addToSceneMapRun = false;
        this.deps = deps;
        this.collider = null;
        this.scene = scene;
        this.renderer = deps.renderer;
        this.environment = new Group();
        this.toMerge = {};
        this.typeOfmesh = "";

        this.manager = new LoadingManager();

        this.gltfLoader = new GLTFLoader();
        this.dracoLoader = new DRACOLoader(this.manager).setDecoderPath('/src/libs/draco/');

        this.meshoptDecoder = MeshoptDecoder;

        this.exhibits = [];

        //this.ktx2Loader = deps.ktx2Loader;
        this.ktx2Loader = deps.ktx2Loader.setTranscoderPath('/src/libs/basis/');
        //this.ktx2Loader.detectSupport(this.renderer);



        this.newFloor = newFloor;
        this.box = new Box3();
        this.mainScene = deps.visitor.mainScene; //

    }

    async loadModel(modelPath) {


        this.gltfLoader.setDRACOLoader(this.dracoLoader);

        const textureLoader = this.ktx2Loader;

        // Ensure detectSupport is called before loading textures
        textureLoader.detectSupport(this.renderer);
        
        textureLoader.load(
            '/textures/bg_color.ktx2',
            (texture) => {
                console.log('Texture loaded successfully:', texture);
            },
            undefined,
            (err) => {
                console.error('Failed to load texture:', err);
            }
        );
        
        

        this.gltfLoader.setKTX2Loader(this.ktx2Loader);

        this.gltfLoader.setMeshoptDecoder(this.meshoptDecoder);


        try {

            console.log("Attempting to load model:", modelPath);
            const { scene: gltfScene } = await this.gltfLoader.loadAsync(modelPath);
            console.log("Model loaded successfully:", gltfScene);

            if (this.newFloor) {

                gltfScene.traverse((c) => {
                    if (c.isMesh && c.name === "FloorOut") {
                        c.position.y -= .1;
                    }
                });

                if (this.newFloor.userData.exhibitObjectsPath) {

                    const { scene: exhibitObjects } = await this.gltfLoader.loadAsync(this.newFloor.userData.exhibitObjectsPath);

                    gltfScene.add(exhibitObjects);

                }
            }

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

            for (const typeOfmesh in this.toMerge) {
                const arr = this.toMerge[typeOfmesh];

                arr.forEach((mesh) => {
                    if (mesh.userData.name !== "VisitorEnter") {
                        this.environment.attach(mesh);
                    }
                });
            }

            this.environment.name = "environment";

            // Generate the collider using the populated environment
            const staticGenerator = new StaticGeometryGenerator(this.environment);
            staticGenerator.attributes = ["position"];

            const mergedGeometry = staticGenerator.generate();
            mergedGeometry.boundsTree = new MeshBVH(mergedGeometry, {
                lazyGeneration: false,
            });

            this.collider = new Mesh(mergedGeometry);
            this.collider.material.wireframe = true;
            this.collider.material.opacity = 0;
            this.collider.material.transparent = true;

            this.collider.name = "collider";
            this.collider.visible = false;

            this.scene.add(this.collider);
            this.deps.collider = this.collider;

            this.scene.add(this.environment);

            console.log("this.scene", this.scene);

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
                    (/Wall|visitorLocation|Room/.test(c.userData.name) ||
                        /visitorLocation|Room/.test(c.userData.type))) {
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
                color: mesh.userData.type === 'visitorLocation' || mesh.userData.type === 'Room' ? 0x1b689f : 0xffffff,
                opacity: mesh.userData.type === 'visitorLocation' || mesh.userData.type === 'Room' ? 0.8 : 1,
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