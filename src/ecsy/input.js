import {Component, System} from '../../node_modules/ecsy/build/ecsy.module.js?module'
import {StagePosition, StageRotation} from './camera_gimbal.js'
import {
    initialize,
    Parent,
    Transform,
    Object3D,
} from '../../node_modules/ecsy-three/build/ecsy-three.module-unpkg.js';
import {Group,
    Vector3,
    TextureLoader,
    CubeGeometry,
    MeshLambertMaterial,
    Mesh,
    AmbientLight,
} from '../../node_modules/three/build/three.module.js';

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
        }
    }
}
InputFrame.LEFT_STRAFE = 'LEFT_STRAFE'
InputFrame.RIGHT_STRAFE = 'RIGHT_STRAFE'
InputFrame.MOVE_FORWARD = 'MOVE_FORWARD'
InputFrame.MOVE_BACKWARD = 'MOVE_BACKWARD'
InputFrame.ROTATE_LEFT = 'ROTATE_LEFT'
InputFrame.ROTATE_RIGHT = 'ROTATE_RIGHT'

const Y_AXIS = new Vector3(0,1,0)
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
                    rot_trans.rotation.y -= 0.1
                }
                if (input.state[InputFrame.ROTATE_RIGHT] === true) {
                    rot_trans.rotation.y += 0.1
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
            })
        })
    }
}
/*
        .addComponent(KeyboardControls, { mapping: {
                ArrowUp:(ent) => {
                    let trans = ent.getMutableComponent(Transform)
                    let stageRot = ent.getComponent(Parent).value
                    const dir = new Vector3(0,0,1)
                    dir.applyAxisAngle(Y_AXIS, -stageRot.getComponent(Transform).rotation.y)
                    let d2 = dir.normalize().multiplyScalar(SPEED)
                    const vel = d2.multiplyScalar(4)
                    trans.position.x += vel.x;
                    trans.position.z += vel.z;
                },
                ArrowDown: (ent) => {
                    let trans = ent.getMutableComponent(Transform)
                    let stageRot = ent.getComponent(Parent).value
                    const dir = new Vector3(0,0,1)
                    dir.applyAxisAngle(Y_AXIS, -stageRot.getComponent(Transform).rotation.y)
                    let d2 = dir.normalize().multiplyScalar(SPEED)
                    const vel = d2.multiplyScalar(-4)
                    trans.position.x += vel.x;
                    trans.position.z += vel.z;
                },
                a:(ent) => {
                    console.log("slide left");
                },
                d:(ent) => {
                    console.log("slide right");
                },
                t:(ent) => {
                    console.log("need to show the dashboard")
                    dashboard.addComponent(DashboardVisible)
                }
            }})

 */
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
