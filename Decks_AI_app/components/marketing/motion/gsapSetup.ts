import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'

// Registered once at module scope (client-only import sites) rather than per
// component — repeated gsap.registerPlugin calls are harmless but pointless.
// SplitText has shipped free (no Club GreenSock membership) since GSAP 3.13;
// this repo is on 3.15.
gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)

export { gsap, ScrollTrigger, SplitText, useGSAP }
