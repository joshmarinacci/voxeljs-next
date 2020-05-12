import {Vector3, Mesh, MeshLambertMaterial, BoxBufferGeometry, Box3} from "three"
import {ECSComp} from "../../src/ECSComp.js"
import {traceRay} from '../../src/raycast.js'
import {PhysHandler} from '../../src/PhysHandler.js'
import {checkHitTileY, checkHitTileX, checkHitTileZ} from "../../src/SimpleMeshCollider.js"

export class PigComp extends ECSComp {
    constructor(app) {
        super()
        this.app = app

        this.mesh = new Mesh(
            new BoxBufferGeometry(1,1,1),
            new MeshLambertMaterial({color:'pink', map:app.textureLoader.load('./textures/pig.png')})
        )

        this.heading = new Vector3(2,0,-1).normalize()
        this.mesh.position.set(-8,1.5,2)
        this.velocity = 0.005
        this.app.mobs.add(this.mesh)


        this.physics = new PhysHandler(this.app,this.mesh,[this])
    }

    update(time,dt) {
        this.physics.update(dt)
    }

    collide(phys, target, pos, diff) {
        // phys.vel.y = 0//0.01



        if(!this.app.active) {
            //don't do any physics when the world is paused. just let the user move around
            // phys.vel.y = 0
            return
        }
        const bounds = new Box3(new Vector3(0,-1.5,0),new Vector3(1,0,1))
        // console.log("pos",pos.y)
        const size = new Vector3()
        bounds.getSize(size)
        // console.log("size",size)
        const rpos = pos.clone()
        pos.y -= 1.5
        //while on the floor, no y velocity
        if(checkHitTileY(this.app.chunkManager,bounds,pos)) {
            phys.vel.y = 0
        }
        //check forwards
        if(checkHitTileX(this.app.chunkManager,bounds,pos)) {
            this.heading.x = Math.random()-0.5
            this.heading.z = Math.random()-0.5
            this.heading.normalize()
        }
        if(checkHitTileZ(this.app.chunkManager,bounds,pos)) {
            this.heading.x = Math.random()-0.5
            this.heading.z = Math.random()-0.5
            this.heading.normalize()
        }


        if(pos.y < -1000) {
            console.log("pig is dead")
            this.disable()
        }

        //set vel to the heading
        phys.vel.z = this.heading.z
        phys.vel.x = this.heading.x
    }

}
