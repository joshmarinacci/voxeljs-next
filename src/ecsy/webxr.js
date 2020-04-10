import { Component, System, World } from '../../node_modules/ecsy/build/ecsy.module.js?module';
import {FullscreenMode} from './fullscreen.js'

export class WebXRMode extends Component {
}

export class WebXRButton extends Component {
}

export class WebXRSystem extends System {
    execute(delta, time) {
        this.queries.buttons.added.forEach(ent => {
            console.log("butotn added");
            let elem = document.createElement('button')
            elem.innerText = "webxr"
            elem.classList.add("webxr")
            elem.addEventListener('click',(e)=>{
                e.stopPropagation()
                e.preventDefault()
                ent.addComponent(WebXRButton)
            })
            document.documentElement.append(elem)
            console.log("added the element",elem)
        })
    }
}
WebXRSystem.queries = {
    buttons: {
        components: [ WebXRButton],
        listen: {
            added:true,
        }
    },
    active: {
        components: [WebXRMode],
        listen: {
            added:true,
        }
    }
}
