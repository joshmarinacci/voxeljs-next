function printError(err) {
  console.log(err)
}

export const VR_DETECTED = "detected"
export const VR_CONNECTED = "connected"
export const VR_DISCONNECTED = "disconnected"
export const VR_PRESENTCHANGE = "presentchange"
export const VR_ACTIVATED = "activated"



export default class VRManager {
  constructor(renderer) {
      this.device = null
      this.renderer = renderer
      if(!this.renderer) throw new Error("VR Manager requires a valid ThreeJS renderer instance")
      this.listeners = {}

      if ('xr' in navigator && navigator.xr.requestDevice) {
          console.log("has webxr")
          navigator.xr.requestDevice().then((device) => {
              device.supportsSession({immersive: true, exclusive: true /* DEPRECATED */})
                  .then(() => {
                      this.device = device
                      this.fire(VR_DETECTED,{})
                  })
                  .catch(printError);

          }).catch(printError);
      } else if ('getVRDisplays' in navigator) {
          console.log("has webvr")

          window.addEventListener( 'vrdisplayconnect', ( event ) => {
              this.device = event.display
              this.fire(VR_CONNECTED)
          }, false );

          window.addEventListener( 'vrdisplaydisconnect', ( event )  => {
              this.fire(VR_DISCONNECTED)
          }, false );

          window.addEventListener( 'vrdisplaypresentchange', ( event ) => {
              this.fire(VR_PRESENTCHANGE)
          }, false );

          window.addEventListener( 'vrdisplayactivate',  ( event ) => {
              this.device = event.display
              this.device.requestPresent([{source:this.renderer.domElement}])
              this.fire(VR_ACTIVATED)
          }, false );

          navigator.getVRDisplays()
              .then( ( displays ) => {
                  console.log("vr scanned")
                  if ( displays.length > 0 ) {

                      // showEnterVR( displays[ 0 ] );
                      console.log("found vr")
                      this.device = displays[0]
                      this.fire(VR_DETECTED,{})

                  } else {
                      console.log("no vr at all")
                      // showVRNotFound();
                  }

              } ).catch(printError);

      } else {
          // no vr
          console.log("no vr at all")
      }
  }

  addEventListener(type, cb) {
      if(!this.listeners[type]) this.listeners[type] = []
      this.listeners[type].push(cb)
  }
  fire(type,evt) {
      if(!evt) evt = {}
      evt.type = type
      if(!this.listeners[type]) this.listeners[type] = []
      this.listeners[type].forEach(cb => cb(evt))
  }

  enterVR() {
      if(!this.device) {
          console.warn("tried to connect VR on an invalid device")
          return
      }
      console.log("entering VR")
      this.renderer.vr.setDevice( this.device );

      if(this.device.isPresenting) {
          this.device.exitPresent()
      } else {
          this.device.requestPresent([{source: this.renderer.domElement}]);
      }
  }

}
