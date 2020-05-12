import {Vector2} from "three"
import {Pointer} from "./webxr-boilerplate/Pointer"
import {ECSComp} from './ECSComp.js'
import {traceRayAtScreenCoords} from './utils.js'

const LEFT_MOUSE_BUTTON = 1
const RIGHT_MOUSE_BUTTON = 2

export class DesktopControls extends ECSComp {

    constructor(app, distance) {
        super()
        this.app = app
        this.distance = distance
        this.canvas = this.app.renderer.domElement
        this.canvas.addEventListener('contextmenu',e => {
            e.preventDefault()
            e.stopPropagation()
        })
        this.canvas.addEventListener('mousemove',e => {
            if(!this.isEnabled()) return
            const pt = new Vector2(e.clientX,e.clientY)
            const res = traceRayAtScreenCoords(this.app,pt, this.distance)
            res.hitPosition.floor()
            this._fire('highlight',res.hitPosition)
        })
        this.canvas.addEventListener('mousedown',e => {
            if(!this.isEnabled()) return
            const pt = new Vector2(e.clientX,e.clientY)
            if(e.buttons === LEFT_MOUSE_BUTTON) {
                const res = traceRayAtScreenCoords(this.app, pt, this.distance)
                res.hitPosition.add(res.hitNormal)
                this._fire('setblock',res.hitPosition)
            }
            if(e.buttons === RIGHT_MOUSE_BUTTON) {
                const res = traceRayAtScreenCoords(this.app, pt, this.distance)
                this._fire('removeblock',res.hitPosition)
            }
        })
        this.canvas.addEventListener('mouseup',e => {
        })

        this.pointer = new Pointer(app,{
            //don't intersect with anything. only use for orientation and trigger state
            intersectionFilter: o => o.userData.clickable,
            enableLaser: false,
            mouseSimulatesController:false,
        })
        // this.pointer.disable()
    }
    enable() {
        super.enable()
        // this.pointer.enable()
    }
    disable() {
        super.disable()
        // this.pointer.disable()
    }
    update(time) {
        this.pointer.tick(time)
    }
}
