import {Raycaster} from "./raycaster.js"
import {
    Object3D,
    Vector2,
    Vector3,
    Quaternion,
    BufferGeometry,
    Float32BufferAttribute,
    LineBasicMaterial,
    NormalBlending,
    SphereBufferGeometry,
    Line,
    Mesh,
    MeshLambertMaterial,
} from "three"

export const POINTER_ENTER = "enter"
export const POINTER_EXIT = "exit"
export const POINTER_CLICK = "click"
export const POINTER_MOVE = "move"
export const POINTER_PRESS = "press"
export const POINTER_RELEASE = "release"


const toRad = (degrees) => degrees*Math.PI/180

export class Pointer {
    constructor(app, opts) {
        this.scene = app.scene
        this.renderer = app.renderer
        this.camera = app.camera
        this.listeners = {}
        this.opts = opts || {}
        this.opts.enableLaser = (this.opts.enableLaser !== undefined) ? this.opts.enableLaser : true
        this.opts.laserLength = (this.opts.laserLength !== undefined) ? this.opts.laserLength : 3
        this.canvas = this.renderer.domElement

        this.raycaster = new Raycaster()
        this.waitcb = null
        this.hoverTarget = null

        this.intersectionFilter = this.opts.intersectionFilter || ((o) => true)
        this.raycaster.recurseFilter = this.opts.recurseFilter || (()=> true)
        this.multiTarget = this.opts.multiTarget || false


        // setup the mouse
        this.canvas.addEventListener('mousemove', this.mouseMove.bind(this))
        this.canvas.addEventListener('click', this.mouseClick.bind(this))
        this.canvas.addEventListener('mousedown',this.mouseDown.bind(this))
        this.canvas.addEventListener('mouseup',this.mouseUp.bind(this))

        //touch events
        this.canvas.addEventListener('touchstart',this.touchStart.bind(this))
        this.canvas.addEventListener('touchmove',this.touchMove.bind(this))
        this.canvas.addEventListener('touchend',this.touchEnd.bind(this))

        // setup the VR controllers
        this.controller1 = this.renderer.vr.getController(0);
        this.controller1.addEventListener('selectstart', this.controllerSelectStart.bind(this));
        this.controller1.addEventListener('selectend', this.controllerSelectEnd.bind(this));


        this.controller2 = this.renderer.vr.getController(1);
        this.controller2.addEventListener('selectstart', this.controllerSelectStart.bind(this));
        this.controller2.addEventListener('selectend', this.controllerSelectEnd.bind(this));

        this.setMouseSimulatesController(opts.mouseSimulatesController)

        this.scene.add(this.controller1);
        this.scene.add(this.controller2);



        if(this.opts.enableLaser) {
            //create visible lines for the two controllers
            const geometry = new BufferGeometry()
            geometry.addAttribute('position', new Float32BufferAttribute([0, 0, 0, 0, 0, -this.opts.laserLength], 3));
            geometry.addAttribute('color', new Float32BufferAttribute([1.0, 0.5, 0.5, 0, 0, 0], 3));

            const material = new LineBasicMaterial({
                vertexColors: false,
                color: 0x880000,
                linewidth: 5,
                blending: NormalBlending
            })

            this.controller1.add(new Line(geometry, material));
            this.controller2.add(new Line(geometry, material));
        }

    }

    //override this to do something w/ the controllers on every tick
    tick(time) {
        this.controllerMove(this.controller1)
        this.controllerMove(this.controller2)
    }


    fire(obj, type, payload) {
        obj.dispatchEvent(payload)
    }
    fireSelf(type,payload) {
        if(!this.listeners[type]) return
        this.listeners[type].forEach(cb => cb(payload))
    }

    //make the camera follow the mouse in desktop mode. Helps w/ debugging.
    cameraFollowMouse(e) {
        const bounds = this.canvas.getBoundingClientRect()
        const ry = ((e.clientX - bounds.left) / bounds.width) * 2 - 1
        const rx = 1 - ((e.clientY - bounds.top) / bounds.height) * 2
        this.camera.rotation.y = -ry*2
        this.camera.rotation.x = +rx
    }

    mouseMove(e) {
        const mouse = new Vector2()
        const bounds = this.canvas.getBoundingClientRect()
        mouse.x = ((e.clientX - bounds.left) / bounds.width) * 2 - 1
        mouse.y = -((e.clientY - bounds.top) / bounds.height) * 2 + 1
        this.raycaster.setFromCamera(mouse, this.camera)
        if(this.opts.mouseSimulatesController) {
            //create target from the mouse controls
            const target = new Vector3()
            target.x = mouse.x
            target.y = mouse.y
            target.z = -3
            //convert to camera space
            target.add(this.camera.position)
            this.spot.position.copy(target)
            this.controller1.lookAt(target)
            //have to flip over because the UP is down on controllers
            const flip = new Quaternion().setFromAxisAngle(new Vector3(0,1,0),toRad(180))
            this.controller1.quaternion.multiply(flip)
        }
        this._processMove()

        if(this.opts.cameraFollowMouse) this.cameraFollowMouse(e)
    }

    touchStart(e) {
        e.preventDefault()
        if(e.changedTouches.length <= 0) return
        const tch = e.changedTouches[0]
        const mouse = new Vector2()
        const bounds = this.canvas.getBoundingClientRect()
        mouse.x = ((tch.clientX - bounds.left) / bounds.width) * 2 - 1
        mouse.y = -((tch.clientY - bounds.top) / bounds.height) * 2 + 1
        this.raycaster.setFromCamera(mouse, this.camera)
        const intersects = this.raycaster.intersectObjects(this.scene.children, true)
            .filter(it => this.intersectionFilter(it.object))
        intersects.forEach((it,i) => {
            this.fire(it.object, POINTER_PRESS, {type: POINTER_PRESS})
        })
    }
    touchMove(e) {
        e.preventDefault()
        if(e.changedTouches.length <= 0) return
        const tch = e.changedTouches[0]
        const mouse = new Vector2()
        const bounds = this.canvas.getBoundingClientRect()
        mouse.x = ((tch.clientX - bounds.left) / bounds.width) * 2 - 1
        mouse.y = -((tch.clientY - bounds.top) / bounds.height) * 2 + 1
        this.raycaster.setFromCamera(mouse, this.camera)
        this._processMove()
    }
    touchEnd(e) {
        e.preventDefault()
        if(e.changedTouches.length <= 0) return
        const tch = e.changedTouches[0]
        const mouse = new Vector2()
        const bounds = this.canvas.getBoundingClientRect()
        mouse.x = ((tch.clientX - bounds.left) / bounds.width) * 2 - 1
        mouse.y = -((tch.clientY - bounds.top) / bounds.height) * 2 + 1
        this.raycaster.setFromCamera(mouse, this.camera)
        const intersects = this.raycaster.intersectObjects(this.scene.children, true)
            .filter(it => this.intersectionFilter(it.object))
        intersects.forEach((it) => {
            this.fire(it.object, POINTER_RELEASE, {type: POINTER_RELEASE, point: it.point})
        })
        this._processClick()
    }

    controllerMove(controller) {
        if(!controller.visible) return
        const c = controller
        const dir = new Vector3(0, 0, -1)
        dir.applyQuaternion(c.quaternion)
        this.raycaster.set(c.position, dir)
        this._processMove()
    }

    _processMove() {
        const intersects = this.raycaster.intersectObjects(this.scene.children, true)
            .filter(it => this.intersectionFilter(it.object))

        if(intersects.length === 0 && this.hoverTarget) {
            this.fire(this.hoverTarget, POINTER_EXIT, {type: POINTER_EXIT})
            this.hoverTarget = null
        }
        if(intersects.length >= 1) {
            const it = intersects[0]
            const obj = it.object
            if (!obj) return
            this.fire(obj, POINTER_MOVE, {type: POINTER_MOVE, point: it.point, intersection:it})
            if (obj === this.hoverTarget) {
                //still inside
            } else {
                if (this.hoverTarget)
                    this.fire(this.hoverTarget, POINTER_EXIT, {type: POINTER_EXIT})
                this.hoverTarget = obj
                this.fire(this.hoverTarget, POINTER_ENTER, {type: POINTER_ENTER})
            }
        }
    }

    _processClick() {
        if (this.waitcb) {
            this.waitcb()
            this.waitcb = null
            return
        }

        const intersects = this.raycaster.intersectObjects(this.scene.children, true)
            .filter(it => this.intersectionFilter(it.object))
        if(intersects.length > 0) {
            const it = intersects[0]
            this.fire(it.object, POINTER_CLICK, {type: POINTER_CLICK, point: it.point, intersection:it})
        } else {
            this.fireSelf(POINTER_CLICK, {type: POINTER_CLICK})
        }
    }
    mouseClick(e) {
        const mouse = new Vector2()
        const bounds = this.canvas.getBoundingClientRect()
        mouse.x = ((e.clientX - bounds.left) / bounds.width) * 2 - 1
        mouse.y = -((e.clientY - bounds.top) / bounds.height) * 2 + 1
        this.raycaster.setFromCamera(mouse, this.camera)
        this._processClick()
    }
    mouseDown(e) {
        const mouse = new Vector2()
        const bounds = this.canvas.getBoundingClientRect()
        mouse.x = ((e.clientX - bounds.left) / bounds.width) * 2 - 1
        mouse.y = -((e.clientY - bounds.top) / bounds.height) * 2 + 1
        this.raycaster.setFromCamera(mouse, this.camera)
        const intersects = this.raycaster.intersectObjects(this.scene.children, true)
            .filter(it => this.intersectionFilter(it.object))

        intersects.forEach((it,i) => {
            if(!this.multiTarget && i > 0) return
            this.fire(it.object, POINTER_PRESS, {type: POINTER_PRESS, point: it.point, intersection:it})
        })
    }
    mouseUp(e) {
        const mouse = new Vector2()
        const bounds = this.canvas.getBoundingClientRect()
        mouse.x = ((e.clientX - bounds.left) / bounds.width) * 2 - 1
        mouse.y = -((e.clientY - bounds.top) / bounds.height) * 2 + 1
        this.raycaster.setFromCamera(mouse, this.camera)
        const intersects = this.raycaster.intersectObjects(this.scene.children, true)
            .filter(it => this.intersectionFilter(it.object))
        intersects.forEach((it,i) => {
            if(!this.multiTarget && i > 0) return //skip all but the first
            this.fire(it.object, POINTER_RELEASE, {type: POINTER_RELEASE, point: it.point, intersection:it})
        })
    }

    controllerSelectStart(e) {
        e.target.userData.isSelecting = true;
        const intersects = this.raycaster.intersectObjects(this.scene.children, true)
            .filter(it => this.intersectionFilter(it.object))
        intersects.forEach((it,i) => {
            if(!this.multiTarget && i > 0) return //skip all but the first
            this.fire(it.object, POINTER_PRESS, {type: POINTER_PRESS, point: it.point, intersection:it})
        })
    }

    controllerSelectEnd(e) {
        e.target.userData.isSelecting = false;
        const c = e.target
        const dir = new Vector3(0, 0, -1)
        dir.applyQuaternion(c.quaternion)
        this.raycaster.set(c.position, dir)
        const intersects = this.raycaster.intersectObjects(this.scene.children, true)
            .filter(it => this.intersectionFilter(it.object))
        intersects.forEach((it,i) => {
            if(!this.multiTarget && i > 0) return //skip all but the first
            this.fire(it.object, POINTER_RELEASE, {type: POINTER_RELEASE, point: it.point})
        })
        this._processClick()
    }

    waitSceneClick(cb) {
        this.waitcb = cb
    }


    addEventListener(type,cb) {
        this.on(type,cb)
    }
    on(type,cb) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].push(cb)
    }
    off(type,cb) {
        this.listeners[type] = this.listeners[type].filter(c => c !== cb)
    }
    setMouseSimulatesController(val) {
        this.opts.mouseSimulatesController = val
        if(this.opts.mouseSimulatesController) {
            this.controller1 = new Group()
            this.controller1.position.set(0,1,-2)
            this.controller1.quaternion.setFromUnitVectors(Object3D.DefaultUp, new Vector3(0,0,1))
            this.spot = new Mesh(
                new SphereBufferGeometry(0.1),
                new MeshLambertMaterial({color: 'red'})
            )
            this.scene.add(this.spot)
        } else {
        }

    }
}
