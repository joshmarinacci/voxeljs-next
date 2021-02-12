import {
    LinearMipMapLinearFilter,
    NearestFilter,
    ShaderMaterial,
    Texture,
    VertexColors
} from "three"

// const createAtlas = window.atlaspack

/*

* get what I have working w/o the atlas function
* switch to 17 x 17 to address lines
* manually create mip-maps as additional smaller textures

* check out sample3D texture polyfill

*/



export class TextureManager {
    constructor(opts) {
        this.canvas = document.createElement('canvas')
        this.canvas.setAttribute('id','texture')
        // document.getElementsByTagName('body')[0].appendChild(this.canvas)
        this.aoEnabled = opts.aoEnabled || false
        this.canvas.width = 128;
        this.canvas.height = 128;
        this.canvas.style.width = '512px';
        this.canvas.style.height = '512px';
        this.tiles = []
        // this.atlas = createAtlas(this.canvas);
        // this.atlas.tilepad = true // this will cost 8x texture memory.
        this.animated = {}
        const ctx = this.canvas.getContext('2d')

        this.texturesEnabled = true
        ctx.fillStyle = 'red'
        ctx.fillRect(0,0,this.canvas.width,this.canvas.height)

        this.texture = new Texture(this.canvas);
        this.texture.needsUpdate = true
        this.texture.magFilter = NearestFilter;
        this.texture.minFilter = NearestFilter;
        this.texturePath =  './textures/';
        this.material = new ShaderMaterial( {
            uniforms: {
                'uTime': { value: 0.0 },
                textureSamp: { value: this.texture},
                texturesEnabled: { value: this.texturesEnabled },
            },
            vertexColors:VertexColors,
            vertexShader: `
            attribute vec2 repeat;
            attribute vec4 subrect;
            attribute float frameCount;
            attribute float occlusion;
            varying vec2 vUv;
            varying vec2 vRepeat;
            varying vec4 vSubrect;
            varying float vFrameCount;
            varying float vOcclusion;
            void main() {
                vUv = uv;
                vSubrect = subrect;
                vRepeat = repeat;
                vFrameCount = frameCount;
                vOcclusion = occlusion;
                vec4 mvPosition = modelViewMatrix * vec4(position,1.0);
                gl_Position = projectionMatrix * mvPosition;
            } 
            `,
            fragmentShader: `
                uniform sampler2D textureSamp;
                uniform float uTime;
                uniform bool texturesEnabled;
                varying vec2 vUv;
                varying vec2 vRepeat;
                varying vec4 vSubrect;
                varying float vFrameCount;
                varying float vOcclusion;
                void main() {
                    vec2 fuv = vUv;
                    vec4 sr = vSubrect;
                    //sr.z = sub rect width
                    //sr.w = sub rect height
                    float frameCount = 3.0;
                    // float cframe = mod(uTime,frameCount);
                    float cframe = mod(uTime,vFrameCount);
                    float cframe2 = floor(cframe); 
                    sr.x = sr.x + cframe2*sr.z;
                    fuv.x = sr.x + fract(vUv.x*vRepeat.x)*sr.z;
                    fuv.y = sr.y + fract(vUv.y*vRepeat.y)*sr.w;
                    vec4 color = vec4(1.0,1.0,1.0,1.0);
                    
                    if(texturesEnabled) {
                        color = texture2D(textureSamp, fuv);
                    }
                    color = color*(vOcclusion);
                    gl_FragColor = vec4(color.xyz,1.0);
                }
            `,
        } );
    }

    packImage(img,index) {
        const info = {
            index:index,
            image:img,
            x:0,
            y:0,
            w:16,
            h:16,
        }
        info.x = (info.index*16)%128 + (info.index)*2 + 1
        info.y = Math.floor(info.index/8)*16 + 1
        const ctx = this.canvas.getContext('2d')
        ctx.imageSmoothingEnabled = false
        //draw image center
        ctx.drawImage(img,info.x,info.y, info.w, info.h)
        //left edge
        ctx.drawImage(img,
            0,0,1,info.h,
            info.x-1,info.y,1,info.h)
        //right edge
        ctx.drawImage(img,
            info.w-1,0,1,info.h,
            info.x+info.w,info.y,1,info.h)
        //top edge
        ctx.drawImage(img,
            0,0,info.w,1,
            info.x,info.y-1,info.w,1)
        ctx.drawImage(img,
            0,info.h-1,info.w,1,
            info.x,info.y+info.h,info.w,1)

        ctx.fillStyle = 'yellow'
        // ctx.fillRect(info.x,info.y,info.w,info.h)
        this.texture.needsUpdate = true
        return info
    }



    isEnabled() {
        return true
    }

    update(ttime) {
        const time = ttime/1000
        this.material.uniforms.uTime.value = time;
        this.material.uniforms.texturesEnabled.value = this.texturesEnabled
    }

    lookupUVsForBlockType(typeNum) {
        const info = this.tiles[typeNum]
        if(!info) {
            const x = 0 / 8.0
            const x2 = 1 / 8.0
            const y = 0
            const y2 = 1 / 8.0
            return [[x, y], [x2, y], [x2, y2], [x, y2]]
        }
        // console.log(x)
        // console.log("looking up type number",typeNum,info)
        const x = info.x/128
        const y = info.y/128
        const x2 = (info.x+info.w)/128
        const y2 = (info.y+info.h)/128
        return [[x,y],[x2,y],[x2,y2],[x,y2]]
        /*
        return [
            [info.x/128,info.y/128],
            [info.x/128,(info.y+info.h)/128],
            [(info.x+info.w)/128,(info.y)/128],
            [(info.x+info.w)/128,(info.y+info.h)/128],
        ]
         */
        // const uvs = this.atlas.uv()[this.names[typeNum-1]]
        // if(!uvs) return [[0,0],[0,1],[1,1],[1,0]]
        // return [[0.0,0],[0.0,1],[0,1],[1,0]]
        // return uvs
    }

    lookupInfoForBlockType(typeNum) {
        return {
            animated:false
        }
    }


    getBlockTypeForName(name) {
        return this.names.findIndex(n => n===name)+1
    }



    loadTextures(infos) {
        const proms = infos.map((info,index) => {
            console.log("loading",info.src)
            return new Promise((res,rej)=>{
                const img = new Image()
                img.id = info.src
                img.src = info.src
                img.onload = () => {
                    res(this.packImage(img,index))
                }
                img.onerror = (e) => {
                    console.error(`Couldn't load texture from url ${infos.src}`)
                    rej(e)
                }
            })
        })
        return Promise.all(proms).then((infos)=>{
            this.tiles = infos
            this.texture.needsUpdate = true
        })
    }

}

function ext(name) {
    return (String(name).indexOf('.') !== -1) ? name : name + '.png';
}
