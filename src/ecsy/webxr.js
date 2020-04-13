import { Component, System, World } from '../../node_modules/ecsy/build/ecsy.module.js?module';
import {FullscreenMode} from './fullscreen.js'

export class WebXRActive extends Component {
}

export class WebXRButton extends Component {
    constructor() {
        super();
        this.currentSession = null
    }
}

export class WebXRSystem extends System {
    enterWebXR(ent) {
        console.log('trying to enter webxr')
        let state = ent.getMutableComponent(WebXRButton);
        if(state.currentSession === null) {
            navigator.xr.requestSession('immersive-vr').then(session=>{
                console.log("session has started")
                let onSessionEnded = () => {
                    console.log("session ended")
                    state.currentSession.removeEventListener('end',onSessionEnded)
                    renderer.vr.setSession(null)
                    ent.removeComponent(WebXRActive)
                }
                session.addEventListener('end',onSessionEnded)
                renderer.vr.setSession(session)
                state.currentSession = session
                ent.addComponent(WebXRActive)
            })
        } else {
            state.currentSession.end()
        }
    }
    execute(delta, time) {
        this.queries.buttons.added.forEach(ent => {
            console.log("button added");
            let elem = document.createElement('button')
            elem.innerText = "webxr"
            elem.classList.add("webxr")
            elem.addEventListener('click', (e) => {
                e.stopPropagation()
                e.preventDefault()
                this.enterWebXR(ent);
            })
            elem.disabled = true
            document.documentElement.append(elem)
            console.log("added the element", elem)

            if ( 'xr' in navigator && 'supportsSession' in navigator.xr ) {
                navigator.xr.supportsSession( 'immersive-vr' ).then(()=>{
                    console.log("immersive is supported");
                    elem.disabled = false
                }).catch((e)=>{
                    console.error(e)
                });
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
        components: [WebXRActive],
        listen: {
            added:true,
            removed:false,
        }
    }
}
