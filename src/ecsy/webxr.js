import { Component, System, World } from '../../node_modules/ecsy/build/ecsy.module.js?module';
import {FullscreenMode} from './fullscreen.js'

export class WebXRMode extends Component {
}

export class WebXRButton extends Component {
}

export class WebXRSystem extends System {
    execute(delta, time) {
        this.queries.buttons.added.forEach(ent => {
            console.log("button added");
            let elem = document.createElement('button')
            elem.innerText = "webxr"
            elem.classList.add("webxr")
            elem.addEventListener('click', (e) => {
                e.stopPropagation()
                e.preventDefault()
                ent.addComponent(WebXRButton)
            })
            elem.disabled = true
            document.documentElement.append(elem)
            console.log("added the element", elem)

            if ('xr' in navigator) {
                console.log("has webxr")
                elem.disabled = false
                /*
                navigator.xr.requestDevice().then((device) => {
                    device.supportsSession({immersive: true})
                        .then(() => {
                            this.device = device
                            this.fire(VR_DETECTED,{})
                        })
                        .catch(printError);

                }).catch(printError);*/
            } else {
                console.log("does not have webxr");
            }
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
