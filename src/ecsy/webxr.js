import { Component, System, World } from 'ecsy';
import {FullscreenMode} from './fullscreen.js'

export class WebXRActive extends Component {
}

export class WebXRButton extends Component {
    constructor() {
        super();
        this.currentSession = null
    }
}

export class WebXRController extends Component {
    constructor() {
        super()
        this.controller = null
        this.index = -1
        this.selected = false
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
        this.queries.controllers.added.forEach(ent => {
            const con = ent.getMutableComponent(WebXRController)
            // const domElement = document.querySelector("canvas")

            con.controller = renderer.xr.getController(con.index)
            con.controller.addEventListener('selectstart', (evt)=>{
                console.log("controller select start")
                con.selected = true
            });
            con.controller.addEventListener('selectend', (evt)=>{
                console.log("controller select end")
                con.selected = false
            });
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
    },
    controllers: {
        components: [WebXRController],
        listen: {
            added: true,
            removed: true
        }
    },
}




