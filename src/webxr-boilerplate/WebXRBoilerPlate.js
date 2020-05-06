import {DefaultLoadingManager, PerspectiveCamera, Scene, WebGLRenderer,} from "three"
import VRManager, {VR_DETECTED} from "./vrmanager.js";

export const FULLSCREEN_ENTERED = "fullscreenenter"
export const FULLSCREEN_EXITED = "fullscreenexit"
export default class WebXRBoilerPlate {
    constructor(options) {
        this.listeners = {}
        this.container = options.container
        this.resizeOnNextRepaint = false

        //polyfill the container for fullscreen support
        if(!container.requestFullscreen) {
            if(container.webkitRequestFullscreen) {
                container.requestFullscreen = container.webkitRequestFullScreen
            }
        }
    }
    addEventListener(type,cb) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].push(cb)
    }
    _fire(type,payload) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].forEach(cb => cb(payload))
    }

    isFullscreenSupported() {
        return this.container.requestFullscreen?true:false
    }

    init() {
        this.scene = new Scene();
        this.camera = new PerspectiveCamera(70, this.container.clientWidth / this.container.clientHeight, 0.1, 50);
        this.renderer = new WebGLRenderer({antialias: true});
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.gammaOutput = true
        this.renderer.vr.enabled = true;
        this.container.appendChild(this.renderer.domElement);
        this.vrmanager = new VRManager(this.renderer)
        this.vrmanager.addEventListener(VR_DETECTED, ()=> this._fire(VR_DETECTED,this))

        this.loadingManager = DefaultLoadingManager

        DefaultLoadingManager.joshtest = true
        DefaultLoadingManager.onStart = (url, loaded, total) => {
            console.log(`XR: loading ${url}.  loaded ${loaded} of ${total}`)
        }
        DefaultLoadingManager.onLoad = () => {
            console.log(`XR: loading complete`)
            if (this.listeners.loaded) this.listeners.loaded.forEach(cb => cb(this))
        }
        DefaultLoadingManager.onProgress = (url, loaded, total) => {
            console.log(`XR: prog ${url}.  loaded ${loaded} of ${total}`)
            if(this.listeners.progress) this.listeners.progress.forEach(cb => cb(loaded/total))
        }
        DefaultLoadingManager.onError = (url) => {
            console.log(`XR: error loading ${url}`)
        }

        this.lastSize = { width: 0, height: 0}
        this.render = (time) => {
            if (this.onRenderCb) this.onRenderCb(time,this)
            this.checkContainerSize()
            this.renderer.render(this.scene, this.camera);
        }

        this.renderer.setAnimationLoop(this.render)

        this.fullscreenchangeHandler = () => {
            if(document.fullscreenElement) return this._fire(FULLSCREEN_ENTERED, this)
            if(document.webkitFullscreenElement) return this._fire(FULLSCREEN_ENTERED, this)
            this._fire(FULLSCREEN_EXITED,this)
        }
        document.addEventListener('fullscreenchange',this.fullscreenchangeHandler)
        document.addEventListener('webkitfullscreenchange',this.fullscreenchangeHandler)

        return new Promise((res, rej) => {
            res(this)
        })
    }


    onRender(cb) {
        this.onRenderCb = cb
    }

    enterVR() {
        this.vrmanager.enterVR()
    }

    playFullscreen() {
        this.resizeOnNextRepaint = true
        this.container.requestFullscreen()
    }

    exitFullscreen() {
        this.resizeOnNextRepaint = true
        if(document.exitFullscreen) document.exitFullscreen()
        if(document.webkitExitFullscreen) document.webkitExitFullscreen()
    }

    checkContainerSize() {
        if(this.lastSize.width !== this.container.clientWidth || this.lastSize.height !== this.container.clientHeight) {
            this.lastSize.width = this.container.clientWidth
            this.lastSize.height = this.container.clientHeight
            this.camera.aspect = this.lastSize.width / this.lastSize.height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.lastSize.width, this.lastSize.height);
        }
    }
}
