import {System} from "../node_modules/ecsy/build/ecsy.module.js"
import {StandardThreeSceneSystem} from './ThreeComponents'
import {EPSILON, traceRayAtScreenCoords} from '../src/utils'
import {traceRay} from '../src/raycast'

export class Stage {
    constructor() {
        this.position = new THREE.Group()
        this.rotation = new THREE.Group()
        this.rotation.add(this.position)
    }
}

export class Highlight {
    constructor() {
        this.mesh = new THREE.Mesh(
            new THREE.CubeGeometry(1.1,1.1,1.1, 4,4).translate(0.5,0.5,0.5),
            new THREE.MeshLambertMaterial({
                color:'green',
                depthTest:true,
                wireframe:true,
                wireframeLinewidth: 3,
                transparent: true,
                opacity: 0.5,
            }))
    }
}

export class KeyboardState {
    constructor() {
        this.keyboardStates = {}

        this.onKeyDown = (e) => {
            this.keyboardStates[e.key] = true
        }
        this.onKeyUp = (e) => {
            this.keyboardStates[e.key] = false
        }

        window.addEventListener("keydown", this.onKeyDown);
        window.addEventListener("keyup", this.onKeyUp);
    }
    isPressed(key) {
        if(this.keyboardStates[key] === true) return true
        return false
    }
}

export class KeyboardNav extends System {
    init() {
        return {
            queries: {
                camera: { components: [Stage]}
            }
        }
    }
    execute(delta) {
        const speed = 10
        let kb = this.world.components.keyboardState;
        let stage = this.world.components.stage.position;
        let rot = this.world.components.stage.rotation;
        if(kb.isPressed('a'))  stage.position.x += +speed*delta
        if(kb.isPressed('d'))  stage.position.x += -speed*delta
        if(kb.isPressed('w'))  stage.position.z += +speed*delta
        if(kb.isPressed('ArrowUp'))    stage.position.z += +speed*delta
        if(kb.isPressed('s'))  stage.position.z += -speed*delta
        if(kb.isPressed('ArrowDown'))  stage.position.z += -speed*delta

        if(kb.isPressed('ArrowLeft'))  rot.rotation.y -= 0.03
        if(kb.isPressed('ArrowRight')) rot.rotation.y += 0.03
    }
}

const LEFT_MOUSE_BUTTON = 1
const RIGHT_MOUSE_BUTTON = 2

export class DesktopControls extends System {
    init() {
        const canvas = this.world.components.standardThreeSceneSystem.renderer.domElement
        canvas.addEventListener('contextmenu',e => {
            e.preventDefault()
            e.stopPropagation()
        })
        canvas.addEventListener('mousemove',e => {
            this.pt = new THREE.Vector2(e.clientX,e.clientY)
        })
        canvas.addEventListener('mousedown',e => {
            this.buttons = e.buttons
        })
        canvas.addEventListener('mouseup',e => {
            this.buttons = null
        })
        return {
            queries: {
                highlight: { components: [Highlight]}
            }
        }
    }
    traceRayAtScreenCoords(pt) {
        if(!this.pt) return
        const distance = 30
        const renderer = this.world.components.standardThreeSceneSystem.renderer
        const camera = this.world.components.standardThreeSceneSystem.camera
        const stagePos = this.world.components.stage.position
        const stageRot = this.world.components.stage.rotation
        const chunkManager = this.world.components.chunkManagerComponent.chunkManager

        const ray = new THREE.Ray()

        // e = e.changedTouches[0]
        const mouse = new THREE.Vector2()
        const bounds = renderer.domElement.getBoundingClientRect()
        mouse.x = ((pt.x - bounds.left) / bounds.width) * 2 - 1
        mouse.y = -((pt.y - bounds.top) / bounds.height) * 2 + 1

        ray.origin.copy(camera.position)
        ray.direction.set(mouse.x, mouse.y, 0.5).unproject(camera).sub(ray.origin).normalize()

        stagePos.worldToLocal(ray.origin)
        ray.origin.add(new THREE.Vector3(0,0,-0.5))
        const quat = new THREE.Quaternion()
        quat.copy(stageRot.quaternion)
        quat.inverse()
        ray.direction.applyQuaternion(quat)

        const hitNormal = new THREE.Vector3(0,0,0)
        const hitPosition = new THREE.Vector3(0,0,0)
        const hitBlock = traceRay(chunkManager,ray.origin,ray.direction,distance,hitPosition,hitNormal,EPSILON)
        return {
            hitBlock:hitBlock,
            hitPosition:hitPosition,
            hitNormal: hitNormal
        }
    }

    execute(delta) {
        if(!this.pt) return
        let highlight = this.queries.highlight;
        for (let i = 0; i < highlight.length; i++) {
            let hi = highlight[i].getComponent(Highlight);
            const res = this.traceRayAtScreenCoords(this.pt)
            res.hitPosition.floor()
            hi.mesh.position.copy(res.hitPosition)
        }

        if(this.pt) {
            const res = this.traceRayAtScreenCoords(this.pt)
            if (this.buttons === LEFT_MOUSE_BUTTON) {
                const res = this.traceRayAtScreenCoords(this.pt)
                res.hitPosition.add(res.hitNormal)
                console.log("passed at", res.hitBlock)
                // this._fire('setblock',res.hitPosition)
            }
            if (this.buttons === RIGHT_MOUSE_BUTTON) {
                const res = this.traceRayAtScreenCoords(this.pt)
                // this._fire('removeblock',res.hitPosition)
            }
        }
    }
}