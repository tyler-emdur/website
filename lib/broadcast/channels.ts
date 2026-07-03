// The Broadcast world's channel lineup: real, hand-picked signals from
// around the world — harbor cams, traffic cams, obscure public streams,
// foreign broadcasters — plus one that was never supposed to be there.
//
// No YouTube. Every channel here is a direct, CORS-open HLS manifest —
// played with a plain <video>, no iframe, no platform chrome, no branding.
// A fixed, curated lineup we know and trust, checked server-side so the
// client never has to guess whether a channel is alive before showing it.
export type ChannelKind = 'hls' | 'custom'
export type Reception = 'clean' | 'grainy' | 'unstable' | 'chaotic'

export interface BroadcastChannel {
  id: string
  ch: string // two-digit dial position, as printed on the set
  city: string // the only label the viewer ever sees — no flags, no explanation
  kind: ChannelKind
  reception: Reception
  hlsUrl?: string
}

export const CHANNELS: BroadcastChannel[] = [
  {
    id: 'delhi', ch: '02', city: 'DELHI', kind: 'hls', reception: 'chaotic',
    hlsUrl: 'https://cdn-2.pishow.tv/live/12/master.m3u8', // Doordarshan — DD News, Hindi
  },
  {
    id: 'ulaanbaatar', ch: '08', city: 'ULAANBAATAR', kind: 'hls', reception: 'grainy',
    hlsUrl: 'https://live.mnb.mn/hls/mnb.stream.m3u8', // Mongolian National Broadcaster, TV1
  },
  {
    id: 'tashkent', ch: '12', city: 'TASHKENT', kind: 'hls', reception: 'unstable',
    hlsUrl: 'https://stream8.cinerama.uz/1001/tracks-v1a1/playlist.m3u8', // O'zbekiston national TV
  },
  {
    id: 'taipei', ch: '17', city: 'TAIPEI', kind: 'hls', reception: 'clean',
    hlsUrl: 'https://jtmctrafficcctv2.gov.taipei/NVR/86104b6f-41b6-433b-9086-8736467eb5bf/live.m3u8', // Taipei city traffic CCTV, Xinyi District
  },
  {
    id: 'reykjavik', ch: '23', city: 'REYKJAVIK', kind: 'hls', reception: 'clean',
    hlsUrl: 'https://s172.ipcamlive.com/streams/aczb16hheu30gfpso/stream.m3u8', // Port of Reykjavík, Miðbakki Harbour
  },
  {
    id: 'somewhere', ch: '31', city: 'SAXON HARBOR', kind: 'hls', reception: 'grainy',
    hlsUrl: 'https://s158.ipcamlive.com/streams/9ex3vw9pvsggjtlmz/stream.m3u8', // a marina on Lake Superior nobody's heard of
  },
  {
    id: 'unknown', ch: '88', city: 'UNKNOWN', kind: 'custom', reception: 'chaotic',
  },
]

export const DEFAULT_CHANNEL_ID = 'reykjavik' // calm first impression before a favorite exists
