import {Vector3, Mesh, MeshLambertMaterial, BoxBufferGeometry,
    CanvasTexture, PlaneGeometry, MeshBasicMaterial,
} from "three"
import {ECSComp} from "./ECSComp.js"

export default class VRStats extends ECSComp {
    constructor(app) {
        super();
        this.app = app
        // this.renderer = renderer
        const can = document.createElement('canvas')
        can.width = 256
        can.height = 128
        this.canvas = can
        const c = can.getContext('2d')
        c.fillStyle = '#00ffff'
        c.fillRect(0,0,can.width,can.height)
        const ctex = new CanvasTexture(can)
        const mesh = new Mesh(
            new PlaneGeometry(1,0.5),
            new MeshBasicMaterial({map:ctex})
        )
        mesh.position.z = -3
        mesh.position.y = 2.5
        mesh.material.depthTest = false
        mesh.material.depthWrite = false
        mesh.renderOrder = 1000
        // this.add(mesh)
        this.cmesh = mesh

        this.last = 0
        this.lastFrame = 0
        this.customProps = {}
        this.app.scene.add(mesh)
    }

    update(time) {
        if(time - this.last > 300) {
            // console.log("updating",this.rendereer.info)
            // console.log(`stats calls:`,this.renderer.info)

            const fps = ((this.app.renderer.info.render.frame - this.lastFrame)*1000)/(time-this.last)
            // console.log(fps)

            const c = this.canvas.getContext('2d')
            c.fillStyle = 'white'
            c.fillRect(0, 0, this.canvas.width, this.canvas.height)
            c.fillStyle = 'black'
            c.font = '16pt sans-serif'
            c.fillText(`calls: ${this.app.renderer.info.render.calls}`, 3, 20)
            c.fillText(`tris : ${this.app.renderer.info.render.triangles}`, 3, 40)
            c.fillText(`fps : ${fps.toFixed(2)}`,3,60)
            Object.keys(this.customProps).forEach((key,i) => {
                const val = this.customProps[key]
                c.fillText(`${key} : ${val}`,3,80+i*20)
            })
            this.cmesh.material.map.needsUpdate = true
            this.last = time
            this.lastFrame = this.app.renderer.info.render.frame
        }
    }

    setProperty(name, value) {
        this.customProps[name] = value
    }

}
