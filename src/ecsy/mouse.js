import { Component, System, World } from '../../node_modules/ecsy/build/ecsy.module.js?module';
import {Group,
    Vector3,
    Vector2,
    TextureLoader,
    CubeGeometry,
    MeshLambertMaterial,
    Mesh,
    Quaternion,
    Ray,
    AmbientLight,
} from '../../node_modules/three/build/three.module.js';

export class MouseCursor extends Component {
    constructor() {
        super();
        this.position = new Vector2()
        this.buttons = 0
        this.down = false
    }
}
class MouseDown extends Component {}
export class MouseDownTrigger extends Component {}
class MouseUpTrigger extends Component {}
class MouseUp extends Component {}
export class MouseSystem extends System {
    init() {
        this.last_point = new Vector2(200,200)
        document.addEventListener('contextmenu',e => {
            e.preventDefault()
            e.stopPropagation()
        })
        document.addEventListener('mousemove',e => {
            this.last_point = new Vector2(e.clientX,e.clientY)
        })
        document.addEventListener('mousedown', e=> {
            this.queries.targets.results.forEach(ent=>{
                let cur = ent.getMutableComponent(MouseCursor)
                if(cur.down === false) {
                    ent.addComponent(MouseDownTrigger)
                }
                cur.down = true
                cur.buttons = e.buttons
            })
        })
        document.addEventListener('mouseup',e => {
            this.queries.targets.results.forEach(ent=>{
                let cur = ent.getMutableComponent(MouseCursor)
                if(cur.down === true) {
                    ent.addComponent(MouseUpTrigger)
                }
                cur.down = false
                cur.buttons = e.buttons
            })
        })
    }
    execute(delta,time) {
        this.queries.targets.results.forEach(ent => {
            ent.getMutableComponent(MouseCursor).position.copy(this.last_point)
        })
    }
}
MouseSystem.queries = {
    targets: {
        components: [MouseCursor]
    }
}
