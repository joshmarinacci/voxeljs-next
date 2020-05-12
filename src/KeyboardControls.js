import {Vector3,} from "three"
import {ECSComp} from './ECSComp.js'
const toRad = (deg) => Math.PI / 180 * deg
const Y_AXIS = new Vector3(0,1,0)
const SPEED = 0.1

export class KeyboardControls extends ECSComp {
    constructor(app) {
        super()
        this.app = app

        this.keystates = {
            ArrowLeft:{current:false, previous:false},
            ArrowRight:{current:false, previous:false},
            ArrowUp:{current:false, previous:false},
            ArrowDown:{current:false, previous:false},
            a: { current: false, previous: false},
            d: { current: false, previous: false},
            s: { current: false, previous: false},
            w: { current: false, previous: false},
            q: { current: false, previous: false},
            e: { current: false, previous: false},
            Enter: { current: false, previous: false},
            c: { current: false, previous: false},
        }
        this.keystates[' '] = { current: false, previous: false}


        this._keydown_handler = (e)=>{
            if(!this.isEnabled()) return
            if(this.keystates[e.key]) {
                this.keystates[e.key].current = true
            }
        }
        this._keyup_handler = (e)=>{
            if(!this.isEnabled()) return
            if(this.keystates[e.key]) {
                this.keystates[e.key].current = false
            }
        }
        document.addEventListener('keydown',this._keydown_handler)
        document.addEventListener('keyup',this._keyup_handler)
    }

    update(time) {
        if(this.keystates.ArrowUp.current === true)  this.glideForward()
        if(this.keystates.ArrowDown.current === true)  this.glideBackward()
        if(this.keystates.ArrowLeft.current === true)  this.rotateLeft()
        if(this.keystates.ArrowRight.current === true)  this.rotateRight()
        if(this.keystates.a.current === true)  this.glideLeft()
        if(this.keystates.d.current === true)  this.glideRight()
        if(this.keystates.w.current === true)  this.glideForward()
        if(this.keystates.s.current === true)  this.glideBackward()
        if(this.keystates.q.current === true)  this.glideDown()
        if(this.keystates.e.current === true)  this.glideUp()
        if(this.keystates[' '].current === true) this.app.player_phys.startJump()
        if(this.keystates[' '].current === false && this.keystates[' '].previous === true) this.app.player_phys.endJump()

        if(this.keystates.Enter.current === false && this.keystates.Enter.previous === true) {
            this._fire('show-dialog',this)
        }
        if(this.keystates.c.current === true && this.keystates.c.previous === false) {
            this.app.active = !this.app.active
            this.app.player_phys.endFlying()
        }

        Object.keys(this.keystates).forEach(key => {
            this.keystates[key].previous = this.keystates[key].current
        })
    }

    rotateLeft() {
        this.app.stageRot.rotation.y -= toRad(3)
    }

    rotateRight() {
        this.app.stageRot.rotation.y += toRad(3)
    }

    getSpeedDirection() {
        const dir = new Vector3(0,0,1)
        dir.applyAxisAngle(Y_AXIS, -this.app.stageRot.rotation.y)
        return dir.normalize().multiplyScalar(SPEED)
    }
    glideForward() {
        const vel = this.getSpeedDirection().multiplyScalar(-40)
        this.app.player_phys.vel.x = vel.x
        this.app.player_phys.vel.z = vel.z
        this.app.player_phys.markChanged()
    }
    glideBackward() {
        const vel = this.getSpeedDirection().multiplyScalar(40)
        this.app.player_phys.vel.x = vel.x
        this.app.player_phys.vel.z = vel.z
        this.app.player_phys.markChanged()
    }
    glideLeft() {
        const vel = this.getSpeedDirection().multiplyScalar(40).applyAxisAngle(Y_AXIS,toRad(-90))
        this.app.player_phys.vel.x = vel.x
        this.app.player_phys.vel.z = vel.z
        this.app.player_phys.markChanged()
    }
    glideRight() {
        const vel = this.getSpeedDirection().multiplyScalar(40).applyAxisAngle(Y_AXIS,toRad(90))
        this.app.player_phys.vel.x = vel.x
        this.app.player_phys.vel.z = vel.z
        this.app.player_phys.markChanged()
    }

    glideUp() {
        if(!this.app.player_phys.isFlying()) {
            this.app.player_phys.startFlying()
        }
        this.app.player_phys.vel.y = 0.1
        this.app.player_phys.markChanged()
    }
    glideDown() {
        if(!this.app.player_phys.isFlying()) {
            this.app.player_phys.startFlying()
        }
        this.app.player_phys.vel.y = -0.1
        this.app.player_phys.markChanged()
    }
}
