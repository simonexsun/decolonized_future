// Find the latest version by visiting https://cdn.skypack.dev/three.
import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';
import { OBJLoader } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/loaders/MTLLoader.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/controls/OrbitControls.js';

const apiEndpoint = "https://api.openweathermap.org/data/2.5",
  apiKey = "d7238d177a8b8403e96c991b74eb54e1";

function main() {
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({ canvas });

    //camera attributes
    const fov = 45;
    const aspect = 2;  // the canvas default
    const near = 0.1;
    const far = 100;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 10, 20);

    //control attributes
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 5, 0);
    controls.update();

    //background attributes
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('black');

    //sky attributes, must use {}
    {
        const skyColor = 0xB1E1FF;  // light blue
        const groundColor = 0xB97A20;  // brownish orange
        const intensity = 1;
        const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
        scene.add(light);
    }
    
    //lighting attributes, must use {}
    {
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(0, 10, 0);
        light.target.position.set(-5, 0, 0);
        scene.add(light);
        scene.add(light.target);
    }

    //load 3D model files
    const objLoader = new OBJLoader();
    const mtlLoader = new MTLLoader();
    mtlLoader.load('src/nature.vox.mtl', function (materials) {
        materials.preload();
        objLoader.setMaterials(materials);
        objLoader.load('src/nature.vox.obj', function (object) {
            scene.add(object);
        });
    });

    //renderer attributes
    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
        renderer.setSize(width, height, false);
        }
        return needResize;
    }

    function render() {
        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

/**
 * Makes a query against the weather API.
 *
 * @param {string} path - API endpoint path
 * @param {Object} params - additional params beyond the default
 */
async function apiQuery(path, params) {
  // openweatherAPI wants certain special characters (such as commas) NOT URI
  // encoded, hence using encodeURI instead of encodeURIComponent.
  function encodeQueryData(data) {
    return Object.keys(data).map(k => `${k}=${encodeURI(data[k])}`).join("&");
  }
  const defaultParams = {
    lang: "en",
    units: "metric",
    appid: apiKey
  };
  const query = encodeQueryData({ ...params, ...defaultParams });
  let response = await fetch(`${apiEndpoint}/${path}?${query}`);
  let data = await response.json();
  if (!response.ok) {
    throw new Error(data.message);
  }
  return data;
}

async function getWeathers(){
    return Promise.all([
            apiQuery("weather", { q: "beijing, cn" }),
            apiQuery("weather", { q: "new york, ny, us" }),
            apiQuery("weather", { q: "los angeles, ca, us" })
    ]);
}

async function displayWeather() {
    //first get the weather
    try {
        let [bj, nyc, la] = await getWeathers();
        // console.log(bj.weather[0].main);
        updateWeatherUI(bj);
    } catch (error) {
        console.log(`got an error: ${error}`);
    }
}

function updateWeatherUI(city){
    document.getElementById("weather").innerHTML = city.weather[0].main;
}


main();
displayWeather();