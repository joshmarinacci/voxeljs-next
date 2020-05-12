import {Vector2, Vector3,} from "three"
import {ECSComp} from './ECSComp.js'
import {$, DIRS, on, toRad, traceRayAtScreenCoords} from './utils.js'

const Y_AXIS = new Vector3(0,1,0)
const SPEED = 0.1


export class TouchControls extends ECSComp {
    isTouchEnabled() {
        return ('ontouchstart' in document.documentElement)
    }
    constructor(app, distance, chunkManager) {
        super()
        this.app = app
        this.canvas = this.app.container
        this.distance = distance
        this.chunkManager = chunkManager

        this.dir_button = 'none'

        let point = new Vector2()
        let startAngleY = 0
        let startAngleX = 0
        let startTime = 0
        let timeoutID
        let intervalID
        let mode = 'node'
        let currentPoint=  new Vector2()
        this.touchStart = (e) => {
            e.preventDefault()
            startAngleY = this.app.stageRot.rotation.y
            startAngleX = this.app.stageRot.rotation.x
            if(e.changedTouches.length <= 0) return
            const tch = e.changedTouches[0]
            point.set(tch.clientX, tch.clientY)
            currentPoint.copy(point)
            startTime = Date.now()
            const res = traceRayAtScreenCoords(this.app,point, this.distance)
            res.hitPosition.add(res.hitNormal)
            res.hitPosition.floor()
            this._fire('highlight',res)
            timeoutID = setTimeout(this.startRemoval,1000)
        }
        this.startRemoval = () => {
            mode = 'remove'
            const res = traceRayAtScreenCoords(this.app,currentPoint, this.distance)
            res.hitPosition.floor()
            this._fire('highlight',res)
            this._fire('removeblock',res.hitPosition)
            intervalID = setInterval(this.removeAgain,500)
        }
        this.removeAgain = () => {
            const res = traceRayAtScreenCoords(this.app, currentPoint, this.distance)
            res.hitPosition.floor()
            this._fire('highlight',res)
            this._fire('removeblock',res.hitPosition)
        }
        this.touchMove = (e) => {
            e.preventDefault()
            if(e.changedTouches.length <= 0) return
            const tch = e.changedTouches[0]
            const pt2 = new Vector2(tch.clientX, tch.clientY)
            const diffx = pt2.x - point.x
            const diffy = pt2.y - point.y
            this.app.stageRot.rotation.y = +diffx/150 + startAngleY
            this.app.stageRot.rotation.x = +diffy/200 + startAngleX

            currentPoint.copy(pt2)
            const res = traceRayAtScreenCoords(this.app, pt2, this.distance)
            if(mode === 'add') {
                res.hitPosition.add(res.hitNormal)
            }
            res.hitPosition.floor()
            this._fire('highlight',res)

            if(this.mode === 'remove') {
                this._fire('removeblock',res.hitPosition)
            }
        }
        this.touchEnd = (e) => {
            e.preventDefault()
            clearTimeout(timeoutID)
            clearInterval(intervalID)
            mode = 'node'
            if(e.changedTouches.length <= 0) return
            const tch = e.changedTouches[0]
            const pt2 = new Vector2(tch.clientX, tch.clientY)

            const endTime = Date.now()
            if(point.distanceTo(pt2) < 10) {

                const res = traceRayAtScreenCoords(this.app, pt2, this.distance)
                if(endTime - startTime > 500) {
                    this._fire('removeblock',res.hitPosition)
                } else {
                    res.hitPosition.add(res.hitNormal)
                    this._fire('setblock', res.hitPosition)
                }
            }
        }

        this.attachButton = (b,dir) => {
            on(b,'touchstart',e => {
                e.preventDefault()
                e.stopPropagation()
                this.dir_button = dir
            })
            on(b,'touchmove',e => {
                e.preventDefault()
                e.stopPropagation()
            })
            on(b,'touchend',e => {
                e.preventDefault()
                e.stopPropagation()
                this.dir_button = DIRS.NONE
            })
            on(b,'mousedown',e => {
                e.preventDefault()
                this.dir_button = dir
            })
            on(b,'mouseup',e => {
                e.preventDefault()
                this.dir_button = DIRS.NONE
            })
        }
        this.attachButton ($("#left"),DIRS.LEFT)
        this.attachButton ($("#right"),DIRS.RIGHT)
        this.attachButton ($("#up"),DIRS.UP)
        this.attachButton ($("#down"),DIRS.DOWN)

        const overlay = $("#touch-overlay")
        const menuButton = document.createElement('button')
        menuButton.id = 'menu-button'
        overlay.appendChild(menuButton)
        menuButton.innerText = 'Menu'

        function setupTouchButton(sel,cb) {
            on(sel,'touchstart',e => {
                e.preventDefault()
                e.stopPropagation()
            })
            on(sel,'touchmove',e => {
                e.preventDefault()
                e.stopPropagation()
            })
            on(sel,'touchend',e => {
                e.preventDefault()
                e.stopPropagation()
                cb()
            })
            on(sel,'mousedown',e => {
                e.preventDefault()
                e.stopPropagation()
            })
            on(sel, 'mouseup', e => {
                e.preventDefault()
                e.stopPropagation()
                cb()
            })
        }
        setupTouchButton(menuButton,()=>this._fire('show-dialog',this))

        const exitButton = document.createElement('button')
        overlay.appendChild(exitButton)
        exitButton.innerText = 'Exit'
        exitButton.id = "exit-fullscreen"
        setupTouchButton(exitButton, ()=>this.app.exitFullscreen())

    }



    update() {
        if(this.dir_button === DIRS.LEFT) this.glideLeft()
        if(this.dir_button === DIRS.RIGHT) this.glideRight()
        if(this.dir_button === DIRS.UP) this.glideForward()
        if(this.dir_button === DIRS.DOWN) this.glideBackward()
    }
    enable() {
        super.enable()
        $("#touch-overlay").style.display = 'block'
        this.canvas.addEventListener('touchstart',this.touchStart,false)
        this.canvas.addEventListener('touchmove',this.touchMove,false)
        this.canvas.addEventListener('touchend',this.touchEnd,false)
    }
    disable() {
        if(!this.isEnabled()) return //don't recurse if already disabled
        super.disable()
        $("#touch-overlay").style.display = 'none'
        this.canvas.removeEventListener('touchstart',this.touchStart)
        this.canvas.removeEventListener('touchmove',this.touchMove)
        this.canvas.removeEventListener('touchend',this.touchEnd)
    }

    glideForward() {
        const vel = this.getSpeedDirection().multiplyScalar(-40)
        this.app.player_phys.vel.x = vel.x
        this.app.player_phys.vel.z = vel.z
        this.app.player_phys.markChanged()
    }
    glideBackward() {
        const vel = this.getSpeedDirection().multiplyScalar(40)
        this.app.player_phys.vel.x = vel.x
        this.app.player_phys.vel.z = vel.z
        this.app.player_phys.markChanged()
    }
    getSpeedDirection() {
        const dir = new Vector3(0,0,1)
        dir.applyAxisAngle(Y_AXIS, -this.app.stageRot.rotation.y)
        return dir.normalize().multiplyScalar(SPEED)
    }
    glideLeft() {
        const vel = this.getSpeedDirection().multiplyScalar(40).applyAxisAngle(Y_AXIS,toRad(-90))
        this.app.player_phys.vel.x = vel.x
        this.app.player_phys.vel.z = vel.z
        this.app.player_phys.markChanged()
    }
    glideRight() {
        // this.app.stagePos.position.add(this.getSpeedDirection().applyAxisAngle(Y_AXIS,toRad(-90)))
        const vel = this.getSpeedDirection().multiplyScalar(40).applyAxisAngle(Y_AXIS,toRad(90))
        this.app.player_phys.vel.x = vel.x
        this.app.player_phys.vel.z = vel.z
        this.app.player_phys.markChanged()
    }
}
