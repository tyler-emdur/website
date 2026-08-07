'use client'
import { useEffect, useState } from 'react'

// True on phones/tablets — coarse pointer or touch points present. Resizing a
// desktop browser to a phone's aspect ratio does NOT trigger this (mouse +
// keyboard are still there), which is exactly why that testing method missed
// every keyboard-only control in the worlds below.
export function useIsTouchDevice() {
  const [touch, setTouch] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)')
    const update = () => setTouch(mq.matches || navigator.maxTouchPoints > 0)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return touch
}
