import {TextureManager} from '../TextureManager.js'
import { Component, System, World } from '../../node_modules/ecsy/build/ecsy.module.js?module';
import {ChunkManager} from "../ChunkManager.js"
import {CulledMesher} from "../CulledMesher.js"
import {generateChunkInfoFromFunction, toRad} from '../utils.js'
import {Group,
    Vector3,
    Vector2,
    TextureLoader,
    CubeGeometry,
    MeshLambertMaterial,
    Mesh,
    Quaternion,
    Ray,
    AmbientLight,
} from '../../node_modules/three/build/three.module.js';
import {
    initialize,
    Parent,
    Transform,
    Object3D,
    WebGLRendererSystem,
    WebGLRendererContext,
    EnvironmentSystem,
    Scene,
    Camera,
    CameraRig,
    Environment,
} from '../../node_modules/ecsy-three/build/ecsy-three.module-unpkg.js';

export class VoxelLandscape extends Component {
    constructor() {
        super()
        this.chunkManager = null
        this.make_voxel = null
    }
}
export class VoxelTextures extends Component {
    constructor() {
        super();
        this.tm = null
        this.textures = []
    }
}
export class VoxelSystem extends System {
    execute(delta, time) {
        this.queries.entities.added.forEach(entity => {
            let land = entity.getMutableComponent(VoxelLandscape)
            //setup the chunk manager
            land.chunkManager = new ChunkManager({
                chunkDistance:1,
                blockSize:1,
                mesher: new CulledMesher(),
                chunkSize:16,
                generateVoxelChunk: (low, high, pos) => {
                    const id = [pos.x,pos.y,pos.z].join('|')
                    return generateChunkInfoFromFunction(low, high, land.make_voxel)
                },
                container: new Group(),
                textureManager: new TextureManager({aoEnabled:true}),
            });
            let texs = entity.getMutableComponent(VoxelTextures)
            texs.tm = land.chunkManager.textureManager
            texs.tm.loadTextures(texs.textures).then(()=>{
                console.log("textures are loaded")
                land.chunkManager.rebuildAllMeshes()
                land.chunkManager.requestMissingChunks(new Vector3(0,0,0))
            })
            entity.addComponent(Object3D, {value: land.chunkManager.container})
        })
    }
}
VoxelSystem.queries = {
    entities: {
        components: [VoxelLandscape, VoxelTextures],
        listen: {
            added: true,
            removed: true
        }
    }
}
