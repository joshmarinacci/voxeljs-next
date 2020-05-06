import {Vector3, Box3} from "three"

const SIZE = new Vector3()
const CENTER = new Vector3()

export function checkHitTileY(voxels, bounds, pos) {
    bounds.getSize(SIZE)
    // console.log("checking for hits near height",SIZE.y)
    //scan in the y direction only for now.
    let sy = Math.floor(pos.y)
    let ey = Math.ceil(pos.y+SIZE.y)
    let sz = Math.floor(pos.z)
    let sx = Math.floor(pos.x)
    let ex = Math.ceil(pos.x+SIZE.x)
    for(let i=sy; i<=ey; i++) {
        // for(let j=sx; j<ex; j++) {
        const vox = voxels.voxelAtCoordinates(new Vector3(sx, i, sz))
        // console.log("hit", vox)
        if (vox > 0) return true
        // }
    }
    return false
}
export function checkHitTileX(voxels, bounds, pos) {
    bounds.getCenter(CENTER)
    let sx = Math.floor(pos.x-CENTER.x)
    let ex = Math.ceil(pos.x+CENTER.x)
    let sy = Math.round(pos.y+1)
    let sz = Math.floor(pos.z)
    for(let j=sx; j<ex; j++) {
        const vox = voxels.voxelAtCoordinates(new Vector3(j, sy, sz))
        if (vox > 0) return true
    }
    return false
}
export function checkHitTileZ(voxels, bounds, pos) {
    bounds.getCenter(CENTER)
    let sx = Math.floor(pos.x)
    let sy = Math.round(pos.y+1)
    let sz = Math.floor(pos.z-CENTER.z)
    let ez = Math.ceil(pos.z+CENTER.z)
    for(let k=sz; k<ez; k++) {
        const vox = voxels.voxelAtCoordinates(new Vector3(sx, sy, k))
        if (vox > 0) return true
    }
    return false
}

export class SimpleMeshCollider {
    constructor(app) {
        this.app = app
    }
    collide(phys, target, pos, diff) {
        //pos is the potential position. we can choose to veto it
        this.app.stagePos.position.y = -target.position.y
        this.app.stagePos.position.z = -target.position.z
        this.app.stagePos.position.x = -target.position.x
        if(!this.app.active) {
            //don't do any physics when the world is paused. just let the user move around
            // phys.vel.y = 0
            return
        }
        //check if too far beyond terminal velocity
        if(phys.vel.y < -1) phys.vel.y = -1


        const bounds = new Box3(new Vector3(0,0,0),new Vector3(1,1,1))
        //check downwards
        if(checkHitTileY(this.app.chunkManager,bounds,pos)) {
            if(!phys.isFlying()) {
                phys.vel.y = 0
            }
        }
        //check forwards
        if(checkHitTileX(this.app.chunkManager,bounds,pos)) {
            // console.log("hit something to the left or right")
            phys.vel.x = 0
        }
        if(checkHitTileZ(this.app.chunkManager,bounds,pos)) {
            // console.log("hit something to the front or back")
            phys.vel.z = 0
        }
        //if fell off the world
        if(pos.y < -30) {
            console.log("fell off the world")
            phys.vel.y = 0
            target.position.y = 10
            target.position.x = 0
            target.position.z = 0
        }

        if(phys.jumping) {
            const diff = Date.now() - phys.jumpTime;
            if(diff > 300) {
                // console.log("over one second")
            } else {
                phys.vel.y = 1.0;
            }
        }
    }
}
