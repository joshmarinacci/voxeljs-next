import {Component, System} from 'ecsy'
import {InputFrame} from './input.js'

export class KeyboardBindingSet extends Component {
    constructor() {
        super();
        this.bindings = {}
    }
}

export class KeyboardSystem extends System {
    _setBindingValue(keyboard_key, new_value) {
        this.queries.bindings.results.forEach(ent => {
            let binding = ent.getComponent(KeyboardBindingSet)
            if(binding.bindings[keyboard_key]) {
                let state_key = binding.bindings[keyboard_key]
                this.queries.inputs.results.forEach(ent => {
                    let input = ent.getMutableComponent(InputFrame)
                    input.state[state_key] = new_value
                })
            }
        })
    }

    _keydown(e) {
        this._setBindingValue(e.key,true);
    }
    _keyup(e) {
        this._setBindingValue(e.key,false);
    }
    init() {
        document.addEventListener('keydown',this._keydown.bind(this));
        document.addEventListener('keyup',this._keyup.bind(this));
    }
}
KeyboardSystem.queries = {
    bindings: {
        components:[KeyboardBindingSet]
    },
    inputs: {
        components: [InputFrame],
    }
}
