import {Vector3, Mesh, MeshLambertMaterial, SphereBufferGeometry} from "three"
import {ECSComp} from '../../src/ECSComp.js'

const BUMP_HEIGHT = new Vector3(0,1,0)
export class RemotePlayersProxy extends ECSComp {
    constructor(app) {
        super()
        this.app = app;
        this.players = {}
    }
    remotePlayerMoved(id,pos) {
        if(!this.players[id]) {
            console.log("a new player joined!")
            this.players[id] = new Mesh(new SphereBufferGeometry(1), new MeshLambertMaterial({color:'aqua'}))
            this.app.playersGroup.add(this.players[id])
        }
        this.players[id].position.copy(pos).add(BUMP_HEIGHT)
        console.log("remote player moved to",pos)
    }
}
