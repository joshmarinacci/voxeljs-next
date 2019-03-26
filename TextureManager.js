import {
    Color,
    DoubleSide,
    FaceColors,
    LinearMipMapLinearFilter,
    MeshBasicMaterial,
    MeshLambertMaterial,
    NearestFilter,
    MeshFaceMaterial,
    Texture,
    ShaderMaterial,
    Vector2,
    VertexColors,
} from "./node_modules/three/build/three.module.js"

const createAtlas = window.atlaspack

export class TextureManager {
    constructor() {
        this.canvas = document.createElement('canvas')
        this.canvas.width = 128;
        this.canvas.height = 128;
        this.atlas = createAtlas(this.canvas);
        this.atlas.tilepad = false // this will cost 8x texture memory.
        this.animated = {}
        const ctx = this.canvas.getContext('2d')

        this.texturesEnabled = true
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, this.canvas.width/2, this.canvas.height/2);
        ctx.fillStyle = 'blue';
        ctx.fillRect(this.canvas.width/2, this.canvas.height/2,this.canvas.width/2,this.canvas.height/2);
        ctx.fillStyle = 'yellow'
        ctx.fillRect(0, this.canvas.height/2,this.canvas.width/2,this.canvas.height/2);
        ctx.fillStyle = 'green'
        ctx.fillRect(this.canvas.width/2, 0,this.canvas.width/2,this.canvas.height/2);

        ctx.fillStyle = 'purple';
        ctx.fillRect(0+4, 0+4, this.canvas.width/2-8, this.canvas.height/2-8);

        this.texture = new Texture(this.canvas);
        this.texture.needsUpdate = true
        this.texture.magFilter = NearestFilter;
        this.texture.minFilter = LinearMipMapLinearFilter;
        this.texturePath =  './textures/';
        this.material = new ShaderMaterial( {
            uniforms: {
                'uTime': { value: 0.0 },
                texture: { value: this.texture},
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
                uniform sampler2D texture;
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
                    // fuv.x = sr.x + fract(vUv.x*vRepeat.x+uTime)*sr.z;
                    fuv.y = sr.y + fract(vUv.y*vRepeat.y)*sr.w;   
                    vec4 color = vec4(1.0,1.0,1.0,1.0);
                    if(texturesEnabled) {
                        color = texture2D(texture, fuv);
                    }
                    color = color*(vOcclusion);
                    gl_FragColor = vec4(color.xyz,1.0);
                }
            `,
        } );
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
        const uvs = this.atlas.uv()[this.names[typeNum-1]]
        if(!uvs) return [[0,0],[0,1],[1,1],[1,0]]
        return uvs
    }

    lookupInfoForBlockType(typeNum) {
        const index = this.getAtlasIndex()
        const name = this.names[typeNum-1]
        const found = index.find(info => info.name === name)
        if(!found) return { animated:false }
        return found
    }

    getAtlasIndex() {
        const index = this.atlas.index()
        index.forEach(info => {
            info.animated = this.animated[info.name]?true:false
        })
        return index
    }


    getBlockTypeForName(name) {
        return this.names.findIndex(n => n===name)+1
    }


    load(names) {
        if (!Array.isArray(names)) names = [names];
        this.names = names
        const proms = names.map(name => this.pack(name))
        return Promise.all(proms).then(()=>{
            // document.body.appendChild(this.canvas)
            this.texture.needsUpdate = true
        })
    }

    markAsAnimated(name) {
        this.animated[name] = true
    }

    pack(name) {
        return new Promise((res,rej)=>{
            const img = new Image()
            img.id = name;
            img.src = this.texturePath + ext(name);
            img.onload = () => {
                const node = this.atlas.pack(img)
                if(node === false) {
                    this.atlas = this.atlas.expand(img)
                }
                res(img)
            }
            img.onerror = (e) => {
                console.error('Couldn\'t load URL [' + img.src + ']');
                rej(e)
            };
        })
    };

}

function ext(name) {
    return (String(name).indexOf('.') !== -1) ? name : name + '.png';
}
