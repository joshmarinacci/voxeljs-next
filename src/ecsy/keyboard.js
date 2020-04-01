import {Component, System} from '../../node_modules/ecsy/build/ecsy.module.js?module'

export class KeyboardControls extends Component {
    constructor() {
        super();
        this.mapping = {}
    }
}
export class KeyboardSystem extends System {
    init() {
        this.keystates = {}
        console.log("initted keyboard system");
        document.addEventListener('keydown',this._keydown.bind(this));
        document.addEventListener('keyup',this._keyup.bind(this));
    }
    _keydown(e) {
        // console.log("key down",e)
        if(!this.keystates[e.key]) this.keystates[e.key] = { pressed:false}
        this.keystates[e.key].pressed = true
    }
    _keyup(e) {
        // console.log("key up",e)
        if(!this.keystates[e.key]) this.keystates[e.key] = { pressed:false}
        this.keystates[e.key].pressed = false
    }
    is_keydown(name) {
        if(this.keystates[name]) return this.keystates[name].pressed
        return false
    }
    execute(delta, time) {
        this.queries.entities.results.forEach(ent => {
            let keys = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','w','s','q','e',' ']
            let controls = ent.getComponent(KeyboardControls);
            keys.forEach(key => {
                if(this.is_keydown(key) && controls.mapping[key])
                    controls.mapping[key](ent)
            })
        })
    }
}
KeyboardSystem.queries = {
    entities: {
        components: [KeyboardControls]
    }
}
