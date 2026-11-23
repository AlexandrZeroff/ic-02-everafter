import type { ImageMetadata } from 'astro'

import novaRex from '@/assets/images/artists/nova-rex.jpg'
import halcya from '@/assets/images/artists/halcya.jpg'
import kore from '@/assets/images/artists/kore.jpg'
import vantaBlue from '@/assets/images/artists/vanta-blue.jpg'
import miraSole from '@/assets/images/artists/mira-sole.jpg'
import hollowSun from '@/assets/images/artists/the-hollow-sun.jpg'
import okami from '@/assets/images/artists/okami.jpg'
import lumenDrift from '@/assets/images/artists/lumen-drift.jpg'
import ashaVoid from '@/assets/images/artists/asha-void.jpg'
import parallax from '@/assets/images/artists/parallax.jpg'

import theBloom from '@/assets/images/stages/the-bloom.jpg'
import afterglow from '@/assets/images/stages/afterglow.jpg'
import neverdawn from '@/assets/images/stages/neverdawn.jpg'
import theHollow from '@/assets/images/stages/the-hollow.jpg'
import echoValley from '@/assets/images/stages/echo-valley.jpg'

export const nav = [
  { label: 'Manifesto', href: '#manifesto' },
  { label: 'Lineup', href: '#lineup' },
  { label: 'Stages', href: '#stages' },
  { label: 'Tickets', href: '#tickets' },
]

export const hero = {
  wordmark: 'EVERAFTER',
  dates: '07—10.08.2027',
  place: 'THE VALLEY',
  coords: '48.37°N 24.43°E',
  volume: 'VOL. 01',
  // showcase countdown: always starts at 24 days and counts down live
  opensIn: { days: 24, hours: 17, minutes: 30 },
  tagline: ['Four days.', 'One world.', 'No way back.'],
  cta: 'Get tickets',
}

export const manifesto = {
  label: '01 / Manifesto',
  lines: [
    ['A', 'WORLD'],
    ['THAT', 'BEGINS'],
    ['WHEN', 'THE', 'NIGHT'],
    ['NEVER', 'ENDS.'],
  ],
  note: 'see you on the other side',
  facts: [
    { value: 4, suffix: '', label: 'days' },
    { value: 9, suffix: '', label: 'stages' },
    { value: 120, suffix: '+', label: 'artists' },
    { value: 1, suffix: '', label: 'world' },
  ],
  tape: ['EVERAFTER 2027', 'PRE-SALE LIVE', '07—10.08', 'THE VALLEY'],
}

export type Artist = {
  name: string
  stage: string
  time: string
  genre: string
  image: ImageMetadata
}

const a = (
  name: string,
  image: ImageMetadata,
  stage: string,
  time: string,
  genre: string,
): Artist => ({ name, image, stage, time, genre })

export const lineup = {
  label: '02 / Lineup',
  title: 'LINEUP',
  meta: '120+ artists · 4 days',
  days: [
    {
      id: 'thu',
      label: 'THU 07',
      artists: [
        a('NOVA REX', novaRex, 'The Bloom', '23:30', 'Melodic techno'),
        a('HALCYA', halcya, 'Afterglow', '21:00', 'Deep house'),
        a('KØRE', kore, 'Neverdawn', '02:30', 'Hard techno'),
        a('VANTA BLUE', vantaBlue, 'The Hollow', '00:15', 'Ambient / live AV'),
        a('MIRA SOLÉ', miraSole, 'Afterglow', '19:45', 'Disco edits'),
        a('THE HOLLOW SUN', hollowSun, 'The Bloom', '01:00', 'Live set'),
        a('OKAMI', okami, 'Echo Valley', '22:30', 'Breaks'),
      ],
    },
    {
      id: 'fri',
      label: 'FRI 08',
      artists: [
        a('LUMEN DRIFT', lumenDrift, 'The Bloom', '00:00', 'Progressive'),
        a('ASHA VOID', ashaVoid, 'Neverdawn', '03:00', 'Industrial techno'),
        a('PARALLAX', parallax, 'Echo Valley', '23:15', 'Bass / UKG'),
        a('KØRE', kore, 'The Hollow', '20:30', 'Ambient set'),
        a('NOVA REX', novaRex, 'Afterglow', '22:00', 'House B2B'),
        a('HALCYA', halcya, 'The Bloom', '19:30', 'Sunset set'),
        a('MIRA SOLÉ', miraSole, 'Echo Valley', '01:30', 'Electro'),
      ],
    },
    {
      id: 'sat',
      label: 'SAT 09',
      artists: [
        a('THE HOLLOW SUN', hollowSun, 'Neverdawn', '04:30', 'Sunrise live'),
        a('VANTA BLUE', vantaBlue, 'The Bloom', '23:00', 'Melodic techno'),
        a('OKAMI', okami, 'Afterglow', '21:30', 'Italo / disco'),
        a('LUMEN DRIFT', lumenDrift, 'The Hollow', '01:15', 'Live AV'),
        a('PARALLAX', parallax, 'Neverdawn', '02:00', 'Hard groove'),
        a('ASHA VOID', ashaVoid, 'Echo Valley', '00:30', 'Breaks'),
        a('NOVA REX', novaRex, 'The Bloom', '03:30', 'Closing set'),
      ],
    },
    {
      id: 'sun',
      label: 'SUN 10',
      artists: [
        a('MIRA SOLÉ', miraSole, 'The Bloom', '20:00', 'Day-to-night'),
        a('KØRE', kore, 'Neverdawn', '00:00', 'Hard techno'),
        a('HALCYA', halcya, 'The Hollow', '22:15', 'Ambient'),
        a('OKAMI', okami, 'Echo Valley', '23:30', 'Bass'),
        a('VANTA BLUE', vantaBlue, 'Afterglow', '01:45', 'Deep house'),
        a('THE HOLLOW SUN', hollowSun, 'The Bloom', '03:00', 'Finale live'),
        a('PARALLAX', parallax, 'Afterglow', '18:30', 'Warm-up'),
      ],
    },
  ],
}

export const stages = {
  label: '03 / The world',
  title: 'THE WORLD',
  meta: ['9 stages', '240 hectares', '1 valley'],
  columns: ['No.', 'Stage', 'Sound', 'Capacity'],
  items: [
    {
      no: '01',
      name: 'THE BLOOM',
      sound: 'Melodic techno',
      capacity: '25 000',
      image: theBloom,
    },
    {
      no: '02',
      name: 'AFTERGLOW',
      sound: 'House & disco',
      capacity: '12 000',
      image: afterglow,
    },
    {
      no: '03',
      name: 'NEVERDAWN',
      sound: 'Hard techno, sunrise sets',
      capacity: '18 000',
      image: neverdawn,
    },
    {
      no: '04',
      name: 'THE HOLLOW',
      sound: 'Ambient & live AV',
      capacity: '3 000',
      image: theHollow,
    },
    {
      no: '05',
      name: 'ECHO VALLEY',
      sound: 'Breaks & bass',
      capacity: '9 000',
      image: echoValley,
    },
  ],
}

export const tickets = {
  label: '04 / Tickets',
  title: 'ENTER THE WORLD',
  items: [
    {
      id: 'day',
      tone: 'red',
      name: 'Day Pass',
      price: '€129',
      lines: ['One day of your choice', 'All 9 stages', 'Re-entry until 06:00'],
      code: 'EA-27 / D-0129',
    },
    {
      id: 'weekend',
      tone: 'black',
      name: 'Full Weekend',
      price: '€349',
      lines: ['4 days, 4 nights', 'Camping in the valley', 'All 9 stages'],
      code: 'EA-27 / W-0349',
    },
    {
      id: 'forever',
      tone: 'white',
      name: 'Everafter Forever',
      price: '€790',
      lines: ['VIP decks & lounges', 'Backstage tour', 'Lifetime early access'],
      code: 'EA-27 / F-0790',
    },
  ],
  cta: 'Get tickets',
}

export const footer = {
  line: 'See you on the other side.',
  socials: ['Instagram', 'TikTok', 'SoundCloud', 'Telegram'],
  copy: '© 2027 EVERAFTER. A fictional festival concept.',
}
