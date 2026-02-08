import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { gsap } from "gsap";
import { Octree } from "three/examples/jsm/Addons.js";
import { Capsule } from "three/examples/jsm/Addons.js";

const scene = new THREE.Scene();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const canvas = document.getElementById("experience-canvas");
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

let character = {
  instance: null,
  moveDistance: 3,
  jumpHeight: 1,
  isMoving: false,
  moveDuration: 0.2,
};

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.CineonToneMapping;
renderer.toneMappingExposure = 1.5;

const modalContent = {
  Project_1: {
    title: "Project 1",
    description: "Description of Project 1",
    link: "example.com",
  },
  Project_2: {
    title: "Project 2",
    description: "Description of Project 2",
    link: "example.com",
  },
  Project_3: {
    title: "Project 3",
    description: "Description of Project 3",
    link: "example.com",
  },
};

const modal = document.querySelector(".modal");
const modalTitle = document.querySelector(".modal-title");
const modalProjectDescription = document.querySelector(
  ".modal-project-description",
);
const modalExitButton = document.querySelector(".modal-exit-button");
const modalVisitButton = document.querySelector(".modal-project-visit-button");

function openModal(id) {
  const content = modalContent[id];
  if (content) {
    modalTitle.textContent = content.title;
    modalProjectDescription.textContent = content.description;

    if (content.link) {
      modalVisitButton.href = content.link;
      modalVisitButton.classList.remove("hidden");
    } else {
      modalVisitButton.classList.add("hidden");
    }
    modal.classList.toggle("hidden");
  }
}

function closeModal() {
  modal.classList.toggle("hidden");
}

let intersectedObject = "";
const intersectObjects = [];
const intersectObjectsNames = [
  "Project_1",
  "Project_2",
  "Project_3",
  "Character_1",
  "Character_2",
  "Character_3",
];

const loader = new GLTFLoader();
loader.load(
  "/Portfolio4.glb",
  function (glb) {
    scene.add(glb.scene);
    glb.scene.traverse((child) => {
      if (intersectObjectsNames.includes(child.name)) {
        intersectObjects.push(child);
      }
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }

      if (child.name === "Character_1") {
        character.instance = child;
      }
    });
  },
  undefined,
  function (error) {
    console.error(error);
  },
);

const sun = new THREE.DirectionalLight(0xffffff);
sun.castShadow = true;
sun.position.set(-120, 120, 0);
sun.target.position.set(0, 0, 0);
sun.shadow.mapSize.width = 1024;
sun.shadow.mapSize.height = 1024;
sun.shadow.camera.left = -200;
sun.shadow.camera.right = 200;
sun.shadow.camera.top = 200;
sun.shadow.camera.bottom = -200;
sun.shadow.normalBias = 1;
scene.add(sun);

const shadowHelper = new THREE.CameraHelper(sun.shadow.camera);
scene.add(shadowHelper);

const helper = new THREE.DirectionalLightHelper(sun, 5);
scene.add(helper);

const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);

// const camera = new THREE.PerspectiveCamera(
//   75,
//   sizes.width / sizes.height,
//   0.1,
//   1000,
// );

const aspectRatio = sizes.width / sizes.height;
const camera = new THREE.OrthographicCamera(
  -aspectRatio * 50,
  aspectRatio * 50,
  50,
  -50,
  1,
  1000,
);

// const geometry = new THREE.BoxGeometry();
// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
// const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);

// camera.position.z = 146.5726619438359;
// camera.position.y = 34.95760660669216;
// camera.position.x = 144.27933809714523;

// camera.position.set(146.76801440316095, 88.75443382338976, 217.7521076494094);

camera.rotation.x = -0.784751061798215;
camera.rotation.y = 0.43085571781189347;
camera.rotation.z = 0.3951673597106328;

camera.position.x = 128.93910304616537;
camera.position.y = 86.4682792679389;
camera.position.z = 165.4058143507201;

const controls = new OrbitControls(camera, canvas);
controls.update();
controls.enableDamping = true; // smooth motion
controls.dampingFactor = 0.05;
controls.autoRotate = false;

function onResize() {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  const aspect = sizes.width / sizes.height;
  camera.left = -aspect * 50;
  camera.right = aspect * 50;
  camera.top = 50;
  camera.bottom = -50;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

function onPointerMove(e) {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
}

function onClick() {
  console.log(intersectedObject);
  if (intersectedObject !== "") {
    openModal(intersectedObject);
  }
}

function moveCharacter(targetPosition, targetRotation) {
  character.isMoving = true;

  // let rotationDiff =
  //   (((targetRotation - character.instance.rotation.y) % (2 * Math.PI)) +
  //     2 * Math.PI) %
  //   (2 * Math.PI);
  // if (rotationDiff > Math.PI) {
  //   rotationDiff -= 2 * Math.PI;
  // }
  // targetRotation = character.instance.rotation.y + rotationDiff;

  let rotationDiff =
    ((((targetRotation - character.instance.rotation.y) % (2 * Math.PI)) +
      3 * Math.PI) %
      (2 * Math.PI)) -
    Math.PI;

  let finalRotation = character.instance.rotation.y + rotationDiff;
  const tl = gsap.timeline({ onComplete: () => (character.isMoving = false) });

  tl.to(character.instance.position, {
    x: targetPosition.x,
    z: targetPosition.z,
    duration: character.moveDuration,
    ease: "power1.out",
  });

  tl.to(
    character.instance.rotation,
    {
      y: finalRotation,
      duration: character.moveDuration,
      ease: "power1.out",
    },
    0,
  );

  tl.to(
    character.instance.position,
    {
      y: targetPosition.y + character.jumpHeight,
      duration: character.moveDuration / 2,
      ease: "power1.out",
      yoyo: true,
      repeat: 1,
    },
    0,
  );
}

function onKeyDown(e) {
  if (character.isMoving) return;

  const targetPosition = new THREE.Vector3().copy(character.instance.position);
  let targetRotation = "";

  switch (e.key.toLowerCase()) {
    case "w":
    case "arrowup":
      targetPosition.z -= character.moveDistance;
      targetRotation = 0;
      break;
    case "s":
    case "arrowdown":
      targetPosition.z += character.moveDistance;
      targetRotation = Math.PI;
      break;
    case "a":
    case "arrowleft":
      targetPosition.x -= character.moveDistance;
      targetRotation = -Math.PI / 2;
      break;
    case "d":
    case "arrowright":
      targetPosition.x += character.moveDistance;
      targetRotation = Math.PI / 2;
      break;
    default:
      return;
  }
  moveCharacter(targetPosition, targetRotation);
}

modalExitButton.addEventListener("click", closeModal);
window.addEventListener("resize", onResize);
window.addEventListener("click", onClick);
window.addEventListener("pointermove", onPointerMove);
window.addEventListener("keydown", onKeyDown);

function animate() {
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(intersectObjects, true);

  if (intersects.length > 0) {
    document.body.style.cursor = "pointer";
  } else {
    document.body.style.cursor = "default";
    intersectedObject = "";
  }

  for (let i = 0; i < intersects.length; i++) {
    // console.log(intersects[0].object.parent.name);
    intersectedObject = intersects[0].object.parent.name;
  }
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
