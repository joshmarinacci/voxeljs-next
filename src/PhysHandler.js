import {Vector3,} from "three"
import {ECSComp} from './ECSComp.js'
const GRAVITY = new Vector3(0,-9.8,0)

export class PhysHandler extends ECSComp {
    constructor(app, target, colliders) {
        super()
        this.app = app
        this.target = target
        this.colliders = colliders
        this.vel = new Vector3(0,0,0)
        this.flying = false
        this.jumping = false
    }
    isFlying() {
        return this.flying
    }
    startFlying() {
        this.flying = true
    }
    endFlying() {
        this.flying = false
    }
    startJump() {
        if(!this.jumping) {
            this.jumping = true
            this.flying = false
            this.jumpTime = Date.now()
        }
    }
    endJump() {
        this.jumping = false
    }
    markChanged() {
        this._fire('move',{position:this.target.position})
    }
    update(time,dt) {
        dt = dt/1000
        // const dt = (time/1000)
        // console.log("tick",dt)
        if(!this.flying && this.app.active) {
            let acc = GRAVITY.y * 0.5
            this.vel.y += acc * dt
        }
        // console.log("now",this.vel.y)
        const pos = this.target.position.clone()
        pos.y += this.vel.y*dt
        pos.z += this.vel.z*dt
        pos.x += this.vel.x*dt
        // console.log(this.vel)
        const diff = new Vector3()
        diff.y = this.vel.y*dt
        diff.x = this.vel.x*dt
        diff.z = this.vel.z*dt
        this.colliders.forEach(col => {
            col.collide(this,this.target,pos,diff)
        })

        //apply final velocity
        this.target.position.y += this.vel.y
        this.target.position.z += this.vel.z*dt
        this.target.position.x += this.vel.x*dt

        //apply some friction
        this.vel.z *= 0.8
        this.vel.x *= 0.8
        if(this.flying) {
            this.vel.y *= 0.8
        }
        // console.log(this.vel.y)
        this.markChanged()
    }
}
