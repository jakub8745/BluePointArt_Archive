import * as THREE from 'three';
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { MeshBVH, StaticGeometryGenerator } from "https://unpkg.com/three-mesh-bvh@0.7.6/build/index.module.js";
import { modifyObjects } from 'three/addons/libs/modifyObjects.js';

class ModelLoader {
    /**
     * @param {Object} deps - dependencies
     * @throws {Error} when deps is null or undefined
     */
    constructor(deps) {
        if (!deps) {
            throw new Error("ModelLoader: deps is null or undefined");
        }

        this.deps = deps;
        this.collider = null;

        this.scene = deps.isVisitorOnMainScene ? deps.mainScene : deps.exhibitScene;


        this.environment = new THREE.Group();
        this.toMerge = {};
        this.typeOfmesh = "";

        this.gltfLoader = new GLTFLoader();
        this.gltfLoader.setDRACOLoader(new DRACOLoader('./jsm/libs/draco/'));

        this.exhibits = [];
    }

    async loadModel(modelPath) {
        try {
            const { scene: gltfScene } = await this.gltfLoader.loadAsync(modelPath);

            gltfScene.scale.setScalar(1);
            const box = new THREE.Box3().setFromObject(gltfScene);
            box.getCenter(gltfScene.position).negate();
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

            // Generate the collider using the populated environment
            const staticGenerator = new StaticGeometryGenerator(this.environment);
            staticGenerator.attributes = ["position"];

            const mergedGeometry = staticGenerator.generate();
            mergedGeometry.boundsTree = new MeshBVH(mergedGeometry, {
                lazyGeneration: false,
            });

            this.collider = new THREE.Mesh(mergedGeometry);
            this.collider.material.wireframe = true;
            this.collider.material.opacity = 0;
            this.collider.material.transparent = true;

            this.collider.name = "collider";
            this.collider.visible = false;


            this.scene.add(this.collider);
            this.deps.collider = this.collider;

            this.environment.name = "environment";
            this.scene.add(this.environment);

            console.log("scene :",this.scene.name, this.scene, this.scene.uuid)


            this.environment.traverse((c) => {
                if (c.isLight || c.isMesh) {
                    modifyObjects[c.userData.type]?.(c, this.deps);
                }

                if (

                    /Wall|visitorLocation|Room/.test(c.userData.name) ||
                    /visitorLocation|Room/.test(c.userData.type)

                ) {
                    this.addToSceneMap(c);
                }
            });

            return this.collider;
        } catch (error) {
            console.error('Error loading model:', error);
            throw error;
        }
    }


    addToSceneMap(mesh) {

        const { sceneMap } = this.deps;

        const cClone = mesh.clone();
        cClone.material = new THREE.MeshBasicMaterial();

        if (cClone.userData.type === 'visitorLocation' || cClone.userData.type === 'Room') {
            if (cClone.name === 'FloorOut') cClone.visible = false;

            cClone.material.color.set(0x1b689f);
            cClone.material.transparent = true;
            cClone.material.opacity = 0.8;

            if (cClone.userData.label) {
                const labelDiv = document.createElement('div');
                labelDiv.className = 'label';
                labelDiv.textContent = cClone.userData.label;
                labelDiv.style.marginTop = '1em';
                labelDiv.style.pointerEvents = 'auto';

                // Add click event to label to move the visitor
                labelDiv.addEventListener('click', () => {

                    const targetPosition = cClone.position.clone();

                    this.deps.visitorEnter.set(targetPosition.x, targetPosition.y, targetPosition.z);

                    this.deps.resetVisitor();
                });


                const labelObject = new CSS2DObject(labelDiv);
                labelObject.position.set(0, 0, 0);
                cClone.add(labelObject);
            }
        } else {
            cClone.material.color = new THREE.Color(0xffffff);
        }

        cClone.material.needsUpdate = true;
        cClone.position.copy(mesh.position);
        cClone.scale.copy(mesh.scale);

        if (sceneMap) sceneMap.add(cClone);
    }

}

export default ModelLoader;
