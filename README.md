# voxeljs-next
The next generation of Voxel JS.

# Play with it

Try out a [live demo here](https://vr.josh.earth/voxeljs-next/examples/ecsy.html).  This demo shows:
* create a flat world
* move with keyboard 
* add and remove blocks w/ mouse

# What is it

VoxelJS is a voxel engine for games, similar to Minecraft.  It provides the ability to draw voxels on the screen,
define the landscape with a function, load up textures, and navigate around the world in desktop mode and VR,
and place/remove blocks.  VoxelJS uses the voxel code from the [original Voxel.js project](http://www.voxeljs.com/), updated to the latest
ThreeJS, adds WebXR support, and uses the new entity component system [ECSY](https://ecsy.io/);


Notably VoxelJS does *not* provide any sort of server component, multi-player support, or scripting. To create
interactive effects like a TNT block you would need to write that code yourself (examples coming soon)..

# How to use it

First install the dependencies using npm

```shell script
npm install
npm start
open http://localhost:8080
```

# old stuff


This project updates the original [voxeljs](https://voxeljs.com/) with modern Javascript (classes, ES6 modules, arrow
functions, etc), and brings it in line with the latest [ThreeJS](https://threejs.org/), with support for the latest
WebGL features, and also adds VR/AR support.  

Because of these improvements, *voxeljs-next is not compatible with the original VoxelJS modules*. All old modules and
features will need to be ported to the new code.

# Dependencies

VoxelJS is built on [ThreeJS](https://threejs.org/) and the WebGL & WebXR standards.
With the right options enabled it will run on desktop in embedded mode, full screen
with pointer lock, on a touch screen (phone, tablet), and in any VR headsets with a
browser.


# How to use VoxelJS

Start by copying and modifying the main [example](examples/simple.html) application.

## Add new textures

Textures are loaded by the TextureManager. Add new images to the `examples/textures`
directory then add their file names (minus the .png extension) to the `load` call
like this:

```javascript
app.textureManager.load(['grass','brick','dirt','anim','tnt','arrows'])
```

## create a custom world with code

VoxelJS does not specify any on disk format for maps. It is up to you to provide that, though you can
look at the PersistenceManager example to see how it could work.  The only thing you need to provide
is to provide a function to the ChunkManager which accepts a low and high dimension and coordinates.
This function should generate a new info bject with the data for that chunk.

If you already have a function which returns the block number at a particular spot in the chunk then you can use
the utils.generateChunkInfoFromFunction to build the chunk info.  Here's a simple example that creates
a completely flat world 10 blocks thick.


```javascript
const flat = (i,j,k) => {
    //the floor is brick, from depth 0 to -10
    if(j < 1 && j > -10) return 2
    //nothing else in the world
    return 0
}

app.chunkManager = new ChunkManager({
    generateVoxelChunk: (low, high, cx,cy,cz) => {
        const id = [cx,cy,cz].join('|')
        if(app.CHUNK_CACHE[id]) return app.CHUNK_CACHE[id]
        return generateChunkInfoFromFunction(low, high, flat)
    },
});
```

## entities

Voxel only tracks movementt of the player. To add other autonomus entityes like enemies and
friendlies create a new ThreeJS group for tthem in your scene then add the ThreeJS
objects. To make the entity interact with blocks and other objects you'll need to use
a `PhysHandler`. See the pig example for details


## Networking

VoxelJS does not provide voice chat or networked play out of the box, but you can look at
the example code for an example of using WebRTC for voice chat and PubNub for tracking
player movement and terrain changes.


# Help and Contributing

The general algorithm for rendering voxel data and how our implementation works is documented in [this](https://blog.mozvr.com/voxeljs-chunking-magic/) blog.

For help try asking in the `#voxel` channel in the ThreeJS slack.

If you'd like to contribute take a look at the issues. There are a ton of features
that need implementing including

* make cheap ambient occulsion work when the greedy mesh is turned on
* an api to set multiple chunks at once
* better example of networked play
* more demos
* alternative rending. smaller cubes, cool textures, weird effects
* Fix full screen in iOS and Mac safari
* Touch screen dragging
* Can’t choose block type in iPad
* implement water: [How Water Works In DwarfCorp](https://www.gamasutra.com/blogs/MattKlingensmith/20130811/198050/How_Water_Works_In_DwarfCorp.php)
* API to set multiple blocks at once. Batches help network as well.
* other modules should Never know about chunks. Just get and set blocks.
* level of detail: [A level of detail method for blocky voxels | 0 FPS](https://0fps.net/2018/03/03/a-level-of-detail-method-for-blocky-voxels/)
* fix AO for greedy mesher. Explain the problem.

These particular issues are newbie friendly.

# TBD

* explain how meshing and chunking works. the core algorithm
* explain how rendering works. esp texture mapping.
