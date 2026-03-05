import React from "react"
import { Handle, Position } from "reactflow"
import { useStore } from "../state/store"
import { Slider } from "../ui/Slider"

export function SamplerNode({ id, data, runtime }: any){

  const update = useStore(s=>s.updateParam)

  const gain = Number(data.params?.gain ?? 0.9)

  async function upload(e:React.ChangeEvent<HTMLInputElement>){

    const file = e.target.files?.[0]

    if(!file) return

    const engine = runtime.getEngine(id) as any

    if(engine?.loadSample){

      await engine.loadSample(file)

    }

  }

  return (

    <div className="node">

      <div className="nodeHeader">
        <div className="nodeTitle">Sampler</div>
      </div>

      <div className="nodeBody">

        <input
          type="file"
          accept="audio/*"
          onChange={upload}
          onPointerDown={(e)=>e.stopPropagation()}
        />

        <div className="hint">Gain</div>

        <Slider
          value={gain}
          min={0}
          max={1.5}
          step={0.01}
          onChange={(v)=>update(id,"gain",v)}
        />

      </div>

      <Handle
        type="target"
        position={Position.Left}
        id="eventIn"
      />

      <Handle
        type="source"
        position={Position.Right}
        id="audioOut"
      />

    </div>
  )
}
