// Find the latest version by visiting https://cdn.skypack.dev/three.
import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';
import { OBJLoader } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/loaders/MTLLoader.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/controls/OrbitControls.js';

const apiEndpoint = "https://api.openweathermap.org/data/2.5",
  apiKey = "b8f12ff8ba7bba252fde6e9cd5003e49";

async function main() {
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({ canvas });
    let ticker = 0;

    //camera attributes
    const fov = 45;
    const aspect = 2;  // the canvas default
    const near = 0.1;
    const far = 100;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 10, 15);

    //control attributes
    const controls = new OrbitControls(camera, canvas);
    // controls.target.set(0, 3, 0);
    // controls.update();

    //background attributes
    const scene = new THREE.Scene();
    let backgroundColor = 0x58c0e0;
    camera.lookAt( scene.position );

    //hemisphere light attributes
    const skyColor = 0xB1E1FF;  // light blue
    const groundColor = 0xB97A20;  // brownish orange
    const hemisphereIntensity = 0;
    const hemisphereLight = new THREE.HemisphereLight(skyColor, groundColor, hemisphereIntensity);
    scene.add(hemisphereLight);

    // //spot light attributes
    // let lightColor = 0xFFFFFF;
    // let intensity = 2;
    // const distance = 15;
    // const angle = 100;
    // const penumbra = 1; 

    // //spot light over mountain-LA
    // let spotLight = new THREE.SpotLight(lightColor, intensity, distance, angle, penumbra);
    // // let spotLight = new THREE.SpotLight(lightColor, intensity);
    // spotLight.position.set(5, 8, 0);
    // spotLight.target.position.set(0, 5, -1);
    // // spotLight.castShadow = true;
    // scene.add(spotLight);
    // scene.add(spotLight.target);

    // //spot light over farm-BK
    // let spotLight1 = new THREE.SpotLight(lightColor, intensity, distance, angle, penumbra);
    // spotLight1.position.set(5, -6, 0);
    // spotLight1.target.position.set(1, 1, -2);
    // scene.add(spotLight1);
    // scene.add(spotLight1.target);

    // //spot light over city-BJ
    // let spotLight2 = new THREE.SpotLight(lightColor, intensity, distance, angle, penumbra);
    // spotLight2.position.set(-4, -6, 7);
    // spotLight2.target.position.set(2, 1, -4);
    // scene.add(spotLight2);
    // scene.add(spotLight2.target);

    // //spot light over ?-LES
    // let spotLight3 = new THREE.SpotLight(lightColor, 3, distance, angle, penumbra);
    // spotLight3.position.set(-10, -5, -3);
    // spotLight3.target.position.set(15, 10, 10);
    // scene.add(spotLight3);
    // scene.add(spotLight3.target);

    // //lighting helper
    // // const helper = new THREE.SpotLightHelper(spotLight3);
    // // scene.add(helper);

    // function updateLight() {
    //     spotLight3.target.updateMatrixWorld();
    //     // helper.update();
    // }
    // updateLight();

    //load 3D model files
    const objLoader = new GLTFLoader();
    // const mtlLoader = new MTLLoader();
    // mtlLoader.load('src/tetrahedron.mtl', function (materials) {
    //     materials.preload();
    //     objLoader.setMaterials(materials);
    //     objLoader.load('src/tetrahedron.obj', function (object) {
    //         scene.add(object);
    //     });
    // });
    objLoader.load('src/tetrahedron1.gltf', function (object) {
        scene.add(object.scene);
        object.animations; // Array<THREE.AnimationClip>
		object.scene; // THREE.Group
		object.scenes; // Array<THREE.Group>
		object.cameras; // Array<THREE.Camera>
		object.asset; // Object
    }, undefined, function ( error ) {
	    console.error( `got an error: ${error}`);
    });

    // get weather data
    let [BJ, BK, LA, LES] = [0,0,0]; //array of weather data from different cities
    try {
        [BJ, BK, LA, LES] = await requstWeathers();
        console.log("got weather");
    } catch (error) {
        console.log(`got an error: ${error}`);
        // console.log(error);
    } 

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
        // scene.remove(spotLight);

    controls.addEventListener('change', () => {
        // ticker++;
        // if (ticker % 30 == 0){
            let city;
            if(controls.getPolarAngle() > 0 && controls.getPolarAngle() < 2.2){
                city = LA;
                // update weather parameters
                if (city.weather[0].main == "Clouds"){
                    backgroundColor = 0x84959c;
                    // spotLight.color.setHex( 0xffffff );
                    // spotLight.intensity = 2;
                }else if (city.weather[0].main == "Rain"){
                    backgroundColor = 0x5e5e5e;
                    // spotLight.color.setHex( 0xffffff );
                    // spotLight.intensity = 1;
                }else if(city.weather[0].main == "Clear"){
                    backgroundColor = 0x92b1d6;
                    // spotLight.color.setHex( 0xc7e7ff );
                    // spotLight.intensity = 3;
                }else if (city.weather[0].main == "Haze"){
                    backgroundColor = 0xb3ad98;
                    // spotLight1.color.setHex( 0xffe6c4 );
                    // spotLight1.intensity = 2;
                }
                //update weather interface
                scene.background = new THREE.Color(backgroundColor);
                // updateLight();
                console.log( city.name + " " + city.weather[0].main );            
            }
            else if (controls.getPolarAngle() > 2.2 && controls.getPolarAngle() < 3.15 && controls.getAzimuthalAngle() > 1 && controls.getAzimuthalAngle() < 3.15){
                city = BK;
                // update weather parameters
                if (city.weather[0].main == "Clouds"){
                    backgroundColor = 0x84959c;
                    // spotLight1.color.setHex( 0xffffff );
                    // spotLight1.intensity = 2;
                }else if (city.weather[0].main == "Rain"){
                    backgroundColor = 0x5e5e5e;
                    // spotLight1.color.setHex( 0xffffff );
                    // spotLight1.intensity = 1;
                }else if(city.weather[0].main == "Clear"){
                    backgroundColor = 0x92b1d6;
                    // spotLight1.color.setHex( 0xc7e7ff );
                    // spotLight1.intensity = 3;
                }else if (city.weather[0].main == "Haze"){
                    backgroundColor = 0xb3ad98;
                    // spotLight1.color.setHex( 0xffe6c4 );
                    // spotLight1.intensity = 2;
                }
                //update weather interface
                scene.background = new THREE.Color(backgroundColor);
                // updateLight();
                console.log( city.name + " " + city.weather[0].main );            
            }
            else if (controls.getPolarAngle() > 2.2 && controls.getPolarAngle() < 3.15 && controls.getAzimuthalAngle() > -1 && controls.getAzimuthalAngle() < 1){
                city = BJ;
                // update weather parameters
                if (city.weather[0].main == "Clouds"){
                    backgroundColor = 0x84959c;
                    // spotLight2.color.setHex( 0xffffff );
                    // spotLight2.intensity = 2;
                }else if (city.weather[0].main == "Rain"){
                    backgroundColor = 0x5e5e5e;
                    // spotLight2.color.setHex( 0xffffff );
                    // spotLight2.intensity = 1;
                }else if(city.weather[0].main == "Clear"){
                    backgroundColor = 0x92b1d6;
                    // spotLight2.color.setHex( 0xc7e7ff );
                    // spotLight2.intensity = 3;
                }else if (city.weather[0].main == "Haze"){
                    backgroundColor = 0xb3ad98;
                    // spotLight2.color.setHex( 0xffe6c4 );
                    // spotLight2.intensity = 2;
                }
                //update weather interface
                scene.background = new THREE.Color(backgroundColor);
                // updateLight();
                console.log( city.name + " " + city.weather[0].main );
            }
            else if (controls.getPolarAngle() > 0.6 && controls.getPolarAngle() < 3.15 && controls.getAzimuthalAngle() > -3.15 && controls.getAzimuthalAngle() < 1){
                city = LES;
                // update weather parameters
                if (city.weather[0].main == "Clouds"){
                    backgroundColor = 0x84959c;
                    // spotLight3.color.setHex( 0xffffff );
                    // spotLight3.intensity = 2;
                }else if (city.weather[0].main == "Rain"){
                    backgroundColor = 0x5e5e5e;
                    // spotLight3.color.setHex( 0xffffff );
                    // spotLight3.intensity = 1;
                }else if(city.weather[0].main == "Clear"){
                    backgroundColor = 0x92b1d6;
                    // spotLight3.color.setHex( 0xc7e7ff );
                    // spotLight3.intensity = 3;
                }else if (city.weather[0].main == "Haze"){
                    backgroundColor = 0xb3ad98;
                    // spotLight3.color.setHex( 0xffe6c4 );
                    // spotLight3.intensity = 2;
                }
                //update weather interface
                scene.background = new THREE.Color(backgroundColor);
                // updateLight();
                console.log( city.name + " " + city.weather[0].main );
            }
        // }
    });

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

async function requstWeathers(){
    return Promise.all([
        apiQuery("weather", { q: "beijing, cn" }), //BJ
        apiQuery("weather", { q: "Brooklyn, ny, us" }), //BK
        apiQuery("weather", { q: "los angeles, ca, us" }), //LA
        apiQuery("weather", { q: "Manhattan, ny, us" }) //LES
    ]);
}


main();

