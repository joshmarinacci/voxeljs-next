import {System} from "../node_modules/ecsy/build/ecsy.module.js"

export class Stage {
    constructor() {
        this.position = new THREE.Group()
        this.rotation = new THREE.Group()
        this.rotation.add(this.position)
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
