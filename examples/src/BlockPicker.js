import Panel2D from "threejs-2d-components/src/panel2d"
import Label2D from "threejs-2d-components/src/label2d"
import Button2D from "threejs-2d-components/src/button2d"


const on = (elem, type, cb) => elem.addEventListener(type,cb)

class BlockTypeButton extends Button2D {
    draw(ctx) {
        ctx.font = `${this.fsize}px sans-serif`
        const metrics = ctx.measureText(this.text)
        // this.w = 5 + metrics.width + 5
        // this.h = 0 + this.fsize + 4
        ctx.fillStyle = this.bg
        ctx.fillRect(this.x,this.y,this.w,this.h)
        ctx.fillStyle = 'black'
        ctx.fillText(this.text,this.x+3,this.y+this.fsize-2)
        ctx.strokeStyle = 'black'
        ctx.strokeRect(this.x,this.y,this.w,this.h)


        // const x = (i%4)*64
        // const y = Math.floor((i/4))*64
        ctx.fillStyle = 'red'
        ctx.fillRect(this.x,this.y,64,64)
        let info = this.info
        ctx.drawImage(this.owner.app.chunkManager.textureManager.canvas,
            info.x,info.y,info.w,info.h,
            this.x,this.y,64,64
        )

        if(this.owner.selectedColor === this.text) {
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'black'
            ctx.strokeRect(this.x+2,this.y+2,64-4,64-4)
            ctx.strokeStyle = 'white'
            ctx.strokeRect(this.x+4,this.y+4,64-8,64-8)
        }
    }
}

export class BlockPicker {
    constructor(app) {
        this.app = app
        this.panel = new Panel2D(app.scene,app.camera, {
            draggable: false,
            width: 256,
            height: 256,
        })
        this.app.scene.add(this.panel)
        this.selectedColor = 'none'
    }

    rebuild() {
        this.panel.removeAll()
        this.panel.add(new Label2D().set('text','block type').set('x',20).set('y',0))
        const index = this.app.chunkManager.textureManager.getAtlasIndex()
        index.forEach((info,i) => {
            const button = new BlockTypeButton().setAll({
                text:info.name,
                x:(i%4)*64,
                y:Math.floor(i/4)*64+40,
                w:64,
                h:64,
                owner:this,
                info:info,
            },info.name)
            on(button,'click',()=>{
                console.log("selected block", info.name)
                const infos = this.app.chunkManager.textureManager.getAtlasIndex()
                if(infos[i]) {
                    this.selectedColor = infos[i].name
                    this.panel.redraw()
                } else {
                    console.log("nothing selected")
                }
            })
            this.panel.add(button)
        })

        this.panel.add(new Button2D().setAll({
            text:this.app.active?'creative':'active',
            x:10,
            y:225,
            w:40,
            h:40,
        }).on('click',()=>{
            console.log('toggling creative mode')
            this.app.active = !this.app.active
            this.app.player_phys.endFlying()
            this.panel.visible = false
        }))
        this.panel.add(new Button2D().setAll({
            text:'close',
            x: 190,
            y: 225,
        }).on('click',()=>{
            this.panel.visible = false
        }))
    }

    setSelectedToDefault() {
        // const index = this.app.chunkManager.textureManager.getAtlasIndex()
        // this.selectedColor = index[0].name
    }
    /*
    redraw() {
        const ctx = this.canvas.getContext('2d')
        ctx.fillStyle = 'white'
        ctx.fillRect(0,0,this.canvas.width,this.canvas.height)
        const index = this.app.textureManager.getAtlasIndex()
        index.forEach((info,i) => {
            const x = (i%4)*64
            const y = Math.floor((i/4))*64
            ctx.fillStyle = 'red'
            ctx.fillRect(x,y,64,64)
            ctx.drawImage(this.app.textureManager.canvas,
                info.x,info.y,info.w,info.h,
                x,y,64,64
            )

            if(this.selectedColor === info.name) {
                ctx.lineWidth = 2;
                ctx.strokeStyle = 'black'
                ctx.strokeRect(x+2,y+2,64-4,64-4)
                ctx.strokeStyle = 'white'
                ctx.strokeRect(x+4,y+4,64-8,64-8)
            }
        })
    }
    */
}
