import { Component, System, World } from 'ecsy';
import {VoxelLandscape, VoxelSystem, VoxelTextures} from './voxels.js'
import {ActiveBlock, Highlight, HighlightSystem} from './highlight.js'
import {InputFrame} from './input.js'

export class DomDashboard extends Component {
    constructor() {
        super();
        this.domElement = null
    }
}

export class DashboardVisible extends Component {

}

export class DashboardDOMOvleraySystem extends System {
    execute(delta, time) {
        this.queries.dash.added.forEach(me=>{
            const dash = me.getComponent(DomDashboard);
            let div = document.createElement('div');
            div.classList.add("dom-dashboard");
            div.addEventListener('mousedown',e => e.stopPropagation());
            div.addEventListener('mouseup',e => e.stopPropagation());
            div.addEventListener('mousemove',e => e.stopPropagation());
            document.documentElement.append(div)

            this.queries.textures.results.forEach(ent => {
                console.log("textures are", ent.getComponent(VoxelTextures))
                let texs = ent.getComponent(VoxelTextures).textures
                texs.forEach((tex,i) => {
                    console.log("adding texture",tex);
                    let img = document.createElement('img')
                    img.src = tex.src;
                    div.append(img);
                    img.addEventListener('click',(e)=>{
                        e.preventDefault();
                        e.stopPropagation()
                        console.log(`chose this image ${i}`,i)
                        this.queries.active.results.forEach(ent=>{
                            ent.getMutableComponent(ActiveBlock).type = i
                        })
                    })
                })
            })
            let dismiss = document.createElement('button');
            dismiss.innerHTML = "dismiss"
            dismiss.addEventListener('click',()=>{
                this.queries.visible.results.forEach(ent => {
                    ent.removeComponent(DashboardVisible)
                })
            })
            div.append(dismiss)
            dash.domElement = div
        })
        this.queries.input.results.forEach(ent => {
            let input = ent.getComponent(InputFrame)
            if (input.state[InputFrame.OPEN_DASHBOARD] === true) {
                this.queries.dash.results.forEach(dash_ent => {
                    if(!dash_ent.hasComponent(DashboardVisible)) {
                        dash_ent.addComponent(DashboardVisible)
                    }
                })
            }
        })
        this.queries.visible.added.forEach(ent => {
            console.log("made visible")
            ent.getMutableComponent(DomDashboard).domElement.classList.add('visible')
        })
        this.queries.visible.removed.forEach(ent => {
            console.log("made in-visible")
            ent.getMutableComponent(DomDashboard).domElement.classList.remove('visible')
        })
    }
}
DashboardDOMOvleraySystem.queries = {
    dash: {
        components:[DomDashboard],
        listen: {
            added:true,
        }
    },
    visible: {
        components:[DashboardVisible, DomDashboard],
        listen: {
            added:true,
            removed:true,
        }
    },
    input: {
        components:[InputFrame]
    },
    textures: {
        components:[VoxelTextures],
    },
    active: {
        components:[ActiveBlock]
    },
}

