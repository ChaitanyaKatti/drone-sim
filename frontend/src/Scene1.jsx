import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { button, useControls } from "leva";
import axios from "axios";

// call python fastapi backend and get position vs time data
const getDataPromise = async () => {
	const response = await axios.get("http://localhost:8000/position_data").catch((error) => {
		console.error("There was an error!", error);
	});

	return response.data; 
};

const Scene1 = () => {
	const mountRef = useRef();
	const userControlRef = useRef(1);
	
	var dataPromise = getDataPromise();
	const [{ timeScale, CaseCam }] = useControls(() => ({
		timeScale: { value: 0.05, min: 0, max: 1, step: 0.01, label: "Time Scale"},
		Reload: button(() => {
			dataPromise = getDataPromise();
			// Show a alert inside the side panle if data is not loaded
			if (dataPromise === undefined) {
				alert("Data not loaded, try again");
			}
		}),
		CaseCam: {value: false, label: "Camera Case"},
	}));
	userControlRef.current = {timeScale, CaseCam};

	useEffect(() => {
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.05,
			500
		);
		const renderer = new THREE.WebGLRenderer();
		renderer.physicallyCorrectLights = true;
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		var mixer;
		mountRef.current.appendChild(renderer.domElement);

		//Create a Directional and turn on shadows for the light
		const lightDrone = new THREE.DirectionalLight(0xffffff, 2);
		lightDrone.position.set(1, 1, 1);
		lightDrone.castShadow = true; // default false
		lightDrone.shadow.mapSize.width = 1024; // default
		lightDrone.shadow.mapSize.height = 1024; // default
		lightDrone.shadow.bias = -0.001;
		lightDrone.shadow.camera.near = 0.1; // default
		lightDrone.shadow.camera.far = 5; // default
		lightDrone.shadow.camera.left = -1;
		lightDrone.shadow.camera.right = 1;
		lightDrone.shadow.camera.top = 1;
		lightDrone.shadow.camera.bottom = -1;
		scene.add(lightDrone);
		// scene.add(new THREE.DirectionalLightHelper(lightDrone, 1));
		// var lightDroneShadowCameraHelper = new THREE.CameraHelper(lightDrone.shadow.camera);
		// scene.add(lightDroneShadowCameraHelper);

		//Create a SUN 
		const lightGlobal = new THREE.DirectionalLight(0xffffff, 2);
		lightGlobal.position.set(35, 35, 35);
		lightGlobal.castShadow = true; // default false
		lightGlobal.shadow.mapSize.width = 512; // default
		lightGlobal.shadow.mapSize.height = 512; // default
		lightGlobal.shadow.bias = -0.005;
		lightGlobal.shadow.camera.near = 0.1; // default
		lightGlobal.shadow.camera.far = 100; // default
		lightGlobal.shadow.camera.left = -90;
		lightGlobal.shadow.camera.right = 50;
		lightGlobal.shadow.camera.top = 30;
		lightGlobal.shadow.camera.bottom = -50;
		scene.add(lightGlobal);
		// scene.add(new THREE.DirectionalLightHelper(lightGlobal, 1));
		// var lightGlobalShadowCameraHelper = new THREE.CameraHelper(lightGlobal.shadow.camera);
		// scene.add(lightGlobalShadowCameraHelper);

		const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
		scene.add(ambientLight);

		scene.add(new THREE.AxesHelper(10));

		
		const gltfLoader = new GLTFLoader();
		let drone, field;
		gltfLoader.load("models/rc_quadcopter.glb", (gltf) => {
			drone = gltf;

			mixer = new THREE.AnimationMixer(gltf.scene);
			gltf.animations.forEach((clip) => {
				const action = mixer.clipAction(clip);
				action.play();
			});

			gltf.scene.traverse((child) => {
				if (child instanceof THREE.Mesh) {
					child.castShadow = true;
					child.receiveShadow = true;
				}
			});
		
			scene.add(gltf.scene);
		});
		gltfLoader.load("models/field.glb", (gltf) => {
			field = gltf;
			gltf.scene.translateY(-1);
			gltf.scene.traverse((child) => {
				if (child instanceof THREE.Mesh) {
					child.castShadow = true;
					child.receiveShadow = true;
				}
			}
			);
			scene.add(gltf.scene);
		});

		const cubeTextureLoader = new THREE.CubeTextureLoader();
		const cubeTexture = cubeTextureLoader.load([
			"textures/skybox/px.jpg",
			"textures/skybox/nx.jpg",
			"textures/skybox/py.jpg",
			"textures/skybox/ny.jpg",
			"textures/skybox/pz.jpg",
			"textures/skybox/nz.jpg",
		]);
		scene.background = cubeTexture;

		camera.position.x = -1.0;
		camera.position.y = 0.5;
		camera.position.z = 0.9;

		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 1.0;
		controls.enableZoom = true;

		const animate = () => {
			requestAnimationFrame(animate);
			
			if (drone) {
				// Use RPY angles to rotate the drone
				dataPromise.then((data) => {
					var time = performance.now() * userControlRef.current.timeScale/ 1000 % data.time[data.time.length - 1];
					// find the index of the closest time in the data data.time
					var index = 0;
					var interp = 0;
					for (var i = 0; i < data.time.length; i++) {
						if (data.time[i] > time) {
						index = i;
						if (i > 0 && i < data.time.length) {
							interp = (time - data.time[i - 1]) / (data.time[i] - data.time[i - 1]);
						}
						break;
						}
					}

					drone.scene.position.x = 100*(data.x[index - 1] + (data.x[index] - data.x[index - 1]) * interp);
					drone.scene.position.y = 10*(data.y[index - 1] + (data.y[index] - data.y[index - 1]) * interp);
					drone.scene.position.z = 10*(data.z[index - 1] + (data.z[index] - data.z[index - 1]) * interp);
					
					// X-Roll,Z-Pitch,Yaw-Yaw
					drone.scene.rotation.reorder("XZY");
					drone.scene.rotation.x = 0.0;//*Math.sin(performance.now() / 100); //roll
					drone.scene.rotation.z = -data.pitch[index - 1] - (data.pitch[index] - data.pitch[index - 1]) * interp;
					drone.scene.rotation.y = 0.0; //yaw
				});

				// Update the light to follow the drone
				const pos = drone?.scene.position.clone().add(new THREE.Vector3(1, 1, 1))
				lightDrone.position.set(pos.x, pos.y, pos.z);
				lightDrone.target = drone.scene;
			}

			mixer?.update(10);
			if (userControlRef.current.CaseCam) {
				drone?.scene.add(camera);
				camera.lookAt(drone?.scene.position);
				// camera.position.x = drone?.scene.position.x - 1.0;
			}
			else{
				drone?.scene.remove(camera);
			}
			renderer.render(scene, camera);
		};

		animate();

		window.addEventListener("resize", () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		});
		return () => {
			mountRef.current.removeChild(renderer.domElement);
		};
	}, []);

	return <div ref={mountRef} />;
};

export default Scene1;
