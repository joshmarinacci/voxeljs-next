import {Ray, Vector3,} from "three"
import {traceRay} from './raycast.js'
import {ECSComp} from './ECSComp.js'
import {toRad, EPSILON} from "./utils.js"

const HAS_POINTER_LOCK = 'pointerLockElement' in document ||
    'mozPointerLockElement' in document ||
    'webkitPointerLockElement' in document;


function requestPointerLock(el) {
    if(el.requestPointerLock) return el.requestPointerLock()
    console.log("request pointer lock not found")
}


export class FullScreenControls extends ECSComp {
    constructor(app) {
        super()
        this.app = app

        this.changeCallback = () => {
            if(document.pointerLockElement) {
                // console.log("entered pointer lock")
            } else {
                // console.log("exited pointer lock")
                this.disable()
            }
        }
        this.moveCallback = (e) => {
            if(!this.isEnabled()) return
            this.app.stageRot.rotation.y += e.movementX/300
            this.app.stageRot.rotation.y += e.movementX/300

            if(e.movementY) {
                this.app.stageRot.rotation.x += e.movementY/500
                this.app.stageRot.rotation.x = Math.max(this.app.stageRot.rotation.x,toRad(-60))
                this.app.stageRot.rotation.x = Math.min(this.app.stageRot.rotation.x,toRad(60))
            }

            const res = this.traceRay()
            res.hitPosition.floor()
            this._fire('highlight',res.hitPosition)
        }
        this.mousedownCallback = (e) => {
            if(!this.isEnabled()) return
            e.preventDefault()
            const LEFT_MOUSE_BUTTON = 1
            const RIGHT_MOUSE_BUTTON = 2
            if(e.buttons === LEFT_MOUSE_BUTTON) {
                const res = this.traceRay()
                res.hitPosition.add(res.hitNormal)
                this._fire('setblock',res.hitPosition)
            }
            if(e.buttons === RIGHT_MOUSE_BUTTON) {
                const res = this.traceRay()
                this._fire('removeblock',res.hitPosition)
            }
        }
        this.errorCallback = (e) => {
            console.log("error getting pointer lock",e)
        }
        this.contextmenuCallback = (e) => {
            e.preventDefault()
            e.stopPropagation()
        }
    }

    traceRay() {
        const target = new Vector3(0,1.6,-1)
        this.app.stagePos.worldToLocal(target)
        const pos = new Vector3(0,1.6,0)
        this.app.stagePos.worldToLocal(pos)
        const ray = new Ray(pos)
        ray.lookAt(target)

        const hitNormal = new Vector3(0,0,0)
        const hitPosition = new Vector3(0,0,0)
        const hitBlock = traceRay(this.app.chunkManager,ray.origin,ray.direction,this.distance,hitPosition,hitNormal,EPSILON)
        return {
            hitBlock:hitBlock,
            hitPosition:hitPosition,
            hitNormal: hitNormal
        }
    }

    enable() {
        super.enable()
        if(HAS_POINTER_LOCK) {
            // console.log("we have pointer lock")
            document.addEventListener('pointerlockchange',this.changeCallback,false)
            document.addEventListener('mousemove',this.moveCallback,false)
            document.addEventListener('pointerlockerror', this.errorCallback, false);
            document.addEventListener('mousedown',this.mousedownCallback,false)
            document.addEventListener('contextmenu',this.contextmenuCallback,false)
            requestPointerLock(this.app.renderer.domElement)
        }
    }
    disable() {
        if(!this.isEnabled()) return //don't recurse if already disabled
        super.disable()
        document.removeEventListener('pointerlockchange', this.changeCallback, false)
        document.removeEventListener('mousemove', this.moveCallback, false)
        document.removeEventListener('pointerlockerror', this.errorCallback, false);
        document.removeEventListener('contextmenu',this.contextmenuCallback,false)
        this._fire('exit', this)
    }
}

