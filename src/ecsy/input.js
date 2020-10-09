import {Component, System} from 'ecsy'
import {StagePosition, StageRotation} from './camera_gimbal.js'
import {
    initialize,
    Parent,
    Transform,
    Object3D,
} from 'ecsy-three';
import {Group,
    Vector3,
    TextureLoader,
    CubeGeometry,
    MeshLambertMaterial,
    Mesh,
    AmbientLight,
} from 'three';

export class InputFrame extends Component {
    constructor() {
        super();
        this.state = {
            ROTATE_LEFT:false,
            ROTATE_RIGHT:false,
            LEFT_STRAFE:false,
            RIGHT_STRAFE:false,
            MOVE_FORWARD:false,
            MOVE_BACKWARD:false,
            LEVITATE_UP:false,
            LEVITATE_DOWN:false,
        }
    }
}
InputFrame.LEFT_STRAFE = 'LEFT_STRAFE'
InputFrame.RIGHT_STRAFE = 'RIGHT_STRAFE'
InputFrame.MOVE_FORWARD = 'MOVE_FORWARD'
InputFrame.MOVE_BACKWARD = 'MOVE_BACKWARD'
InputFrame.ROTATE_LEFT = 'ROTATE_LEFT'
InputFrame.ROTATE_RIGHT = 'ROTATE_RIGHT'
InputFrame.OPEN_DASHBOARD = 'OPEN_DASHBOARD'
InputFrame.ROTATION_DRAGGING = 'ROTATION_DRAGGING'
InputFrame.ROTATION_ANGLE = 'ROTATION_ANGLE'
InputFrame.CREATE_AT_CURSOR = 'CREATE_AT_CURSOR'
InputFrame.DESTROY_AT_CURSOR = 'DESTROY_AT_CURSOR'
InputFrame.LEVITATE_UP = 'LEVITATE_UP'
InputFrame.LEVITATE_DOWN = 'LEVITATE_DOWN'

const Y_AXIS = new Vector3(0,1,0)
const Z_AXIS = new Vector3(0,0,1)
const SPEED = 0.1

export class VoxelPlayerSystem extends System {
    init() {
        console.log("voxel system initting")
    }
    execute(delta, time) {
        this.queries.inputs.results.forEach(ent => {
            let input = ent.getComponent(InputFrame)
            this.queries.stageRot.results.forEach(ent => {
                let rot_trans = ent.getMutableComponent(Transform)
                if (input.state[InputFrame.ROTATE_LEFT] === true) {
                    rot_trans.rotation.y -= 0.05
                }
                if (input.state[InputFrame.ROTATE_RIGHT] === true) {
                    rot_trans.rotation.y += 0.05
                }
                if (input.state[InputFrame.ROTATION_DRAGGING] === true) {
                    rot_trans.rotation.y = input.state[InputFrame.ROTATION_ANGLE]
                } else {
                    input.state[InputFrame.ROTATION_ANGLE] = rot_trans.rotation.y
                }
            })

            this.queries.stagePos.results.forEach(ent => {
                if(input.state[InputFrame.MOVE_FORWARD] === true) {
                    let stageRot = ent.getComponent(Parent).value
                    let pos_trans = ent.getMutableComponent(Transform)
                    const dir = new Vector3(0,0,1)
                    dir.applyAxisAngle(Y_AXIS, -stageRot.getComponent(Transform).rotation.y)
                    let d2 = dir.normalize().multiplyScalar(SPEED)
                    const vel = d2.multiplyScalar(4)
                    pos_trans.position.x += vel.x;
                    pos_trans.position.z += vel.z;
                }
                if(input.state[InputFrame.MOVE_BACKWARD] === true) {
                    let stageRot = ent.getComponent(Parent).value
                    let pos_trans = ent.getMutableComponent(Transform)
                    const dir = new Vector3(0,0,1)
                    dir.applyAxisAngle(Y_AXIS, -stageRot.getComponent(Transform).rotation.y)
                    let d2 = dir.normalize().multiplyScalar(SPEED)
                    const vel = d2.multiplyScalar(-4)
                    pos_trans.position.x += vel.x;
                    pos_trans.position.z += vel.z;
                }
                if(input.state[InputFrame.LEFT_STRAFE] === true) {
                    let stageRot = ent.getComponent(Parent).value
                    let pos_trans = ent.getMutableComponent(Transform)
                    const dir = new Vector3(0,0,1)
                    dir.applyAxisAngle(Y_AXIS, -stageRot.getComponent(Transform).rotation.y + Math.PI/2)
                    let d2 = dir.normalize().multiplyScalar(SPEED)
                    const vel = d2.multiplyScalar(4)
                    pos_trans.position.x += vel.x;
                    pos_trans.position.z += vel.z;
                }
                if(input.state[InputFrame.RIGHT_STRAFE] === true) {
                    let stageRot = ent.getComponent(Parent).value
                    let pos_trans = ent.getMutableComponent(Transform)
                    const dir = new Vector3(0,0,1)
                    dir.applyAxisAngle(Y_AXIS, -stageRot.getComponent(Transform).rotation.y - Math.PI/2)
                    let d2 = dir.normalize().multiplyScalar(SPEED)
                    const vel = d2.multiplyScalar(4)
                    pos_trans.position.x += vel.x;
                    pos_trans.position.z += vel.z;
                }
                if(input.state[InputFrame.LEVITATE_DOWN] === true) {
                    let stageRot = ent.getComponent(Parent).value
                    let pos_trans = ent.getMutableComponent(Transform)
                    const dir = new Vector3(0,1,0)
                    dir.applyAxisAngle(Z_AXIS, -stageRot.getComponent(Transform).rotation.z)
                    let d2 = dir.normalize().multiplyScalar(SPEED)
                    const vel = d2.multiplyScalar(4)
                    pos_trans.position.x += vel.x;
                    pos_trans.position.y += vel.y;
                }
                if(input.state[InputFrame.LEVITATE_UP] === true) {
                    let stageRot = ent.getComponent(Parent).value
                    let pos_trans = ent.getMutableComponent(Transform)
                    const dir = new Vector3(0,1,0)
                    dir.applyAxisAngle(Z_AXIS, -stageRot.getComponent(Transform).rotation.z)
                    let d2 = dir.normalize().multiplyScalar(SPEED)
                    const vel = d2.multiplyScalar(-4)
                    pos_trans.position.x += vel.x;
                    pos_trans.position.y += vel.y;
                }
            })
        })
    }
}

VoxelPlayerSystem.queries = {
    inputs: {
        components: [InputFrame],
    },
    stageRot: {
        components: [StageRotation, Transform],
    },
    stagePos: {
        components: [StagePosition, Transform],
    }
}
