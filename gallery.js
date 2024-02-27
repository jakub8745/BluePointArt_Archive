//todo:
// poprawna tekstura na oknie dystopii
// panel boczny z mapą i przyciskami
//
// * rozjaśnić --> identity --> dystopia
// * opisy Wystawę
// * DODAĆ DZWIEK DO DYSTOPII --> dźwięk dystopii tylko kiedy visitor jest w dystopi
// * dodatkowy kontrol dla garnka

//wyczyścić kod z niepotrzebnych bibliote
// [ przenikanie się teł]

//

import * as THREE from "three";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import {
  MeshBVH,
  acceleratedRaycast,
  disposeBoundsTree,
  computeBoundsTree,
  StaticGeometryGenerator,
} from "https://unpkg.com/three-mesh-bvh@0.6.8/build/index.module.js";
import { JoyStick } from "three/addons/controls/joy.js";
import * as TWEEN from "three/addons/tween/tween.esm.js";

const loader = new THREE.TextureLoader();

const params = {
  firstPerson: true, //false, //true,
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
  archiveModelPath: "../models/galeriaGLTF/archive_vincenz.glb",
};

//
const fadeOutEl = (el) => {
  //el.style.opacity = 0;
  // el.style.transition = "opacity 1.5s";
  el.style.animation = "fadeOut 2s forwards";
  setTimeout(() => {
    el.remove();
  }, 2000);
};
let ileE = 1,
  ileMesh = 0,
  ileRazy = 0;

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
const listener = new THREE.AudioListener();

//
const modifyObjects = {
  SpotLight: (mesh) => {
    mesh.matrixWorldAutoUpdate = true;
    mesh.userData.intensity = mesh.intensity;

    const targetObject = new THREE.Object3D();
    mesh.target = targetObject;
    const target = environment.getObjectByName(mesh.userData.whichTarget);
    if (target) {
      target.getWorldPosition(mesh.target.position);
      mesh.castShadow = true;
      mesh.shadow.mapSize.set(1024, 1024);
      mesh.shadow.blurSamples = 15;
      mesh.shadow.radius = 1;
      environment.attach(targetObject);

      if (mesh.userData.name === "mmmmlightsDystopia") {
        gui.add(mesh, "visible").name("visible" + mesh.name);
        gui.add(mesh, "intensity", 0, 50, 0.01).name("intensity" + mesh.name);
        gui.add(mesh, "distance", 0, 500, 0.1).name("distance" + mesh.name);
        gui.add(mesh, "decay", 0, 10, 0.01).name("decay" + mesh.name);
        gui.add(mesh.position, "y", -10, 50, 0.01).name("y" + mesh.name);
      }
    }
    lightsToTurn.push(mesh);
  },
  PointLight: (mesh) => {

    mesh.visible = true;
    mesh.userData.intensity = mesh.intensity;
    mesh.castShadow = true;
    mesh.shadow.mapSize.set(1024, 1024);
    mesh.shadow.blurSamples = 15;
    mesh.shadow.radius = 1;

    //console.log("")
    if (mesh.userData.name === "____lightsNorwid") {
      const params = { folder: mesh.name };
      gui.add(params, "intensity", 0, 50, 0.01).name("intensity" + mesh.name);
      gui.add(params, "distance", 0, 500, 0.1).name("distance" + mesh.name);
      gui.add(params, "decay", 0, 10, 0.01).name("decay" + mesh.name);
      gui.add(mesh.position, "y", -10, 50, 0.01).name("y" + mesh.name);
      gui.add(mesh.position, "x", -50, 50, 0.01).name("x" + mesh.name);
      gui.add(mesh.position, "z", -50, 50, 0.01).name("z" + mesh.name);
      gui.add(mesh, "visible").name("visible");
    }
    lightsToTurn.push(mesh);
  },
  AmbientLight: () => {
    console.log("ambientLight");
  },
  SpotLightTarget: (mesh) => {
    mesh.visible = false;
    //
    ileElementow();
  },
  ShaderBox: (mesh) => {
    //
    ileElementow();
  },
  VisitorEnter: (mesh) => {
    //mesh.getWorldPosition(visitorEnter);
    mesh.visible = false;
    mesh.removeFromParent();
    //
    ileElementow();
  },
  Text: (mesh) => {
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
      scene.add(object);
      mesh.removeFromParent();
    });
    //
    ileElementow();
  },
  visitorLocation: (mesh) => {
    const { Map, wS, wT } = mesh.userData;
    const material = new THREE.MeshLambertMaterial({ map: loader.load(Map) });
    material.map.wrapS = THREE.RepeatWrapping;
    material.map.wrapT = THREE.RepeatWrapping;
    material.map.anisotropy = anisotropy;
    material.map.repeat.set(wS, wT);
    material.minFilter = THREE.LinearMipMapLinearFilter;
    material.magFilter = THREE.LinearFilter;
    material.map.rotate = Math.PI / 2;
    mesh.material = material;
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    mesh.material.needsUpdate = true;
    ileElementow();
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
      minFilter: THREE.LinearMipmapNearestFilter,
      magFilter: THREE.LinearFilter,
      needsUpdate: true,
    });
    ileElementow();
  },
  Image: (mesh) => {
    mesh.material = new THREE.MeshLambertMaterial({ transparent: true });
    modifyObjects.element(mesh, false, false);
  },
  Sculpture: (mesh) => {
    //console.log("sculpture: ", mesh.userData.name, "control: ", control);
    if (mesh.userData.name === "dzbanDystopia") {
      control._gizmo.visible = params.gizmoVisible;
      control.setMode(params.transControlsMode);
      control.attach(mesh);
      scene.add(control);

      // AUDIO

      const sound = new THREE.PositionalAudio(listener);
      const audioLoader = new THREE.AudioLoader();
      audioLoader.load("audio/pouring_milk.mp3", (buffer) => {
        sound.name = "pouringMilk";
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setRefDistance(0.04);
        sound.setRolloffFactor(4);
        //sound.setMaxDistance(5);
        sound.setVolume(15);

        mesh.add(sound);
      });
    }

    modifyObjects.element(mesh, true, true);
  },
  Video: (mesh) => {
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
    ileElementow();
  },
  Audio: (mesh) => {
    //
    if (mesh.userData.name === "trembita") {
      //
      const sound = new THREE.PositionalAudio(listener);
      const audioLoader = new THREE.AudioLoader();
      audioLoader.load("audio/trembita.mp3", (buffer) => {
        sound.name = "trembitaSound";
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setRefDistance(0.04);
        sound.setRolloffFactor(4);
        //sound.setMaxDistance(5);
        sound.setVolume(15);

        mesh.add(sound);
      });

    }
  },
};

let renderer, camera, scene, clock, tween, stats, anisotropy;
let rendererMap, sceneMap, cameraMap;
let collider, visitor, controls, control;
let environment = new THREE.Group();
//const objectsToAdd = [];
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
const raycaster = new THREE.Raycaster();
const raycasterVisitor = new THREE.Raycaster();
let visitorLocation0 = "xxx";
let bgTexture0;
const lightsToTurn = [];
const visitorEnter = new THREE.Vector3();

//const newWindow = window.open();

// for simulating change event in controls case it is needed to continue flow of animation when visitor isn't moving
const changeEvent = { type: "change" };


const pointer = new THREE.Vector2();
const clickedPoint = new THREE.Vector3();
const visitorPos = new THREE.Vector3();
let Wall,
  result,
  intersects,
  video
let intensityTo, intervalId;

const origVec = new THREE.Vector3();
const dirVec = new THREE.Vector3(0, -1, 0).normalize();
THREE.Mesh.prototype.raycast = acceleratedRaycast;
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;

let target = null;
let timeout = null;

const gui = new GUI();
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
    switch (joyEvt) {
      case "W":
        lftPressed = true;
        break;
      case "E":
        rgtPressed = true;
        break;
      case "N":
        fwdPressed = true;
        break;
      case "S":
        bkdPressed = true;
        break;
      case "NE":
        fwdPressed = true;
        rgtPressed = true;
        break;
      case "SW":
        bkdPressed = true;
        lftPressed = true;
        break;
      case "SE":
        bkdPressed = true;
        rgtPressed = true;
        break;
      case "NW":
        fwdPressed = true;
        lftPressed = true;
        break;
      default:
        break;
    }
  }, 50);
};
joyIntervalCheck();


const waitForMe = async (millisec) => {
  await new Promise(resolve => setTimeout(resolve, millisec, ''));
};

init();
animate();

function init() {
  // przeniesione z loadera100%
  let sidebar = document.querySelector(".sidebar");
  sidebar.style.display = "block";
  sidebar.style.animation = "fadeIn 2s forwards";
  //

  // joystick controls


  // renderer setup
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false,
  });

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; //VSMShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = params.exposure;
  document.body.appendChild(renderer.domElement);
  anisotropy = renderer.capabilities.getMaxAnisotropy();

  const pmremGenerator = new THREE.PMREMGenerator(renderer);

  // scene setup
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x373739, 3.1, 10);

  // gui.add(params, "firstPerson", false).name("firstPerson");

  // camera setup
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    50
  );
  camera.position.set(10, 6, -10);
  camera.far = 100;
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
  // sceneMap
  sceneMap = new THREE.Scene();
  sceneMap.scale.setScalar(25);
  sceneMap.rotation.x = Math.PI / 2;
  sceneMap.rotation.y = -Math.PI / 2;
  sceneMap.position.set(0, 130, 0);
  sceneMap.updateMatrixWorld(true);
  // camera
  let innerWidth = 780,
    innerHeight = 800;
  cameraMap = new THREE.OrthographicCamera(
    innerWidth / -2,
    innerWidth / 2,
    innerHeight / 2,
    innerHeight / -2,
    0.1,
    10000
  );
  cameraMap.position.set(79, 59, 10);
  cameraMap.lookAt(new THREE.Vector3(80, 60, 0));
  //
  // rendererMap //html body div.sidebar.open div#map_in_sidebar.info_sidebar.open canvas
  rendererMap = new THREE.WebGLRenderer();
  rendererMap.setClearColor(0x142236);
  document
    .querySelector("div#map_in_sidebar.info_sidebar")
    .appendChild(rendererMap.domElement);
  rendererMap.setSize(390, 400);
  // AmbientLight
  const light = new THREE.AmbientLight(0x404040, 30); // soft white light
  sceneMap.add(light);

  //
  // stats setup
  stats = new Stats();
  document.body.appendChild(stats.dom);

  // ambientLight
  let ambientLight = new THREE.AmbientLight(0xffffff, 0);
  scene.add(ambientLight);

  lightOn(ambientLight, 0.2);

  // load ENVIRONMENT (scene contains only pure geometries with userData.paths to load TEXTURES later)
  loadColliderEnvironment(params.archiveModelPath); //, gtaoPass);

  // visitor
  visitor = new THREE.Mesh(
    new RoundedBoxGeometry(1.0, 2.0, 1.0, 10, 0.5),
    new THREE.MeshStandardMaterial()
  );
  //visitor.scale.setScalar(0.01);
  visitor.name = "visitor";
  visitor.capsuleInfo = {
    radius: 0.45,
    segment: new THREE.Line3(
      new THREE.Vector3(),
      new THREE.Vector3(0, 0.1, 0.0)
    ),
  };
  visitor.castShadow = false;
  visitor.material.wireframe = false;
  scene.add(visitor);

  // visitor Map
  const circleMap = new THREE.Mesh(
    new THREE.RingGeometry(0.1, 1, 32),
    new THREE.MeshBasicMaterial({
      color: 0xbf011f,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1,
    })
  );
  circleMap.position.copy(visitor.position);
  circleMap.name = "circleMap";
  circleMap.rotation.x = (90 * Math.PI) / 180;

  sceneMap.add(circleMap);

  /// circle (pointer)
  const circle = new THREE.Group();
  circle.position.copy(visitor.position);
  circle.position.y = -30;

  const circleYellow = new THREE.Mesh(
    new THREE.RingGeometry(0.1, 0.12, 32),
    new THREE.MeshBasicMaterial({
      color: 0xffcc00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    })
  );
  circleYellow.rotation.x = (90 * Math.PI) / 180;
  const circleBlue = new THREE.Mesh(
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

  document
    .querySelector("#play-icon")
    .addEventListener("pointerdown", (evt) => {
      evt.preventDefault();
      //switchAudio();
      console.log("visitorLocation0: ", visitorLocation0)
      handleAudio(scene.getObjectByName("trembitaSound"))
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
    const image = intersects.find(({ object }) => object.userData.opis);

    console.log("intersects", intersects, "image", image, "intersects.indexOf(image)", intersects.indexOf(image), "intersects.indexOf(Wall)", intersects.indexOf(Wall));

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
  //
  //notes
  /*
  document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (e) => {
    
      // Get target div ID
      var divID = e.target.getAttribute('data-divid');
  
      document.querySelectorAll('div').forEach(div => {
        
        if (div.id === divID) {
          // Adds 'open' class if it doesn't have it, removes if it does
          div.classList.toggle('open');
        } else {
          // Makes sure other divs are hidden
          div.classList.remove('open');
        }
        
      });
      
      // Prevents the default action of the link
      e.preventDefault();
    });
  });
  */

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
    //html body div.sidebar.open ul.nav-list li.text_in_sidebar div#map_in_sidebar.info_sidebar.open
  });

  // open/close sb
  document.querySelector("#btn").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    document.querySelector(".sidebar").classList.toggle("open");
  });

  // info
  document.querySelector("#info-icon").addEventListener("pointerdown", (e) => {
    e.preventDefault();
    console.log("info", e.target.getAttribute("data-divid"));
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
  const keysPressed = [];
  window.addEventListener("keydown", (event) => {
    keysPressed[event.key] = true;
    if (keysPressed["ArrowDown"] || keysPressed["s"]) {
      bkdPressed = true;
    }
    if (keysPressed["ArrowUp"] || keysPressed["w"]) {
      fwdPressed = true;
    }
    if (keysPressed["ArrowRight"] || keysPressed["d"]) {
      rgtPressed = true;
    }
    if (keysPressed["ArrowLeft"] || keysPressed["a"]) {
      lftPressed = true;
    }
    if (keysPressed[" "]) {
      if (visitorIsOnGround) {
        visitorVelocity.y = 20.0;
        visitorIsOnGround = false;
      }
    }
    if (keysPressed["g"]) {
      if (params.canSeeGizmo) {
        control._gizmo.visible = !control._gizmo.visible;
      }
    }
    if (keysPressed["m"]) {
      // control.setMode("translate");
    }
    if (keysPressed["r"]) {
      control.setMode("rotate");
    }
    if (keysPressed["Escape"]) {
      control.reset();
    }
    if (keysPressed["t"]) {
      console.log("width", window.innerWidth, "height", window.innerHeight);

      // is for testing
    }
    clearInterval(intervalId);
  });

  window.addEventListener("keyup", (event) => {
    delete keysPressed[event.key];
    lftPressed = false;
    rgtPressed = false;
    fwdPressed = false;
    bkdPressed = false;
  });
}

// handle audio
const switchAudio = () => {
  const handleSoundPouring = scene.getObjectByName("pouringMilk");
  const playIconImg = document.querySelector("#play-icon img");
  const audioOn = document.querySelector("#audio-on");

  if (handleSoundPouring) {
    if (handleSoundPouring.isPlaying || !params.canSeeGizmo) {
      playIconImg.src = "/icons/audioMuted.png";
      audioOn.style.display = "none";
      handleSoundPouring.pause();
    } else if (!handleSoundPouring.isPlaying && params.canSeeGizmo) {
      handleSoundPouring.play();
      playIconImg.src = "/icons/audioButton.png";
      audioOn.style.display = "block";
    }
  }
};

const handleAudio = (audioToTurn) => {
  const playIconImg = document.querySelector("#play-icon img");
  const audioOn = document.querySelector("#audio-on");

  if (audioToTurn.isPlaying) {
    playIconImg.src = "/icons/audioMuted.png";
    audioOn.style.display = "none";
    audioToTurn.pause();
  } else if (!audioToTurn.isPlaying) {
    audioToTurn.play();
    playIconImg.src = "/icons/audioButton.png";
    audioOn.style.display = "block";
  }
}

// load environment
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
      //console.log("ligthtsto turn", lightsToTurn);
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

// reset visitor
function reset() {
  bgTexture0 = "/textures/xxxbg_puent.jpg";
  visitorVelocity.set(0, 0, 0);

  const target = visitor.position.clone();
  camera.position.sub(controls.target);
  controls.target.copy(target);
  camera.position.add(target);
  controls.update();

  const circleMap = sceneMap.getObjectByName("circleMap");
  if (circleMap) {
    circleMap.position.copy(target);
    circleMap.position.y = 10;
  }
}

// update visitor
async function updateVisitor(delta) {
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
        //console.log("distance", distance);
        const depth = capsuleInfo.radius - distance;
        const direction = capsulePoint.sub(triPoint).normalize();

        tempSegment.start.addScaledVector(direction, depth);
        tempSegment.end.addScaledVector(direction, depth);
      }
    },
  });

  // get the adjusted position of the capsule collider in world space after checking
  // triangle collisions and moving it. capsuleInfo.segment.start is assumed to be
  // the origin of the visitor model.
  const newPosition = tempVector;
  newPosition.copy(tempSegment.start).applyMatrix4(collider.matrixWorld);

  // check how much the collider was moved
  const deltaVector = tempVector2;
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
  camera.position.sub(controls.target);
  controls.target.copy(visitor.position);
  camera.position.add(visitor.position);

  sceneMap.getObjectByName("circleMap").position.copy(visitor.position);
  //sceneMap.getObjectByName("circleMap").position.y = - 2;
  // animateMap();

  // if the visitor has fallen too far below the level reset their position to the start
  if (visitor.position.y < -10) {
    reset();
  }

  // checkin where the visitor is => tutning on/off lights & video/animations & audio & gizmo
  origVec.setFromMatrixPosition(visitor.matrixWorld);
  dirVec.copy(origVec).multiply(new THREE.Vector3(0, 1, 0)).normalize();
  raycasterVisitor.set(origVec, dirVec);
  raycasterVisitor.firstHitOnly = true;

  const intersectVisitorObject = raycasterVisitor
    .intersectObjects(scene.children)
    .find(({ object }) => object.userData.type === "visitorLocation")?.object;

  if (intersectVisitorObject) {
    const lightsToTurnValue = intersectVisitorObject.userData.lightsToTurn;

    if (lightsToTurn && visitorLocation0 !== lightsToTurnValue) {
      console.log("lightsToTurn: ", lightsToTurnValue);

      if (lightsToTurnValue === "lightsDystopia") {
        params.canSeeGizmo = true;
        switchAudio();
      } else {
        params.canSeeGizmo = false;
        switchAudio();
      }

      // AUDIO trembita
      const handleSoundTrembita = scene.getObjectByName("trembitaSound");
      console.log("trembita", handleSoundTrembita);
      if (handleSoundTrembita) {
        if (lightsToTurnValue === "lightsVincenz") {
          console.log("trembitasound", handleSoundTrembita);
          handleAudio(handleSoundTrembita);
        } else {
          handleAudio(handleSoundTrembita);
        }
      }

      for (const el of lightsToTurn) {
        if (el.userData.name === lightsToTurnValue) {
          const userData = el.userData;
          const intersectVisitorUserData = intersectVisitorObject.userData;

          intensityTo = userData.intensity;
          el.intensity = 0;
          el.visible = true;
          visitorLocation0 = lightsToTurnValue;

          if (intersectVisitorUserData.bgTexture !== bgTexture0) {
            intersectVisitorUserData.bgTexture = intersectVisitorUserData.bgTexture || "textures/bg_color.jpg";
            intersectVisitorUserData.bgInt = intersectVisitorUserData.bgInt || 1;

            bgTexture0 = intersectVisitorUserData.bgTexture;

            await bgDissolve(scene.backgroundIntensity, 0);

            const loader = new THREE.TextureLoader();
            const texture = loader.load(
              intersectVisitorUserData.bgTexture,
              () => {
                texture.mapping = THREE.EquirectangularReflectionMapping;
                texture.colorSpace = THREE.SRGBColorSpace;
                scene.background = texture;
                scene.backgroundBlurriness = intersectVisitorUserData.bgBlur;
                bgDissolve(0, intersectVisitorUserData.bgInt);
              }
            );
          }

          lightOn(el, intensityTo);

          if (userData.videoID) {
            const video = document.getElementById(userData.videoID);
            video.play();
          } else {
            const allVideos = document.getElementsByTagName("video");
            const length = allVideos.length;

            for (let i = 0; i < length; i++) {
              allVideos[i].pause();
            }
          }
        } else {
          el.visible = false;
        }
      }

    }
  }

}


// turning chosen light on slowly

//
async function lightOn(el, intensityTo) {
  for (let i = 0; i < intensityTo + 0.07; i = i + 0.07) {
    await waitForMe(15 / intensityTo).catch((error) => console.log('Error:', error));
    el.intensity = i;
    if (!el.visible) {
      i = intensityTo;
    }
  }
}

// transmission of backgrounds, atually only fade them in/out
async function bgDissolve(intensityFrom, intensityTo) {
  const wspo = (intensityFrom > intensityTo) ? 0.01 : -0.01;
  const iTo = Math.abs(intensityFrom - intensityTo);
  const duration = 0.3 / iTo;

  for (let i = 0; i <= iTo; i = i + Math.abs(wspo)) {
    setTimeout(() => {
      intensityFrom -= wspo;
      scene.backgroundIntensity = intensityFrom;
    }, i * duration * 1000);
  }
}

//

function animateMap() {
  animationId = requestAnimationFrame(animateMap);

  rendererMap.render(sceneMap, cameraMap);
}

// }
//

//
function animate() {
  //time *= 0.001;
  stats.update();
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
    collider.visible = params.displayCollider;

    const physicsSteps = params.physicsSteps;

    for (let i = 0; i < physicsSteps; i++) {
      updateVisitor(delta / physicsSteps);
    }
  }

  requestAnimationFrame(animate);
  renderer.render(scene, camera);

  controls.update();
}
