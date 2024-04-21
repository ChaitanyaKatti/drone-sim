# Drone-Sim
A simple drone simulator for testing control algorithms. Rendered using [Three.js](https://threejs.org/) and differentiable physics engine backend coded in Python using PyTorch. The animations are loaded in the browser usign HTTP requests to the Python FastAPI server. The server runs the physics engine and returns the updated state of the drone to the browser. The optimal path is calculated using backpropagation through time (BPTT) and the PyTorch autograd package.

![Demo](./images/demo.png)
