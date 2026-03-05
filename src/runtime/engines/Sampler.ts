import { audioCtx } from "../../audio/audioContext"
import type { ModuleEngine } from "./base"
import type { EventMessage } from "../types"

export function createSamplerEngine(params?:Record<string,any>):ModuleEngine{

  const output = audioCtx.createGain()
  output.gain.value = params?.gain ?? 0.9

  let buffer:AudioBuffer | null = null

  async function loadSample(file:File){

    const array = await file.arrayBuffer()

    buffer = await audioCtx.decodeAudioData(array)

  }

  function trigger(){

    if(!buffer) return

    const src = audioCtx.createBufferSource()

    src.buffer = buffer

    src.connect(output)

    src.start()

  }

  const engine:ModuleEngine = {

    audioOut: output,

    onEvent(msg:EventMessage){

      if(msg.type === "trigger"){

        trigger()

      }

    },

    setParam(key:string,value:any){

      if(key === "gain"){

        output.gain.value = Number(value)

      }

    },

    dispose(){

      try{output.disconnect()}catch{}

    }

  } as any

  ;(engine as any).loadSample = loadSample

  return engine
}
