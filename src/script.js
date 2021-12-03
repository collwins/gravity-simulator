import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "dat.gui";
import { Vector3 } from "three";

class Planet {
  constructor(sphere, mass, orbVel) {
    this.sphere = sphere;
    this.mass = mass;
    this.orbVel = orbVel;
  }
}

//POV Flags
var earthPovFlag = false;
var sunPovFlag = false;

// Loading
const textureLoader = new THREE.TextureLoader();
const earthNormalTexture = textureLoader.load("/textures/earth.png");
const earthMapTexture = textureLoader.load("/textures/earth.jpg");
const sunTexture = textureLoader.load("/textures/sun.jpg");

// Debug
const gui = new dat.GUI();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Objects
const geometry = new THREE.SphereBufferGeometry(1, 32, 32);
const geometry2 = new THREE.SphereBufferGeometry(10, 32, 32); //sun is 109 times larger than earth in radius

// Materials

const material = new THREE.MeshLambertMaterial();
material.roughness = 0.2;
material.map = earthMapTexture;
material.normalMap = earthNormalTexture;

const material2 = new THREE.MeshLambertMaterial();
material2.map = sunTexture;

// Mesh
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);
sphere.position.x = 24.959787; //scaled down by 10^7 kilometers

const sphere2 = new THREE.Mesh(geometry2, material2);
scene.add(sphere2);

//Planet objects
var vel = new Vector3(0, 0, -0.5); //counter-clockwise orbit from a top-down perspective
var earth = new Planet(sphere, 5.9724, vel); //orbital velocity is about 30 km/h; I scaled it down to 0.5 for a better orbit
var sun = new Planet(sphere2, 1988500); // mass scaled down by 10^24 kilograms

var earthControl = gui.addFolder("Earth");
var sunControl = gui.addFolder("Sun");

earthControl.add(earth, "mass", 0, 20, 0.5);
sunControl.add(sun, "mass", 0, 9999999, 10);

// Lights
const ambLight = new THREE.AmbientLight(0xffffff);
scene.add(ambLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.x = 0;
camera.position.y = 40;
camera.position.z = 0;
scene.add(camera);

const pt = new THREE.Vector3(20, 0, 0);
camera.lookAt(pt);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

//Buttons
document.getElementById("earth_pov").addEventListener("click", function () {
  if (earthPovFlag) earthPovFlag = false;
  else earthPovFlag = true;
});

document.getElementById("sun_pov").addEventListener("click", function () {
  if (sunPovFlag) sunPovFlag = false;
  else sunPovFlag = true;
});

//document.body.appendChild(renderer.domElement);

//Gravity functions

//calculates the gravitational force between two planets.
function gravitationalForce(planet1, planet2) {
  let g = 6.67408 * 10 ** -10; //gravitational constant scaled up by 10
  let d2 = Math.sqrt(
    //distance between the two planets in x and z coordinates
    (planet2.sphere.position.x - planet1.sphere.position.x) ** 2 +
      (planet2.sphere.position.z - planet1.sphere.position.z) ** 2
  );
  return g * ((planet1.mass * planet2.mass) / d2); //gravitational force
}

//calculates the direction vector between the positions of two planets.
function getDirection(planet1, planet2) {
  return planet2.sphere.position.sub(planet1.sphere.position);
}

function updateOrbit(force, direction, planet) {
  planet.orbVel = planet.orbVel.add(direction.multiplyScalar(force));
  let tempPos = planet.sphere.position.clone();
  tempPos = tempPos.add(planet.orbVel);
  planet.sphere.position.copy(tempPos);
}

const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update objects
  sphere.rotation.y = 0.46 * elapsedTime; //the earth rotates at 460 meters per second
  sphere2.rotation.y = 1.997 * elapsedTime; //the sun rotates at 1997 meters per second

  let force = gravitationalForce(earth, sun);
  let dir = getDirection(earth, sun);
  updateOrbit(force, dir, earth);
  camera.lookAt(
    sphere.position.x - 1,
    sphere.position.y,
    sphere.position.z - 10
  );

  if (earthPovFlag) {
    let tempPos = sphere.position.clone();
    camera.position.copy(tempPos);
  }

  if (sunPovFlag) {
    let tempPos = sphere2.position.clone();
    camera.position.copy(tempPos);
    camera.lookAt(sphere.position);
  }

  // Update Orbital Controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
