import { Component, System, World } from 'ecsy';

export class FullscreenMode extends Component {

}
export class FullscreenButton extends Component {

}
/*
        this.fullscreenchangeHandler = () => {
            if(document.fullscreenElement) return this._fire(FULLSCREEN_ENTERED, this)
            if(document.webkitFullscreenElement) return this._fire(FULLSCREEN_ENTERED, this)
            this._fire(FULLSCREEN_EXITED,this)
        }
        document.addEventListener('fullscreenchange',this.fullscreenchangeHandler)
        document.addEventListener('webkitfullscreenchange',this.fullscreenchangeHandler)

    playFullscreen() {
        this.resizeOnNextRepaint = true
        this.container.requestFullscreen()
    }

    exitFullscreen() {
        this.resizeOnNextRepaint = true
        if(document.exitFullscreen) document.exitFullscreen()
        if(document.webkitExitFullscreen) document.webkitExitFullscreen()
    }


 */
export class FullscreenSystem extends  System {
    execute(delta, time) {
        this.queries.buttons.added.forEach(ent => {
            let elem = document.createElement('button')
            elem.innerText = "fullscreen"
            elem.classList.add("fullscreen")
            elem.addEventListener('click',(e)=>{
                e.stopPropagation()
                e.preventDefault()
                ent.addComponent(FullscreenMode);
            })
            document.documentElement.append(elem);
        })
        this.queries.active.added.forEach(ent => {
            console.log("turned on full screen")
            this.fullscreenchangeHandler = () => {
                console.log("entered full screen")
                if(document.fullscreenElement || document.webkitFullscreenElement) {
                    console.log("entered")
                } else {
                    console.log("exited")
                }
            }
            document.addEventListener('fullscreenchange',this.fullscreenchangeHandler)
            document.addEventListener('webkitfullscreenchange',this.fullscreenchangeHandler)
            const domElement = document.querySelector("canvas")
            domElement.requestFullscreen()
        })
    }
}
FullscreenSystem.queries = {
    buttons: {
        components: [FullscreenButton],
        listen: {
            added:true
        }
    },
    active: {
        components: [FullscreenMode],
        listen: {
            added:true,
        }
    }
}
