// load environment
async function loadColliderEnvironment(modelPath) {
    const gltfLoader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("three/draco");
    gltfLoader.setDRACOLoader(dracoLoader);
  
    const res = await gltfLoader.loadAsync(modelPath);
    const gltfScene = res.scene;
  
    gltfScene.scale.setScalar(1);
  
    const box = new THREE.Box3().setFromObject(gltfScene);
    box.getCenter(gltfScene.position).negate();
  
    gltfScene.updateMatrixWorld(true);
  
    const toMerge = {};
  
    gltfScene.traverse((c) => {
      if (c.isMesh || c.isLight) {
        if (c.isLight) {
          c.visible = false;
        } else {
          ileMesh = ileMesh + 1;
        }
        const typeOfmesh = c.userData.type;
        toMerge[typeOfmesh] = toMerge[typeOfmesh] || [];
        toMerge[typeOfmesh].push(c);
      }
    });
  
    for (const typeOfmesh in toMerge) {
      const arr = toMerge[typeOfmesh];
  
      arr.forEach((mesh) => {
        if (mesh.userData.name !== "VisitorEnter") {
          environment.attach(mesh);
        } else {
          const visitorDir = new THREE.Vector3();
          const visitorQuaternion = new THREE.Quaternion();
          mesh.getWorldPosition(visitor.position);
          mesh.getWorldQuaternion(visitorQuaternion);
          //mesh.getWorldDirection(visitorDir)
          //visitor.applyQuaternion(visitorQuaternion)
          //visitor.lookAt(visitorDir)
          mesh.needsUpdate = true;
  
        }
      });
    }
  
    const staticGenerator = new StaticGeometryGenerator(environment);
    staticGenerator.attributes = ["position"];
  
    const mergedGeometry = staticGenerator.generate();
    mergedGeometry.boundsTree = new MeshBVH(mergedGeometry, {
      lazyGeneration: false,
    });



  collider = new THREE.Mesh(mergedGeometry);
  collider.material.wireframe = true;
  collider.material.opacity = 0;
  collider.material.transparent = true;

  scene.add(collider);

  environment.traverse((c) => {
    if (c.isLight || c.isMesh) {
      modifyObjects[c.userData.type](c);
    }
  });

  environment.traverse((c) => {
    if (/FloorOut/.test(c.userData.name)) {
      return;
    } else if (
      /Wall/.test(c.userData.name) ||
      /Wall_dystopia/.test(c.userData.name) ||
      /WallLockdowns/.test(c.userData.name) ||
      /WallWakeUp/.test(c.userData.name) ||
      /visitorLocation/.test(c.userData.type)
    ) {
      const cClone = c.clone();
      cClone.material = new THREE.MeshBasicMaterial();
      if (/visitorLocation/.test(cClone.userData.type)) {
        cClone.material.color.set(0x1b689f);
      } else {
        cClone.material.color = new THREE.Color(0xffffff);
      }
      cClone.material.needsUpdate = true;

      const worldPosition = new THREE.Vector3();
      const worldScale = new THREE.Vector3();

      c.getWorldPosition(worldPosition);
      cClone.position.copy(worldPosition);

      c.getWorldScale(worldScale);
      cClone.scale.copy(worldScale);

      sceneMap.add(cClone);
    } else {
      return;
    }
  });

  reset();
}
