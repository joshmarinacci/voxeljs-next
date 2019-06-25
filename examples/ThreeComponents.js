import {System} from "../node_modules/ecsy/build/ecsy.module.js"

export class ChunkManagerComponent {
    constructor() {

    }
}
export class StandardThreeSceneSystem extends System {
    init() {
        this.canvas = document.querySelector("#canvas")
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0xcccccc );
        this.camera = new THREE.PerspectiveCamera( 80, this.canvas.width / this.canvas.height, 0.005, 10000 );
        this.camera.position.z = 5;
        this.camera.position.y = 5;

        var ambientLight = new THREE.AmbientLight( 0xcccccc );
        this.scene.add( ambientLight );

        const geometry = new THREE.IcosahedronGeometry( 1 )
        const material = new THREE.MeshStandardMaterial({color: '#ff0'})
        this.objMoving = new THREE.Mesh( geometry, material );
        this.objMoving.position.set(0,0,0);

        this.scene.add( this.objMoving );


        const renderer = new THREE.WebGLRenderer({canvas:this.canvas});
        renderer.setClearColor( 0x333333 );
        // renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( this.canvas.width, this.canvas.height );
        this.renderer = renderer

        const clock = new THREE.Clock();
        function animate() {
            const delta = clock.getDelta()
            const elapsedTime = clock.elapsedTime
            // console.time('render');
            this.world.execute(delta, elapsedTime);
            // console.timeEnd('render');
            renderer.render( this.scene, this.camera );
        }

        renderer.setAnimationLoop(animate.bind(this));

    }
}
