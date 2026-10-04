import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import { Flip } from 'gsap/Flip'

let registered = false

export function registerMotion() {
  if (registered) {
    return
  }
  gsap.registerPlugin(Flip, CustomEase)
  gsap.defaults({ overwrite: 'auto', ease: 'cubic-bezier(0.16, 1, 0.3, 1)' })
  registered = true
}
