
//
console.log('TODO: NORWID + strzalki (nowy obiekt: ROOM wczytywany razem z tekstur z modelu archivum), zmieni reszte textur do .KTX2, ustawi AUDIO i schowa helpery, poprawi przesówanie do kółeczka');

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { modifyObjects } from 'three/addons/libs/modifyObjects.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

import ModelLoader from 'three/addons/libs/ModelLoader.js'


import { DotScreenShader } from 'three/addons/shaders/DotScreenShader.js'

import Stats from "three/addons/libs/stats.module.js";

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

import {
  acceleratedRaycast,
  disposeBoundsTree,
  computeBoundsTree,
} from "https://unpkg.com/three-mesh-bvh@0.7.6/build/index.module.js";
import { JoyStick } from "three/addons/controls/joy.js";
import * as TWEEN from "three/addons/tween/tween.esm.js";

const loader = new THREE.TextureLoader();

const params = {
  firstPerson: true,
  displayCollider: false, //true,
  visualizeDepth: 10,
  gravity: -30,
  visitorSpeed: 3,
  physicsSteps: 5,
  reset: reset,
  exposure: 1,
  gizmoVisible: false,
  canSeeGizmo: false,
  transControlsMode: "rotate",
  heightOffset: new THREE.Vector3(0, 0.33, 0),// offset the camera from the visitor
  archiveModelPath: "../models/exterior.glb",
  enablePostProcessing: true,
};

let ileE = 2,
  ileMesh = 0,
  ileRazy = 0;

//
const listener = new THREE.AudioListener();

// Preload textures from the "textures" folder
const textureFolder = "textures/";
const textureCache = new Map();

let renderer, camera, scene, clock, tween, stats, anisotropy;
let composer, renderPass;
let rendererMap, cameraMap, circleMap, sceneMap, css2DRenderer;
const cameraDirection = new THREE.Vector3();

const ktx2Loader = new KTX2Loader()

let collider, visitor, controls, control;
let circle, circleYellow, circleBlue
let environment = new THREE.Group();

let animationId = null; // defined in outer scope

let visitorIsOnGround = false;
let fwdPressed = false,
  bkdPressed = false,
  lftPressed = false,
  rgtPressed = false;

let visitorVelocity = new THREE.Vector3();
let upVector = new THREE.Vector3(0, 1, 0);
let tempVector = new THREE.Vector3();
let tempVector2 = new THREE.Vector3();
let tempBox = new THREE.Box3();
let tempMat = new THREE.Matrix4();
let tempSegment = new THREE.Line3();

let newPosition = new THREE.Vector3();
let deltaVector = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
let intersectedFloor0 = new THREE.Object3D();
let bgTexture0 = "textures/xxxbg_puent.jpg";
const lightsToTurn = [];
const audioObjects = [];
const visitorEnter = new THREE.Vector3();

const pointer = new THREE.Vector2();
const clickedPoint = new THREE.Vector3();
const visitorPos = new THREE.Vector3();
let Wall,
  result,
  intersects,
  video, image
let intervalId;

let audioHandler, floorChecker;

THREE.Mesh.prototype.raycast = acceleratedRaycast;
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;

let target = null;
let timeout = null;

const gui = new GUI();
gui.show(false);
const joy3Param = { title: "joystick3" };
const Joy3 = new JoyStick("joy3Div", joy3Param);

//
const joyIntervalCheck = () => {
  intervalId = setInterval(() => {
    const joyEvt = Joy3.GetDir();
    lftPressed = false;
    rgtPressed = false;
    fwdPressed = false;
    bkdPressed = false;
    lftPressed = joyEvt.includes('W') || joyEvt.includes('NW') || joyEvt.includes('SW');
    rgtPressed = joyEvt.includes('E') || joyEvt.includes('NE') || joyEvt.includes('SE');
    fwdPressed = joyEvt.includes('N') || joyEvt.includes('NE') || joyEvt.includes('NW');
    bkdPressed = joyEvt.includes('S') || joyEvt.includes('SE') || joyEvt.includes('SW');
  }, 50);
};


//
const waitForMe = async (millisec) => {
  await new Promise(resolve => requestAnimationFrame(time => resolve(time + millisec)));
};

//
const fadeOutEl = (el) => {
  el.style.animation = "fadeOut 2s forwards";
  el.addEventListener("animationend", () => {
    el.remove();
  });
};

//
joyIntervalCheck();


init();


// init

function init() {

  // przeniesione z loadera100%
  let sidebar = document.querySelector(".sidebar");
  sidebar.style.display = "block";
  sidebar.style.animation = "fadeIn 2s forwards";
  //
  fadeOutEl(document.getElementById("overlay"));

  // renderer setup
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false,
  });


  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Consider other types based on your needs
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.gammaOutput = true;

  renderer.gammaFactor = 2.2;

  const isAppleDevice = /Mac|iPad|iPhone|iPod/.test(navigator.userAgent);

  renderer.toneMapping = isAppleDevice ? THREE.AgXToneMapping : THREE.ACESFilmicToneMapping;

  renderer.toneMappingExposure = params.exposure;
  renderer.outputEncoding = THREE.sRGBEncoding;

  document.body.appendChild(renderer.domElement);

  anisotropy = renderer.capabilities.getMaxAnisotropy();

  ktx2Loader.setTranscoderPath('jsm/libs/basis/').detectSupport(renderer);

  // scene setup
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x2b0a07, 3.1, 18);

  // camera setup
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    70
  );
  camera.position.set(10, 6, -10);
  //camera.far = 100;
  camera.updateProjectionMatrix();
  window.camera = camera;

  //audio on camera
  camera.add(listener);

  clock = new THREE.Clock();

  // orbit c
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 5, 0);

  // transform c
  control = new TransformControls(camera, renderer.domElement);
  control.addEventListener("dragging-changed", function (event) {
    controls.enabled = !event.value;
  });

  //
  // CSS3DRenderer for DOM elements
  const innerWidth = 780,
    innerHeight = 800;
  // sceneMap

  sceneMap = new THREE.Scene();

  sceneMap.scale.setScalar(25);
  sceneMap.rotation.x = Math.PI;
  sceneMap.rotation.y = Math.PI / 180;

  sceneMap.position.set(0, 0, 0);
  sceneMap.updateMatrixWorld(true);
  // camera


  cameraMap = new THREE.OrthographicCamera(
    innerWidth / -2,
    innerWidth / 2,
    innerHeight / 2,
    innerHeight / -2,
    0.1,
    10000
  );
  cameraMap.position.set(0, -50, 0);
  cameraMap.lookAt(new THREE.Vector3(0, 0, 0));

  //rendererMap = new THREE.WebGLRenderer();
  rendererMap = new THREE.WebGLRenderer();
  rendererMap.setClearColor(0x142236);
  document
    .querySelector("div#map_in_sidebar.info_sidebar")
    .appendChild(rendererMap.domElement);
  rendererMap.setSize(500, 500);

  // CSS2DRenderer for DOM elements
  css2DRenderer = new CSS2DRenderer();
  css2DRenderer.setSize(500, 500);
  css2DRenderer.domElement.style.position = 'absolute';
  css2DRenderer.domElement.style.top = '0';
  css2DRenderer.domElement.style.pointerEvents = 'none'; // Make sure it doesn't block interactions
  document.querySelector("div#map_in_sidebar.info_sidebar").appendChild(css2DRenderer.domElement);



  // AmbientLight
  const light = new THREE.AmbientLight(0xffffff, 20); // soft white light
  sceneMap.add(light);

  //
  // stats setup
  stats = new Stats();
  document.body.appendChild(stats.dom);



  // ambientLight
  let ambientLight = new THREE.AmbientLight(0x404040, 55);
  scene.add(ambientLight);

  //
  addVisitorMapCircle();

  // composer

  composer = new EffectComposer(renderer);
  renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const isIphone = /iPhone/.test(navigator.userAgent);

  if (!isIphone) {

    const effectDotScreen = new ShaderPass(DotScreenShader);

    composer.addPass(effectDotScreen);

  }

  // console.log("collider deps", collider)

  //
  const deps = {
    params,
    control,
    controls,
    environment,
    gui,
    lightsToTurn,
    scene,
    sceneMap,
    loader,
    listener,
    audioObjects,
    sphereSize: params.sphereSize,
    visitor,
    visitorEnter,
    TWEEN,
    anisotropy,
    composer,
  };



  // LOAD MODEL (environment, collider)
  const modelLoader = new ModelLoader(deps);

  async function loadAndPassCollider() {

    const collider = await modelLoader.loadModel(params.archiveModelPath);
   
    animate(collider);
  }

  loadAndPassCollider();

  preloadTextures();

  reset();



  // events

  document
    .querySelector("img#audio-on")
    .addEventListener("pointerdown", (evt) => {
      evt.preventDefault();
      const floorChecker = new VisitorLocationChecker(scene);
      const audioHandler = new AudioHandler();
      const el = floorChecker.checkVisitorLocation(visitor);
      audioHandler.handleAudio(scene.getObjectByName(el.userData.audioToPlay));

    });

  // optimized raycaster after click
  const onPointerDown = (event) => {
    const { clientX, clientY } = event;
    pointer.x = (clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    raycaster.firstHitOnly = true;
    intersects = raycaster.intersectObjects(scene.children);

    Wall = intersects.find(({ object }) => object.userData.name === "Wall");

    result = intersects.find(({ object }) => object.userData.type === "Video");
    if (result) {
      video = document.getElementById(result.object.userData.elementID);
      video.paused ? video.play() : video.pause();
    }

    // checking if clicked obj needs description
    image = intersects.find(({ object }) => object.userData.opis);


    if (image && intersects.indexOf(image) < intersects.indexOf(Wall)) {
      if (!document.getElementById("viewer")) {
        const viewer = document.createElement("div");
        viewer.className = "viewer";
        viewer.id = "viewer";
        viewer.style.animation = "fadeInViewer 2s forwards";
        viewer.innerHTML = "</br>";
        const viewImage = document.createElement("img");
        viewImage.id = "image-view";
        viewImage.src = image.object.userData.Map;
        viewer.appendChild(viewImage);

        // text-on-screen
        if (image.object.userData.opis) {
          const textOnscreen = document.createElement("div");
          textOnscreen.id = "text-on-screen";
          viewer.appendChild(textOnscreen);
          textOnscreen.innerText = `${image.object.userData.opis}`;
        }
        document.body.appendChild(viewer);
      }
    } else {
      if (document.getElementById("viewer")) {
        const el = document.getElementById("viewer");
        fadeOutEl(el);
      }
    }

    // is floor clicked?
    result = intersects.find(
      ({ object }) => object.userData.type === "visitorLocation"
    );

    if (result) {
      const index = intersects.indexOf(result);

      // if clicked floor is on 1st plan
      if (index <= 1) {
        const { distance, point } = result;
        clickedPoint.copy(point);
        visitorPos.copy(visitor.position);
        clickedPoint.y = visitor.position.y;

        // Tween
        tween = new TWEEN.Tween(visitorPos)
          .to(clickedPoint, (distance * 1000) / params.visitorSpeed)
          .onUpdate(() => {
            visitor.position.copy(visitorPos);
            visitor.updateMatrixWorld();

            // because of event change on controls
            //renderer.render(scene, camera);
          });
        tween.start(); // Start the tween immediately

        let innerRad = new THREE.Vector3(1, 1, 1);
        const zero = new THREE.Vector3(0, 0, 0);
        circle.position.copy(point);
        circle.position.y += 0.01;
        const tweenCircle = new TWEEN.Tween(innerRad);
        tweenCircle.to(zero, 3000 / params.visitorSpeed);
        tweenCircle.onUpdate(() => {
          circle.scale.copy(innerRad);
        });
        tweenCircle.start();
      }
    }
  };


  // sidebar buttons events
  function handleSBbuttonsClick(divID) {
    //const isItMap = false;
    document.querySelectorAll(".info_sidebar").forEach((div) => {
      if (div.id === divID) {
        // Adds 'open' class if it doesn't have it, removes if it does
        div.classList.toggle("open");
      } else {
        // Makes sure other divs are hidden
        div.classList.remove("open");
      }
    });
  }

  document.addEventListener("onload", (e) => {
  });

  // open/close sb
  document.querySelector("#btn").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    document.querySelector(".sidebar").classList.toggle("open");
  });

  // info
  document.querySelector("#info-icon").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    handleSBbuttonsClick(e.target.getAttribute("data-divid"));
  });

  // publications
  document.querySelector("#books-icon").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    handleSBbuttonsClick(e.target.getAttribute("data-divid"));
  });

  // archive's map
  document.querySelector("#map-icon").addEventListener("pointerdown", (e) => {
    e.preventDefault();

    handleSBbuttonsClick(e.target.getAttribute("data-divid"));
    if (
      document
        .querySelector("li.text_in_sidebar div#map_in_sidebar.info_sidebar")
        .classList.contains("open")
    ) {
      animateMap();
    } else {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null; // reset the id
      }
    }
  });
  // open BPA Gallery website
  document.querySelector("#bpa-icon").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    let newWindow = window.open();
    newWindow.location.assign("https://bluepointart.uk/");
  });

  //

  //////
  // checking how many click
  const textOnScreenEl = document.getElementById("text-on-screen");
  const viewerEl = document.getElementById("viewer");
  window.addEventListener("pointerdown", (e) => {
    if (e.target === target) {
      // double
      clearTimeout(timeout);
      target = null;
      timeout = null;
      onPointerDown(e);
    } else {
      // single
      target = e.target;
      timeout = setTimeout(() => {
        target = null;
        timeout = null;
      }, 500);
      if (textOnScreenEl) {
        const el = textOnScreenEl;
        fadeOutEl(el);
      } else if (viewerEl) {
        let el = viewerEl;
        fadeOutEl(el);
      }
    }
  });

  window.addEventListener(
    "resize",
    function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    },
    false
  );

  // key controls
  const keysPressed = {};
  window.addEventListener("keydown", (event) => {
    keysPressed[event.key] = true;
    if (event.key === "ArrowDown" || event.key === "s") bkdPressed = true;
    if (event.key === "ArrowUp" || event.key === "w") fwdPressed = true;
    if (event.key === "ArrowRight" || event.key === "d") rgtPressed = true;
    if (event.key === "ArrowLeft" || event.key === "a") lftPressed = true;
    if (event.key === " ") visitorVelocity.y = visitorIsOnGround ? 20.0 : 0;
    if (event.key === "g" && params.canSeeGizmo) control._gizmo.visible = !control._gizmo.visible;
    if (event.key === "m") control.setMode("translate");
    if (event.key === "r") control.setMode("rotate");
    if (event.key === "Escape") control.reset();
    clearInterval(intervalId);
  });

  window.addEventListener("keyup", (event) => {
    delete keysPressed[event.key];
    if (event.key === "ArrowDown" || event.key === "s") bkdPressed = false;
    if (event.key === "ArrowUp" || event.key === "w") fwdPressed = false;
    if (event.key === "ArrowRight" || event.key === "d") rgtPressed = false;
    if (event.key === "ArrowLeft" || event.key === "a") lftPressed = false;
  });


}
//



// reset visitor
function reset() {

  console.log("reset");
  bgTexture0 = "/textures/xxxbg_puent.jpg";
  visitorVelocity.set(0, 0, 0);

  const target = visitorEnter.clone();

  const circleMap = sceneMap.getObjectByName("circleMap");
  if (circleMap) {
    circleMap.position.copy(target);
  }

  target.y = 10;
  camera.position.sub(controls.target);
  controls.target.copy(target);
  camera.position.add(target);
  controls.update();

  visitor.position.copy(target);

}

// update visitor
async function updateVisitor(collider, delta) {

  //console.log("collider updateviz", collider, delta);
  if (visitorIsOnGround) {
    visitorVelocity.y = delta * params.gravity;
  } else {
    visitorVelocity.y += delta * params.gravity;
  }

  visitor.position.addScaledVector(visitorVelocity, delta);

  // move the visitor
  const angle = controls.getAzimuthalAngle();
  if (fwdPressed) {
    tempVector.set(0, 0, -1).applyAxisAngle(upVector, angle);
    visitor.position.addScaledVector(tempVector, params.visitorSpeed * delta);
  }

  if (bkdPressed) {
    tempVector.set(0, 0, 1).applyAxisAngle(upVector, angle);
    visitor.position.addScaledVector(tempVector, params.visitorSpeed * delta);
  }
  if (lftPressed) {
    tempVector.set(-1, 0, 0).applyAxisAngle(upVector, angle);
    visitor.position.addScaledVector(tempVector, params.visitorSpeed * delta);
  }

  if (rgtPressed) {
    tempVector.set(1, 0, 0).applyAxisAngle(upVector, angle);
    visitor.position.addScaledVector(tempVector, params.visitorSpeed * delta);
  }

  visitor.updateMatrixWorld();

  // adjust visitor position based on collisions
  const capsuleInfo = visitor.capsuleInfo;
  tempBox.makeEmpty();
  tempMat.copy(collider.matrixWorld).invert();
  tempSegment.copy(capsuleInfo.segment);

  // get the position of the capsule in the local space of the collider
  tempSegment.start.applyMatrix4(visitor.matrixWorld).applyMatrix4(tempMat);
  tempSegment.end.applyMatrix4(visitor.matrixWorld).applyMatrix4(tempMat);

  // get the axis aligned bounding box of the capsule
  tempBox.expandByPoint(tempSegment.start);
  tempBox.expandByPoint(tempSegment.end);

  tempBox.min.addScalar(-capsuleInfo.radius);
  tempBox.max.addScalar(capsuleInfo.radius);

  collider.geometry.boundsTree.shapecast({
    intersectsBounds: (box) => box.intersectsBox(tempBox),

    intersectsTriangle: (tri) => {
      // check if the triangle is intersecting the capsule and adjust the
      // capsule position if it is.
      const triPoint = tempVector;
      const capsulePoint = tempVector2;

      const distance = tri.closestPointToSegment(
        tempSegment,
        triPoint,
        capsulePoint
      );
      if (distance < capsuleInfo.radius) {
        const depth = capsuleInfo.radius - distance;
        const direction = capsulePoint.sub(triPoint).normalize();

        tempSegment.start.addScaledVector(direction, depth);
        tempSegment.end.addScaledVector(direction, depth);
      }
    },
  });

  //console.log("collider updateviz 2", collider, delta);

  // get the adjusted position of the capsule collider in world space after checking
  // triangle collisions and moving it. capsuleInfo.segment.start is assumed to be
  // the origin of the visitor model.
  newPosition = tempVector;
  newPosition.copy(tempSegment.start).applyMatrix4(collider.matrixWorld);

  // check how much the collider was moved
  deltaVector = tempVector2;
  deltaVector.subVectors(newPosition, visitor.position);

  // if the visitor was primarily adjusted vertically we assume it's on something we should consider ground
  visitorIsOnGround =
    deltaVector.y > Math.abs(delta * visitorVelocity.y * 0.25); ///

  const offset = Math.max(0.0, deltaVector.length() - 1e-5);
  deltaVector.normalize().multiplyScalar(offset);

  // adjust the visitor model
  visitor.position.add(deltaVector);

  if (!visitorIsOnGround) {
    deltaVector.normalize();
    visitorVelocity.addScaledVector(
      deltaVector,
      -deltaVector.dot(visitorVelocity)
    );
  } else {
    visitorVelocity.set(0, 0, 0);
  }

  // offset the camera - this is a bit hacky
  tempVector.copy(visitor.position).add(params.heightOffset);

  camera.position.sub(controls.target);
  controls.target.copy(tempVector);
  camera.position.add(tempVector);

  //
  const target = visitor.position.clone();
  target.add(new THREE.Vector3(0, 0, 0));
  sceneMap.getObjectByName("circleMap").position.copy(target);

  // if the visitor has fallen too far below the level reset their position to the start
  if (visitor.position.y < -10) {
    reset();
  }


  // checkin where the visitor is => tutning on/off  video/animations & audio & gizmo
  floorChecker = new VisitorLocationChecker(scene);

  const intersectedFloor = floorChecker.checkVisitorLocation(visitor);

  if (intersectedFloor) {

    params.enablePostProcessing = intersectedFloor.name === "FloorOut";

    const belongsTo = intersectedFloor.userData.belongsTo;
    const lightsToTurnValue = intersectedFloor.userData.lightsToTurn;

    if (lightsToTurn && intersectedFloor.userData.name && intersectedFloor0.userData.name !== intersectedFloor.userData.name) {

      params.canSeeGizmo = (lightsToTurnValue === "lightsDystopia") ? true : false;

      //AUDIO
      audioHandler = new AudioHandler();

      handleAudio(intersectedFloor, audioHandler);

      //LIGHTS
      handleLights(lightsToTurn, lightsToTurnValue);

      // VIDEOS
      handleVideos(scene, belongsTo);

      //SCENE BACKGROUND
      handleSceneBackground(intersectedFloor);

      // Load TEXTURES and DISPOSE other objects based on the exhibit and belongsTo categories
      loadTexturesAndDispose(belongsTo);

      intersectedFloor0 = intersectedFloor

    }

  }

}
//
function handleAudio(intersectedFloor, audioHandler) {
  if (intersectedFloor.userData.audioToPlay) {
    audioHandler.handleAudio(null);

    const audioOn = document.querySelector("#audio-on");
    audioOn.style.display = "block";
    audioOn.classList.add("flash");

    const animationEndListener = () => {
      audioOn.classList.remove("flash");
      audioOn.removeEventListener("animationend", animationEndListener);
    };

    audioOn.addEventListener("animationend", animationEndListener);

    for (const el of audioObjects) {
      if (el.children[0].name === intersectedFloor.userData.audioToPlay) {
        audioHandler.handleAudio(el.children[0]);
      }
    }
  } else {
    audioHandler.handleAudio(null);
  }
}

function handleLights(lightsToTurn, lightsToTurnValue) {
  for (const el of lightsToTurn) {
    el.visible = el.userData.name === lightsToTurnValue;

  }
}

function handleVideos(scene, belongsTo) {
  scene.traverse(c => {
    if (c.userData.type === "Video") {
      const belongsToArray = Array.isArray(belongsTo) ? belongsTo : [belongsTo];
      const cBelongsToArray = Array.isArray(c.userData.belongsTo) ? c.userData.belongsTo : [c.userData.belongsTo];

      const belongsToCurrentExhibit = cBelongsToArray.some(exhibit => belongsToArray.includes(exhibit));

      if (belongsToCurrentExhibit) {
        if (c.userData.elementID) {
          const video = document.getElementById(c.userData.elementID);
          video.play();
        } else {
          const allVideos = document.getElementsByTagName("video");
          for (let i = 0; i < allVideos.length; i++) {
            allVideos[i].pause();
          }
        }
      }
    }
  });
}

function handleSceneBackground(intersectedFloor) {

  let bgTexture = intersectedFloor.userData.bgTexture || "textures/2d_etc1s.ktx2";
  const bgInt = intersectedFloor.userData.bgInt || 1;
  const bgBlur = intersectedFloor.userData.bgBlur || 0;

  if (textureCache.has(bgTexture)) {
    setSceneBackgroundWithTransition(scene, textureCache.get(bgTexture), bgBlur, bgInt);
  } else {
    // Load the KTX2 texture
    ktx2Loader.setTranscoderPath('jsm/libs/basis/').detectSupport(renderer);

    ktx2Loader.load(bgTexture, (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.colorSpace = THREE.SRGBColorSpace;

      setSceneBackgroundWithTransition(scene, texture, bgBlur, bgInt);
    });

  }
}

function setSceneBackgroundWithTransition(scene, newTexture, blurIntensity, intensity) {

  const transitionDuration = 2000; // in milliseconds

  scene.background = newTexture;
  scene.backgroundIntensity = 0;

  new TWEEN.Tween(scene)
    .to({ backgroundIntensity: intensity }, transitionDuration)
    .onUpdate(() => {
      scene.backgroundBlurriness = blurIntensity;
    })
    .onComplete(() => {
      scene.backgroundIntensity = intensity;
    })
    .start();
}


async function loadTexturesAndDispose(belongsTo) {
  const deps = {
    params,
    control,
    environment,
    gui,
    lightsToTurn,
    scene,
    sceneMap,
    loader,
    listener,
    audioObjects,
    sphereSize: params.sphereSize,
    visitor,
    anisotropy,
    ktx2Loader,
    THREE,

  };


  const objectsToDispose = [];

  scene.traverse(c => {
    if (!c.userData.belongsTo) return;

    // Ensure both c.userData.belongsTo and belongsTo are arrays
    const belongsToArray = Array.isArray(belongsTo) ? belongsTo : [belongsTo];
    const cBelongsToArray = Array.isArray(c.userData.belongsTo) ? c.userData.belongsTo : [c.userData.belongsTo];

    // Check if there is any intersection between cBelongsToArray and belongsToArray
    const belongsToCurrentExhibit = cBelongsToArray.some(exhibit => belongsToArray.includes(exhibit));

    if (!belongsToCurrentExhibit && c.material && !c.userData.isMaterialDisposed && !c.userData.type === "Room") {
      objectsToDispose.push(c);

    } else if (belongsToCurrentExhibit) {

      //console.log(c.userData.type )

      modifyObjects[c.userData.type]?.(c, deps);
      c.userData.isMaterialDisposed = false;
    }
  });

  await Promise.all(objectsToDispose.map(async (c) => {

    c.material.map = null;
    c.material.dispose();
    c.material.needsUpdate = true;
    c.userData.isMaterialDisposed = true;
  }));
}


//

function animateMap() {
  animationId = requestAnimationFrame(animateMap);

  camera.getWorldDirection(cameraDirection);
  const angle = Math.atan2(cameraDirection.x, cameraDirection.z);
  sceneMap.rotation.y = -angle + Math.PI;

  sceneMap.updateMatrixWorld();

  rendererMap.render(sceneMap, cameraMap);
  css2DRenderer.render(sceneMap, cameraMap);
}

//
function animate(collider) {

  TWEEN.update();

  const delta = Math.min(clock.getDelta(), 0.1);

  if (params.firstPerson) {
    controls.maxPolarAngle = Math.PI;
    controls.minDistance = 1e-4;
    controls.maxDistance = 1e-4;
  } else {
    controls.maxPolarAngle = Math.PI / 2;
    controls.minDistance = 1;
    controls.maxDistance = 20;
  }

  if (collider) {

    //collider.visible = params.displayCollider;

    const physicsSteps = params.physicsSteps;

    for (let i = 0; i < physicsSteps; i++) {
      updateVisitor(collider, delta / physicsSteps);
    }
  }


  requestAnimationFrame(() => animate(collider));

  if (composer && params.enablePostProcessing === true) {

    //

    composer.render();

  } else {

    renderer.render(scene, camera);

  }

  controls.update();
}


////

function addVisitorMapCircle() {


  // visitor
  visitor = new THREE.Mesh(
    new RoundedBoxGeometry(0.2, 0.2, 0.2, 10, 0.5),
    new THREE.MeshStandardMaterial()
  );
  //visitor.scale.setScalar(0.01);
  visitor.name = "visitor";
  visitor.capsuleInfo = {
    radius: 0.2,
    segment: new THREE.Line3(
      new THREE.Vector3(),
      new THREE.Vector3(0, 0.1, 0.0)
    ),
  };
  visitor.castShadow = false;
  visitor.material.wireframe = true;
  visitor.visible = false;
  scene.add(visitor);

  // visitor Map
  circleMap = new THREE.Mesh(
    new THREE.RingGeometry(0.1, 1, 32),
    new THREE.MeshBasicMaterial({
      color: 0xbf011f,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1,
    })
  );
  circleMap.position.copy(visitor.position);
  circleMap.position.y = visitor.position.y + 1000;
  circleMap.name = "circleMap";
  circleMap.rotation.x = (90 * Math.PI) / 180;
  circleMap.visible = true
  circleMap.material.depthWrite = true

  sceneMap.add(circleMap);

  /// circle (pointer)
  circle = new THREE.Group();
  circle.position.copy(visitor.position);
  circle.position.y = -30;

  circleYellow = new THREE.Mesh(
    new THREE.RingGeometry(0.1, 0.12, 32),
    new THREE.MeshBasicMaterial({
      color: 0xffcc00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    })
  );
  circleYellow.rotation.x = (90 * Math.PI) / 180;

  circleBlue = new THREE.Mesh(
    new THREE.RingGeometry(0.12, 0.14, 32),
    new THREE.MeshBasicMaterial({
      color: 0x0066cc,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    })
  );
  circleBlue.rotation.x = (90 * Math.PI) / 180;
  circle.add(circleYellow);
  circle.add(circleBlue);
  scene.add(circle);

  //
  scene.add(environment);

}

//

function ileElementow() {
  ileE++;
  if (ileRazy < 1 && ileE <= ileMesh) {
    const progress = Math.round((ileE / ileMesh) * 100);
    document.getElementById("loading").textContent = progress + "% loaded";
    if (progress === 100) {
      ileRazy++;
      fadeOutEl(document.getElementById("overlay"));
    }
  }
}

//
function preloadTextures() {

  ktx2Loader.setTranscoderPath('jsm/libs/basis/')
  ktx2Loader.detectSupport(renderer)

  const textureFiles = ['bg_color.ktx2', 'galaktyka.ktx2', 'equMap_podMostem.ktx2', 'bg_white.ktx2', 'bg_lockdowns.ktx2', 'dystopia/bgVermeerViewofDelft.ktx2']; // Add all texture filenames here


  textureFiles.forEach((textureFile) => {

    const textureUrl = textureFolder + textureFile;

    ktx2Loader.load(textureUrl, (texture) => {

      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.colorSpace = THREE.SRGBColorSpace;

      textureCache.set(textureUrl, texture);

    });
  });
}




//
class AudioHandler {
  handleAudio(audioToTurn) {
    const audioOn = document.querySelector("#audio-on");

    if (!audioToTurn || audioToTurn.type !== "Audio") {
      audioOn.src = "/icons/audioMuted.png";
      audioOn.style.display = "none";
      audioObjects.forEach(el => el.children[0].pause());
      return;
    }

    if (audioToTurn.isPlaying) {
      audioToTurn.stop();
      audioOn.style.display = "block";
      audioOn.src = "/icons/audioMuted.png";
    } else {
      audioToTurn.play();
      audioOn.style.display = "block";
      audioOn.src = "/icons/audioButton.png";
    }
  }
}


//
class VisitorLocationChecker {
  constructor(scene) {
    this.scene = scene;
    this.raycaster = new THREE.Raycaster();
    this.downVector = new THREE.Vector3(0, -1, 0);
    this.vector = new THREE.Vector3();
    this.intersectedObjects = [];
  }
  checkVisitorLocation(visitor) {
    this.raycaster.firstHitOnly = true;
    this.raycaster.set(visitor.position, this.downVector);
    this.raycaster.intersectObjects(this.scene.children, true, this.intersectedObjects);
    return this.intersectedObjects.find(({ object }) => {
      const type = object.userData.type;
      return type === "visitorLocation" || type === "Room";
    })?.object;

  }
}
