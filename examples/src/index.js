import '../css/fullscreen.css'
import '../css/webxr.css';
import '../css/dashboard.css';
import '../css/index.css';

import {Group,
  Vector3,
  TextureLoader,
  CubeGeometry,
  MeshLambertMaterial,
  Mesh,
  AmbientLight,
} from 'three';
import { Component, System, World } from 'ecsy';
import {
  initialize,
  Parent,
  Transform,
  Object3D,
} from 'ecsy-three';

import {MouseCursor, MouseSystem,
  KeyboardBindingSet, KeyboardSystem,
  VoxelLandscape, VoxelSystem, VoxelTextures,
  ActiveBlock, Highlight, HighlightSystem,
  StagePosition, StageRotation,
  WebXRSystem, WebXRButton, WebXRController,
  FullscreenSystem, FullscreenButton,
  DashboardDOMOvleraySystem, DomDashboard, DashboardVisible,
  InputFrame, VoxelPlayerSystem,
} from 'voxeljs-next'


class VoxelWebXRControllerSystem extends System {
  execute(delta, time) {
      this.queries.controllers.added.forEach(ent => {
          let con = ent.getComponent(WebXRController);
          let mesh2 = new Mesh(
              new CubeGeometry(1.1,0.1,0.1),
              new MeshLambertMaterial({
                  color:'yellow',
              }));
          ent.addComponent(Transform)
          ent.addComponent(Object3D, {value: mesh2})
          ent.addComponent(Parent, con.controller)
      })
      this.queries.controllers.results.forEach(ent => {
          let con = ent.getComponent(WebXRController)
          if(con.selected) {
              console.log("xr is pressed ", con.index)
          }
      })
  }
}
VoxelWebXRControllerSystem.queries = {
  controllers: {
      components:[WebXRController],
      listen: {
          added:true,
          removed:true,
      }
  },
}


// Create a new world to hold all our highlights and systems
let world = new World();

// Register all of the systems we will need
world.registerSystem(VoxelSystem)
world.registerSystem(KeyboardSystem)
world.registerSystem(MouseSystem)
world.registerSystem(HighlightSystem)
world.registerSystem(DashboardDOMOvleraySystem)
world.registerSystem(WebXRSystem);
world.registerSystem(FullscreenSystem);
world.registerSystem(VoxelPlayerSystem)

// Initialize the default sets of highlights and systems
let data = initialize(world);
let {scene, renderer, camera} = data.entities;
console.log("got it",data)

// Modify the position for the default camera
// let transform = camera.getMutableComponent(Transform);
// transform.position.z = 5;

scene.addComponent(FullscreenButton)
scene.addComponent(WebXRButton)
// one InputFrame is required for all inputs to work
scene.addComponent(InputFrame)

// the binding keys match dom keyboard events
world.createEntity()
  .addComponent(KeyboardBindingSet, {bindings: {
          'a': InputFrame.LEFT_STRAFE,
          'ArrowLeft': InputFrame.LEFT_STRAFE,
          'd': InputFrame.RIGHT_STRAFE,
          'ArrowRight': InputFrame.RIGHT_STRAFE,
          'w': InputFrame.MOVE_FORWARD,
          's': InputFrame.MOVE_BACKWARD,
          'ArrowUp': InputFrame.MOVE_FORWARD,
          'ArrowDown': InputFrame.MOVE_BACKWARD,
          'e': InputFrame.OPEN_DASHBOARD,
          't': InputFrame.LEVITATE_UP,
          'g': InputFrame.LEVITATE_DOWN,
      }})


new TextureLoader().load('./dummy.jpg')


// add a dashboard to the scene
scene.addComponent(DomDashboard)

//set the active block to type 3 (TNT)
scene.addComponent(ActiveBlock, {type:3})

// a pivot for rotating the world around
let stageRot = world.createEntity()
  .addComponent(Object3D, {value: new Group()})
  .addComponent(Transform)
  .addComponent(Parent, {value: scene})
  .addComponent(StageRotation) // StageRotation is how the rest of the system can use this

// a position for moving the world around
let stagePos = world.createEntity()
  .addComponent(Object3D, {value: new Group})
  .addComponent(Transform)
  .addComponent(Parent, {value:stageRot})
  .addComponent(StagePosition) // StagePosition

//make the actual landscape
world.createEntity()
  .addComponent(Transform)
  .addComponent(Parent, {value: stagePos})
  .addComponent(VoxelLandscape, {
      make_voxel: (x,y,z) => {
          // make a floor between -2 and -5
          if(y < -2 && y > -5) return 1 // grass
          // make a 4x4x4 cube floating in space
          if(    x > 0 && x < 5
              && z > 5 && z < 10
              && y > 5 && y < 10
          ) return 2 // brick
          return 0
      }
      ,
  })
  .addComponent(VoxelTextures,{
      textures:[
          {
              src:'./textures/dirt.png'
          },
          {
              src:'./textures/grass.png'
          },
          {
              src:'./textures/brick.png'
          },
          {
              src:'./textures/tnt.png'
          },
          {
              src:'./textures/heart.png',
          },
  ]})

world.execute();

// create a mouse cursor so that we can look for mouse events
world.createEntity()
  .addComponent(MouseCursor)

//create a ThreeJS mesh as the highlighter
let mesh = new Mesh(
  new CubeGeometry(1.1,1.1,1.1, 4,4,4).translate(0.5,0.5,0.5),
  new MeshLambertMaterial({
      color:'green',
      depthTest:true,
      wireframe:true,
      wireframeLinewidth: 3,
      transparent: true,
      opacity: 0.5,
  }));

// make the highlighter
let highlight = world.createEntity()
  .addComponent(Transform)
  .addComponent(Object3D, { value: mesh})
  .addComponent(Parent, {value: stagePos})
  .addComponent(Highlight)

//add some ambient light or the highlight mesh won't have any color
world.createEntity()
  .addComponent(Object3D, { value: new AmbientLight()})
  .addComponent(Parent, {value: scene})
