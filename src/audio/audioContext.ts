export const audioCtx =
  new (window.AudioContext || (window as any).webkitAudioContext)()

export async function ensureAudioRunning(){

  if(audioCtx.state !== "running"){

    await audioCtx.resume()

  }

}
