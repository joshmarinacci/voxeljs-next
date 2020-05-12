import {Vector3,} from "three"
import {ECSComp} from '../../src/ECSComp.js'

export class ItemManager extends ECSComp {
    constructor(app) {
        super()
        this.app = app
    }

    isBlockTypeItem(type) {
        if(type === 5) return true
        return false
    }

    removeItem(pos) {
        const type = this.app.chunkManager.voxelAtCoordinates(pos)
        const radius = 3;
        if(type === 5) { //the type code for TNT
            console.log("triggering TNT explosion")
            const cursor = new Vector3()
            const actual = new Vector3()
            for(let x=-radius; x<+radius; x++) {
                cursor.x = x
                for(let y=-radius; y<=+radius; y++) {
                    cursor.y = y
                    for(let z = -radius; z<=+radius; z++) {
                        cursor.z = z
                        if(cursor.length()<radius) {
                            actual.copy(pos)
                            actual.add(cursor)
                            this.app.setBlock(actual,0)
                        }
                    }
                }
            }
            const chunkIndex = this.app.chunkManager.chunkIndexAtCoordinates(pos.x,pos.y,pos.z)
            const chunk = this.app.chunkManager.chunks[chunkIndex.join("|")]
            if(chunk) this.app.rebuildMesh(chunk)
        }
        this.app.explosionParticles.fire(pos)
    }
}
