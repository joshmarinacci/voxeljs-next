import {
  DefaultLoadingManager,
} from "three"

export default class BackgroundAudioLoader {
  constructor(manager) {
      this.manager = ( manager !== undefined ) ? manager : DefaultLoadingManager;
  }

  load( url, onLoad, onProgress, onError ) {
      console.log("BGAL loading",url)

      const music = new Audio(url)
      music.autoplay = false
      music.loop = true
      music.controls = false
      music.preload = 'auto'
      music.volume = 0.75
      music.addEventListener('canplay',()=>{
          onLoad(music)
          this.manager.itemEnd(url)
      })

      this.manager.itemStart(url)
  }
}
