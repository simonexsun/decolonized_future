// Find the latest version by visiting https://cdn.skypack.dev/three.
import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';
import { OBJLoader } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/loaders/MTLLoader.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/controls/OrbitControls.js';

const apiEndpoint = "https://api.openweathermap.org/data/2.5",
  apiKey = "b8f12ff8ba7bba252fde6e9cd5003e49";

async function main() {
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true , antialias: true });
    let ticker = 0;
    let rain;

    //camera attributes
    const fov = 45;
    const aspect = 2;  // the canvas default
    const near = 0.1;
    const far = 100;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 10, 15);

    //control attributes
    const controls = new OrbitControls(camera, canvas);
    controls.update();
	controls.enablePan = false;
	controls.enableDamping = true;

    //background attributes
    const scene = new THREE.Scene();
    let backgroundColor = 'hsl(194, 69%, 61%)'; //sky blue
    camera.lookAt( scene.position );
    scene.background = new THREE.Color(backgroundColor);

    //hemisphere light attributes
    const skyColor = 0xB1E1FF;  // light blue
    const groundColor = 0xB97A20;  // brownish orange
    const hemisphereIntensity = 0.5;
    const hemisphereLight = new THREE.HemisphereLight(skyColor, groundColor, hemisphereIntensity);
    scene.add(hemisphereLight);

    //spot light attributes
    let lightColor = 0xFFFFFF;
    let intensity = 2;
    const distance = 15;
    const angle = 100;
    const penumbra = 1; 

    //spot light over mountain-LA
    let spotLight = new THREE.SpotLight(lightColor, intensity, distance, angle, penumbra);
    spotLight.position.set(3, 7, 0);
    spotLight.target.position.set(-1, -1, -1);
    // spotLight.castShadow = true;
    scene.add(spotLight);
    scene.add(spotLight.target);

    //spot light over farm-SZ
    let spotLight1 = new THREE.SpotLight(lightColor, intensity, distance, angle, penumbra);
    spotLight1.position.set(2, -13, 0);
    spotLight1.target.position.set(2, -1, 0);
    scene.add(spotLight1);
    scene.add(spotLight1.target);

    //spot light over city-BK
    let spotLight2 = new THREE.SpotLight(lightColor, intensity, distance, angle, penumbra);
    spotLight2.position.set(-4, -6, 7);
    spotLight2.target.position.set(2, 1, -4);
    scene.add(spotLight2);
    scene.add(spotLight2.target);

    //spot light over water-LES
    let spotLight3 = new THREE.SpotLight(lightColor, intensity, distance, angle, penumbra);
    spotLight3.position.set(-8, -1, -5);
    spotLight3.target.position.set(17, -10, 10);
    scene.add(spotLight3);
    scene.add(spotLight3.target);

    //lighting helper
    // const helper = new THREE.SpotLightHelper(spotLight);
    // scene.add(helper);

    function updateLight() {
        spotLight3.target.updateMatrixWorld();
        // helper.update();
    }
    updateLight();

    //load 3D model files
    const objLoader = new OBJLoader();
    const mtlLoader = new MTLLoader();
    mtlLoader.load('src/tetrahedron.mtl', function (materials) { //exported files and blender file must be stored in "src"
        materials.preload();
        objLoader.setMaterials(materials);
        objLoader.load('src/tetrahedron.obj', function (object) {
            scene.add(object);
        });
    });

    // get weather data
    let [SZ, BK, LA, LES] = [0,0,0]; //array of weather data from different cities
    try {
        [SZ, BK, LA, LES] = await requstWeathers();
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

    // create the particle variables
	let particleCount = 2000,
	    particleSystem = new THREE.BufferGeometry(),
        material = new THREE.PointsMaterial( { color: 0x000000, size: 0.2 } );
    const vertices = [];

	// create the individual particles
	for(let p = 0; p < particleCount; p++) {
	
		// create a particle with random position values, -25 -> 25,
        vertices.push( 
		    Math.random() * 50 - 25,    //x
		    Math.random() * 50 - 25,    //y
		    Math.random() * 50 - 25     //z
        );		
	}
    
    // add vertices position it to the geometry
    particleSystem.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );

    // create the particle system
	let rainDrop = new THREE.Points( particleSystem, material );
	
	// add it to the scene
    scene.add(rainDrop);

    function rainVariation() {
            // get rainDrop current position
            let positionAttribute = particleSystem.getAttribute( 'position' );

            for ( let i = 0; i < positionAttribute.count; i ++ ) {
                //give rainDrop current position to a vertex
                let vertex = new THREE.Vector3();
                vertex.fromBufferAttribute( positionAttribute, i );

                // change rainDrop y position when it's out of the frame
                vertex.y -= 0.3;
                if (vertex.y < -25) {
                    vertex.y = Math.random() * 50 - 25;
                }
                // apply new position to rainDrop
                positionAttribute.setXYZ( i, vertex.x, vertex.y, vertex.z );
            }
        if(rain){ 
            //update rainDrop 
            positionAttribute.needsUpdate = true;
        }
    }
	
    // animation loop
    function render() {
        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }
		
        rainVariation();
        controls.update();
        renderer.render(scene, camera);

        // set up the next call
        requestAnimationFrame(render);
    }

    //update weathre simulation
    controls.addEventListener('change', () => {
        // ticker++;
        // if (ticker % 30 == 0){
            let city;
            if(controls.getPolarAngle() > 0 && controls.getPolarAngle() < 2.2){
                city = LA;
                // update weather parameters
                // check https://openweathermap.org/weather-conditions for full weather conditions
                rain = false;
                if (city.weather[0].main == "Clouds" || city.weather[0].main == "Thunderstorm"){
                    backgroundColor = 'hsl(194, 11%, 65%)';
                    spotLight.color.setHex( 0xffffff );
                    spotLight.intensity = 2;
                }else if (city.weather[0].main == "Rain" || city.weather[0].main == "Snow" || city.weather[0].main == "Drizzle"){
                    backgroundColor = 'hsl(194, 0%, 37%)';
                    spotLight.color.setHex( 0xffffff );
                    spotLight.intensity = 1;
                    rain = true;
                }else if(city.weather[0].main == "Clear"){
                    backgroundColor = 'hsl(194, 69%, 61%)';
                    spotLight.color.setHex( 0xffebc7 );
                    spotLight.intensity = 3;
                }else if (city.weather[0].icon == "50d"){ // Atmosphere including mist, haze, fog, etc.
                    backgroundColor = 'hsl(47, 15%, 65%)';
                    spotLight1.color.setHex( 0xffe6c4 );
                    spotLight1.intensity = 2;
                }
                //update weather interface
                scene.background = new THREE.Color(backgroundColor);
                updateLight();
                console.log( city.name + " is currently " + city.weather[0].main + ", light intensity: " + spotLight.intensity);            
            }
            else if (controls.getPolarAngle() > 2.2 && controls.getPolarAngle() < 3.15 && controls.getAzimuthalAngle() > 1 && controls.getAzimuthalAngle() < 3.15){
                city = SZ;
                // update weather parameters
                rain = false;
                if (city.weather[0].main == "Clouds"){
                    backgroundColor = 'hsl(194, 11%, 65%)';
                    spotLight1.color.setHex( 0xffffff );
                    spotLight1.intensity = 2;
                }else if (city.weather[0].main == "Rain"){
                    backgroundColor = 'hsl(194, 0%, 37%)';
                    spotLight1.color.setHex( 0xffffff );
                    spotLight1.intensity = 1;
                    rain = true;
                }else if(city.weather[0].main == "Clear"){
                    backgroundColor = 'hsl(194, 69%, 61%)';
                    spotLight1.color.setHex( 0xffebc7 );
                    spotLight1.intensity = 3;
                }else if (city.weather[0].main == "Haze"){
                    backgroundColor = 'hsl(47, 15%, 65%)';
                    spotLight1.color.setHex( 0xffe6c4 );
                    spotLight1.intensity = 2;
                }
                //update weather interface
                scene.background = new THREE.Color(backgroundColor);
                updateLight();
                console.log( city.name + " is currently " + city.weather[0].main + ", light intensity: " + spotLight1.intensity);            
            }
            else if (controls.getPolarAngle() > 2.2 && controls.getPolarAngle() < 3.15 && controls.getAzimuthalAngle() > -1 && controls.getAzimuthalAngle() < 1){
                city = BK;
                // update weather parameters
                rain = false;
                if (city.weather[0].main == "Clouds"){
                    backgroundColor = 'hsl(194, 11%, 65%)';
                    spotLight2.color.setHex( 0xffffff );
                    spotLight2.intensity = 2;
                }else if (city.weather[0].main == "Rain"){
                    backgroundColor = 'hsl(194, 0%, 37%)';
                    spotLight2.color.setHex( 0xffffff );
                    spotLight2.intensity = 1;
                    rain = true;
                }else if(city.weather[0].main == "Clear"){
                    backgroundColor = 'hsl(194, 69%, 61%)';
                    spotLight2.color.setHex( 0xffebc7 );
                    spotLight2.intensity = 3;
                }else if (city.weather[0].main == "Haze"){
                    backgroundColor = 'hsl(47, 15%, 65%)';
                    spotLight2.color.setHex( 0xffe6c4 );
                    spotLight2.intensity = 2;
                }
                //update weather interface
                scene.background = new THREE.Color(backgroundColor);
                updateLight();
                console.log( city.name + " is currently " + city.weather[0].main + ", light intensity: " + spotLight2.intensity + rain);
            }
            else if (controls.getPolarAngle() > 0.6 && controls.getPolarAngle() < 3.15 && controls.getAzimuthalAngle() > -3.15 && controls.getAzimuthalAngle() < 1){
                city = LES;
                // update weather parameters
                rain = false;
                if (city.weather[0].main == "Clouds"){
                    backgroundColor = 'hsl(194, 11%, 65%)';
                    spotLight3.color.setHex( 0xffffff );
                    spotLight3.intensity = 2;
                }else if (city.weather[0].main == "Rain"){
                    backgroundColor = 'hsl(194, 0%, 37%)';
                    spotLight3.color.setHex( 0xffffff );
                    spotLight3.intensity = 1;
                    rain = true;
                }else if(city.weather[0].main == "Clear"){
                    backgroundColor = 'hsl(194, 69%, 61%)';
                    spotLight3.color.setHex( 0xffebc7 );
                    spotLight3.intensity = 3;
                }else if (city.weather[0].main == "Haze"){
                    backgroundColor = 'hsl(47, 15%, 65%)';
                    spotLight3.color.setHex( 0xffe6c4 );
                    spotLight3.intensity = 2;
                }
                //update weather interface
                scene.background = new THREE.Color(backgroundColor);
                updateLight();
                console.log( city.name + " is currently " + city.weather[0].main + ", light intensity: " + spotLight3.intensity);
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
        apiQuery("weather", { q: "Shenzhen, cn" }), //SZ
        apiQuery("weather", { q: "Brooklyn, ny, us" }), //BK
        apiQuery("weather", { q: "los angeles, ca, us" }), //LA
        apiQuery("weather", { q: "Manhattan, ny, us" }) //LES
    ]);
}


main();

