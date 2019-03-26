import {Vector3,} from "./node_modules/three/build/three.module.js"

class Chunk {
    constructor(data, pos, chunkBits) {
        this.data = data
        this.dims = data.dims
        this.voxels = data.voxels
        this.vmesh = null
        this.surfaceMesh = null
        this.realPosition = pos
        this.chunkPosition = [pos.x, pos.y, pos.z]
        this.id = this.chunkPosition.join('|')
        this.chunkBits = chunkBits
    }

    voxelIndexFromCoordinates(x, y, z) {
        const bits = this.chunkBits
        const mask = (1 << bits) - 1
        return (x & mask) + ((y & mask) << bits) + ((z & mask) << bits * 2)
    }

    voxelAtCoordinates(pt) {
        const vidx = this.voxelIndexFromCoordinates(pt.x, pt.y, pt.z)
        return this.voxels[vidx]
    }
    setVoxelAtCoordinates(pt, val) {
        const vidx = this.voxelIndexFromCoordinates(pt.x, pt.y, pt.z)
        const v = this.voxels[vidx]
        this.voxels[vidx] = val
        return v
    }

    dispose() {
        if (this.vmesh) {
            delete this.vmesh.data
            delete this.vmesh.geometry
            delete this.vmesh.meshed
            delete this.vmesh.surfaceMesh
        }
    }
}

export class ChunkManager {
    constructor(opts) {
        this.listeners = {}
        this.distance = opts.chunkDistance || 2
        this.chunkSize = opts.chunkSize || 32
        this.cubeSize = opts.cubeSize || 25
        this.generateVoxelChunk = opts.generateVoxelChunk
        this.chunks = {}

        if (this.chunkSize & this.chunkSize - 1 !== 0)
            throw new Error('chunkSize must be a power of 2')

        //TODO: count the number of bits wide the chunksize is. seems like we could just use Math.log()
        //ex: if chunksize is 16 the bits is 4
        //I think bits is just used for efficient multiplication and division.
        let bits = 0
        for (let size = this.chunkSize; size > 0; size >>= 1) bits++;
        this.chunkBits = bits - 1;
    }

    on(type, cb) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].push(cb)
    }
    emit(type,evt) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].forEach(cb => cb(evt))
    }

    clear() {
        Object.keys(this.chunks).forEach(key => {
            const chunk = this.chunks[key]
            this.emit('removingChunk',chunk)
            chunk.dispose()
        })
        this.chunks = {}
    }


    // position in chunk indexes?
    nearbyChunks(position, distance) {
        const current = this.chunkAtPosition(position)
        const x = current[0]
        const y = current[1]
        const z = current[2]
        const dist = distance || this.distance
        const nearby = []
        for (let cx = (x - dist); cx !== (x + dist); ++cx) {
            for (let cy = (y - dist); cy !== (y + dist); ++cy) {
                for (let cz = (z - dist); cz !== (z + dist); ++cz) {
                    nearby.push([cx, cy, cz])
                }
            }
        }
        return nearby
    }

    //get missing chunks. position is in world coords
    requestMissingChunks(pos) {
        this.nearbyChunks(pos).map((chunkIndex) => {
            if (!this.chunks[chunkIndex.join('|')]) {
                this.emit('missingChunk', chunkIndex)
            }
        })
    }

    getBounds(x, y, z) {
        const bits = this.chunkBits
        const low = [x << bits, y << bits, z << bits]
        const high = [(x + 1) << bits, (y + 1) << bits, (z + 1) << bits]
        return [low, high]
    }

    //make a chunk at the position in chunk coords
    generateChunk(pos) {
        const bounds = this.getBounds(pos.x, pos.y, pos.z)
        const chunkData = this.generateVoxelChunk(bounds[0], bounds[1], pos.x, pos.y, pos.z)
        const chunkObj = new Chunk(chunkData, pos, this.chunkBits)
        this.chunks[chunkObj.id] = chunkObj
        return chunkObj
    }

    makeChunkFromData(info,voxels) {
        const pos = new Vector3(info.position[0],info.position[1],info.position[2])
        const chunkData = {
            low:info.low,
            high:info.high,
            voxels:voxels,
            dims:info.dims,
        }
        const chunk = new Chunk(chunkData, pos, this.chunkBits)
        this.chunks[chunk.id] = chunk
        return chunk
    }

    chunkIndexAtCoordinates(x, y, z) {
        const bits = this.chunkBits
        const cx = x >> bits
        const cy = y >> bits
        const cz = z >> bits
        return [cx, cy, cz];
    }

    //position in world coords
    chunkAtPosition(position) {
        const pt = position.divideScalar(this.cubeSize).floor()
        return this.chunkIndexAtCoordinates(pt.x, pt.y, pt.z)
    }

    voxelIndexFromCoordinates(x, y, z) {
        const bits = this.chunkBits
        const mask = (1 << bits) - 1
        return (x & mask) + ((y & mask) << bits) + ((z & mask) << bits * 2)
    }

    //get voxel at point in world space
    voxelAtCoordinates(pt) {
        const ckey = this.chunkIndexAtCoordinates(pt.x, pt.y, pt.z).join('|')
        const chunk = this.chunks[ckey]
        if (!chunk) return false
        return chunk.voxelAtCoordinates(pt)
    }

    setVoxelAtCoordinates(pt, val) {
        const ckey = this.chunkIndexAtCoordinates(pt.x, pt.y, pt.z).join('|')
        const chunk = this.chunks[ckey]
        if (!chunk) return false
        return chunk.setVoxelAtCoordinates(pt,val)
    }

    //get voxel at position in world coordinates
    voxelAtPosition(pos, val) {
        return this.voxelAtCoordinates(pos.divideScalar(this.cubeSize).floor(),val)
    }

    //report the number of chunks currently loaded into memory
    debug_getChunksLoadedCount() {
        return Object.keys(this.chunks).length
    }

    /**
     * remove chunks that are too far away
     * _pos_ is the center of the chunks to look at
     * _group_ is the ThreeJS group that the chunks are stored in
     */
    removeFarChunks(pos) {
        const nearbyChunks = this.nearbyChunks(pos,this.distance+1).map(chunkPos => chunkPos.join('|'))
        Object.keys(this.chunks).map((chunkIndex) => {
            //skip the nearby chunks
            if (nearbyChunks.indexOf(chunkIndex) > -1) return

            const chunk = this.chunks[chunkIndex]
            if (!chunk) return
            this.emit('removingChunk',chunk)
            chunk.dispose()
            delete this.chunks[chunkIndex]
        })
    }

    getBlock(x,y,z) {
        return this.voxelAtPosition(new Vector3(x,y,z))
    }
}

