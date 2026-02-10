import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { gsap } from "gsap";
import { Octree } from "three/addons/math/Octree.js";
import { Capsule } from "three/addons/math/Capsule.js";

const scene = new THREE.Scene();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const canvas = document.getElementById("experience-canvas");
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const themeToggleButton = document.querySelector(".theme-mode-toggle-button");
const firstIcon = document.querySelector(".first-icon");
const secondIcon = document.querySelector(".second-icon");

//Physics
const GRAVITY = 30;
const CAPSULE_RADIUS = 0.35;
const CAPSULE_HEIGHT = 1;
const JUMP_HEIGHT = 10;
const MOVE_SPEED = 8;

let character = {
  instance: null,
  isMoving: false,
  spawnPoint: new THREE.Vector3(),
};
let targetRotation = -Math.PI / 2;

const colliderOctree = new Octree();
const playerCollider = new Capsule(
  new THREE.Vector3(0, CAPSULE_RADIUS, 0),
  new THREE.Vector3(0, CAPSULE_HEIGHT, 0),
  CAPSULE_RADIUS,
);

let playerVelocity = new THREE.Vector3();
let playerOnGround = false;

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

//Modal
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

// INFO MODAL
const infoButton = document.querySelector(".info-button");
const infoModal = document.querySelector(".info-modal");
const infoModalExit = document.querySelector(".info-modal-exit-button");
const infoModalDescription = document.querySelector(
  ".info-modal-project-description",
);
function openInfoModal() {
  infoModal.classList.remove("hidden");

  document.body.style.overflow = "hidden"; // prevent scroll
}

function closeInfoModal() {
  infoModal.classList.add("hidden");
  document.body.style.overflow = "";
}

infoModalExit.addEventListener("click", closeInfoModal);
infoButton.addEventListener("click", openInfoModal);

// CLICK OUTSIDE TO CLOSE
infoModal.addEventListener("click", (e) => {
  if (e.target === infoModal) {
    closeInfoModal();
  }
});

// ESC KEY
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !infoModal.classList.contains("hidden")) {
    closeInfoModal();
  }
});

// OBJECT LOAD
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
        character.spawnPoint.copy(child.position);
        character.instance = child;
        playerCollider.start
          .copy(child.position)
          .add(new THREE.Vector3(0, CAPSULE_RADIUS, 0));
        playerCollider.end
          .copy(child.position)
          .add(new THREE.Vector3(0, CAPSULE_HEIGHT, 0));
      }

      if (child.name === "Ground_Collider") {
        colliderOctree.fromGraphNode(child);
        child.visible = false;
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

const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);
scene.background = new THREE.Color(0x9fdf49);

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

const cameraOffset = new THREE.Vector3(
  128.93910304616537,
  86.4682792679389,
  165.4058143507201,
);
camera.zoom = 1.5;
camera.updateProjectionMatrix();

// const controls = new OrbitControls(camera, canvas);
// controls.update();
// controls.enableDamping = true; // smooth motion
// controls.dampingFactor = 0.05;
// controls.autoRotate = false;

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
  // console.log(intersectedObject);
  if (intersectedObject !== "") {
    openModal(intersectedObject);
  }
}

function playerCollisions() {
  const result = colliderOctree.capsuleIntersect(playerCollider);
  playerOnGround = false;
  if (result) {
    playerOnGround = result.normal.y > 0;
    playerCollider.translate(result.normal.multiplyScalar(result.depth));
    if (playerOnGround) {
      character.isMoving = false;
      playerVelocity.x = 0;
      playerVelocity.z = 0;
    }
  }
}

function respawnPlayer() {
  character.instance.position.copy(character.spawnPoint);
  playerCollider.start
    .copy(character.spawnPoint)
    .add(new THREE.Vector3(0, CAPSULE_RADIUS, 0));
  playerCollider.end
    .copy(character.spawnPoint)
    .add(new THREE.Vector3(0, CAPSULE_HEIGHT, 0));
  playerVelocity.set(0, 0, 0);
  character.isMoving = false;
}

function updatePlayer() {
  if (!infoModal.classList.contains("hidden")) return;

  if (!character.instance) return;

  if (character.instance.position.y < -20) {
    respawnPlayer();
    return;
  }
  if (!playerOnGround) {
    playerVelocity.y -= GRAVITY * 0.035;
  }
  playerCollider.translate(playerVelocity.clone().multiplyScalar(0.035));
  playerCollisions();
  character.instance.position.copy(playerCollider.start);
  character.instance.position.y -= CAPSULE_RADIUS;

  let rotationDiff =
    ((((targetRotation - character.instance.rotation.y) % (2 * Math.PI)) +
      3 * Math.PI) %
      (2 * Math.PI)) -
    Math.PI;

  let finalRotation = character.instance.rotation.y + rotationDiff;

  character.instance.rotation.y = THREE.MathUtils.lerp(
    character.instance.rotation.y,
    finalRotation,
    0.4,
  );
}

function onKeyDown(e) {
  if (e.key.toLowerCase() === "r") {
    respawnPlayer();
    return;
  }

  if (character.isMoving) return;

  switch (e.key.toLowerCase()) {
    case "w":
    case "arrowup":
      playerVelocity.z -= MOVE_SPEED;
      targetRotation = 0;
      break;
    case "s":
    case "arrowdown":
      playerVelocity.z += MOVE_SPEED;
      targetRotation = Math.PI;
      break;
    case "a":
    case "arrowleft":
      playerVelocity.x -= MOVE_SPEED;
      targetRotation = -Math.PI / 2;
      break;
    case "d":
    case "arrowright":
      playerVelocity.x += MOVE_SPEED;
      targetRotation = Math.PI / 2;
      break;
    case " ":
      if (playerOnGround) {
        playerVelocity.y = JUMP_HEIGHT;
      }
      break;
    default:
      return;
  }
  playerVelocity.y = JUMP_HEIGHT;
  character.isMoving = true;
}

//THEME
function toggleTheme() {
  const isDarkTheme = document.body.classList.contains("dark-theme");
  document.body.classList.toggle("dark-theme");
  document.body.classList.toggle("light-theme");

  if (firstIcon.style.display === "none") {
    firstIcon.style.display = "block";
    secondIcon.style.display = "none";
  } else {
    firstIcon.style.display = "none";
    secondIcon.style.display = "block";
  }

  gsap.to(light.color, {
    r: isDarkTheme ? 1.0 : 0.25,
    g: isDarkTheme ? 1.0 : 0.31,
    b: isDarkTheme ? 1.0 : 0.78,
    duration: 1,
    ease: "power2.inOut",
  });

  gsap.to(light, {
    intensity: isDarkTheme ? 0.8 : 0.9,
    duration: 1,
    ease: "power2.inOut",
  });

  gsap.to(sun, {
    intensity: isDarkTheme ? 1 : 0.8,
    duration: 1,
    ease: "power2.inOut",
  });

  gsap.to(sun.color, {
    r: isDarkTheme ? 1.0 : 0.25,
    g: isDarkTheme ? 1.0 : 0.41,
    b: isDarkTheme ? 1.0 : 0.88,
    duration: 1,
    ease: "power2.inOut",
  });
}

themeToggleButton.addEventListener("click", toggleTheme);
modalExitButton.addEventListener("click", closeModal);
window.addEventListener("resize", onResize);
window.addEventListener("click", onClick);
window.addEventListener("pointermove", onPointerMove);
window.addEventListener("keydown", onKeyDown);

// Mobile controls
const mobileControls = {
  up: document.querySelector(".mobile-control.up-arrow"),
  left: document.querySelector(".mobile-control.left-arrow"),
  right: document.querySelector(".mobile-control.right-arrow"),
  down: document.querySelector(".mobile-control.down-arrow"),
  reset: document.querySelector(".mobile-control.reset-button"),
};

const pressedButtons = {
  up: false,
  down: false,
  left: false,
  right: false,
  reset: false,
};

Object.entries(mobileControls).forEach(([direction, element]) => {
  if (!element) return;

  const press = (e) => {
    e.preventDefault();
    pressedButtons[direction] = true;
  };

  const release = (e) => {
    e.preventDefault();
    pressedButtons[direction] = false;
  };

  element.addEventListener("touchstart", press, { passive: false });
  element.addEventListener("touchend", release);
  element.addEventListener("touchcancel", release);

  element.addEventListener("mousedown", press);
  element.addEventListener("mouseup", release);
  element.addEventListener("mouseleave", release);
});

function applyMobileInput() {
  if (!infoModal.classList.contains("hidden")) return;

  if (!character.instance) return;
  if (character.isMoving) return;

  let moved = false;

  if (pressedButtons.up) {
    playerVelocity.z = -MOVE_SPEED;
    targetRotation = 0;
    moved = true;
  }

  if (pressedButtons.down) {
    playerVelocity.z = MOVE_SPEED;
    targetRotation = Math.PI;
    moved = true;
  }

  if (pressedButtons.left) {
    playerVelocity.x = -MOVE_SPEED;
    targetRotation = -Math.PI / 2;
    moved = true;
  }

  if (pressedButtons.right) {
    playerVelocity.x = MOVE_SPEED;
    targetRotation = Math.PI / 2;
    moved = true;
  }
  if (pressedButtons.reset) {
    respawnPlayer();
    return;
  }

  if (moved) {
    playerVelocity.y = JUMP_HEIGHT;
    character.isMoving = true;
  }
}

function animate() {
  applyMobileInput();
  updatePlayer();
  if (character.instance) {
    const targetCameraPosition = new THREE.Vector3(
      character.instance.position.x + cameraOffset.x,
      cameraOffset.y,
      character.instance.position.z + cameraOffset.z,
    );
    camera.position.copy(targetCameraPosition);
    camera.lookAt(
      character.instance.position.x,
      camera.position.y - 86.4682792679389,
      character.instance.position.z,
    );
  }

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
