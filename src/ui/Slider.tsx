import React, { useRef, useState } from "react";

type Props = {
  value: number
  min: number
  max: number
  step?: number
  onChange: (v:number)=>void
}

export function Slider({ value, min, max, step = 0.01, onChange }: Props) {

  const [internal, setInternal] = useState(value)
  const raf = useRef<number | null>(null)

  function commit(v:number){
    if(raf.current) cancelAnimationFrame(raf.current)

    raf.current = requestAnimationFrame(()=>{
      onChange(v)
    })
  }

  function handle(e:React.ChangeEvent<HTMLInputElement>){

    const v = parseFloat(e.target.value)

    setInternal(v)
    commit(v)
  }

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={internal}
      onChange={handle}
      onPointerDown={(e)=>e.stopPropagation()}
      style={{
        width:"100%",
        cursor:"pointer"
      }}
    />
  )
}
