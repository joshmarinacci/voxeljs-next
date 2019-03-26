
function GET_JSON(url) {
    return fetch(url+`?cachebust=${Math.random()}`)
        .then(res => res.json())
        // .then(res => {
        //     return res
            // const blocks = game.blockService.loadFromJSON(res)
            // blocks.forEach(b => {
            //     on(b.getObject3D(), 'click', blockClicked)
            // })
            // dataChanger.fire('changed',{})
        // })
}
function POST_JSON(url,data) {
    console.log("posting to",url)
    return fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(resp => resp.json())
    .then(resp => {
        console.log("real response is",resp)
        return resp
    })
}

function loadImageFromURL(url) {
    return new Promise((res,rej)=>{
        const img = new Image()
        img.addEventListener('load',()=>{
            res(img)
        })
        img.src = url

    })
}



const BASE_URL =  "https://vr.josh.earth/360/doc/"

export class PersistenceManager {
    constructor() {

    }

    save(chunkManager, cache) {
        const chunkCount = Object.keys(chunkManager.chunks).length
        const width = 512
        const height = 1024
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = 'rgba(255,255,255,1.0)'
        ctx.fillRect(0,0,canvas.width,canvas.height)
        const data = ctx.getImageData(0,0,canvas.width,canvas.height)
        console.log("saving",Object.keys(chunkManager.chunks).length,'chunks')
        const output = {
            chunks:[],
            image:null,
        }
        Object.keys(chunkManager.chunks).forEach((id,i)=> {
            const chunk = chunkManager.chunks[id]
            const info = {
                id: id,
                low: chunk.data.low,
                high: chunk.data.high,
                dims: chunk.data.dims,
                position: chunk.chunkPosition,
            }
            //turn a 4096 array into an 8x512 section of the image
            for(let k=0; k<chunk.data.voxels.length; k++) {
                const val = chunk.data.voxels[k]
                const vx = k%512
                const vy = Math.floor(k/512) + i*8
                const n = (vy*512 + vx)*4
                data.data[n+0] = 0
                data.data[n+1] = 0
                data.data[n+2] = val
                data.data[n+3] = 255
            }
            info.imageCoords = {
                x:0,
                y:i*8,
                width:512,
                height:8,
            }
            output.chunks.push(info)
        })
        ctx.putImageData(data,0,0)
        // document.body.appendChild(canvas)
        output.image = canvas.toDataURL('png')

        const url = BASE_URL+'foozoo88'
        return POST_JSON(url,output)
    }

    load(chunkManager) {
        const url = BASE_URL+'foozoo88'
        return GET_JSON(url).then(data => {
            // console.log("parsing",data)
            chunkManager.clear()
            return loadImageFromURL(data.image).then(img => {
                const canvas = document.createElement('canvas')
                canvas.width = img.width
                canvas.height = img.height
                const ctx = canvas.getContext('2d')
                ctx.drawImage(img,0,0)
                // document.body.appendChild(canvas)
                data.chunks.forEach(chunk => {
                    const imageData = ctx.getImageData(chunk.imageCoords.x,chunk.imageCoords.y, chunk.imageCoords.width, chunk.imageCoords.height)
                    const voxels = []
                    for(let i=0; i<4096; i++) voxels[i] = imageData.data[i*4+2]
                    chunkManager.makeChunkFromData(chunk,voxels)
                })
            })
        })

    }
}


