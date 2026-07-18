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
  // Backup feeds for the same dial position — different stations from the same
  // place, tried in order when the primary goes dark. The viewer never learns
  // the channel changed underneath them; the city stays the city.
  altHlsUrls?: string[]
}

export const CHANNELS: BroadcastChannel[] = [
  {
    id: 'delhi', ch: '02', city: 'DELHI', kind: 'hls', reception: 'chaotic',
    hlsUrl: 'https://cdn-2.pishow.tv/live/12/master.m3u8', // Doordarshan — DD News, Hindi
    altHlsUrls: [
      'https://d3qs3d2rkhfqrt.cloudfront.net/out/v1/ceda14583477426aa162a65392d8ea07/index.m3u8', // DD India
      'https://d3qs3d2rkhfqrt.cloudfront.net/out/v1/0811cd8c37ca4c409d5385a6cd2fa18b/index.m3u8', // DD News HD
    ],
  },
  {
    id: 'istanbul', ch: '05', city: 'ISTANBUL', kind: 'hls', reception: 'grainy',
    hlsUrl: 'https://tv-trtworld.medya.trt.com.tr/master.m3u8', // TRT World — Turkish international broadcaster
    altHlsUrls: [
      'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8', // DW English — Bonn
      'https://static.france24.com/live/F24_EN_HI_HLS/live_web.m3u8', // France 24 English — Paris
    ],
  },
  {
    id: 'ulaanbaatar', ch: '08', city: 'ULAANBAATAR', kind: 'hls', reception: 'grainy',
    hlsUrl: 'https://live.mnb.mn/hls/mnb.stream.m3u8', // Mongolian National Broadcaster, TV1
    altHlsUrls: [
      'https://live.mnb.mn/hls/mnb_sport.stream.m3u8', // MNB Sport
    ],
  },
  {
    id: 'tashkent', ch: '12', city: 'TASHKENT', kind: 'hls', reception: 'unstable',
    hlsUrl: 'https://stream8.cinerama.uz/1001/tracks-v1a1/playlist.m3u8', // O'zbekiston national TV
    altHlsUrls: [
      'https://stream8.cinerama.uz/1002/tracks-v1a1/playlist.m3u8', // second national feed, same head end
      'https://stream8.cinerama.uz/1003/tracks-v1a1/playlist.m3u8',
    ],
  },
  {
    id: 'taipei', ch: '17', city: 'TAIPEI', kind: 'hls', reception: 'clean',
    hlsUrl: 'https://jtmctrafficcctv2.gov.taipei/NVR/86104b6f-41b6-433b-9086-8736467eb5bf/live.m3u8', // Taipei city traffic CCTV, Xinyi District
    altHlsUrls: [
      'https://live.streamingfast.net/osmflivech1.m3u8', // GOOD TV — Taipei broadcaster
      'https://5ddce30eb4b55.streamlock.net/bltvhd/bltv1/playlist.m3u8', // Beautiful Life TV — Buddhist channel, New Taipei
    ],
  },
  {
    id: 'reykjavik', ch: '23', city: 'REYKJAVIK', kind: 'hls', reception: 'clean',
    hlsUrl: 'https://ruv-web-live.akamaized.net/streymi/ruverl/ruverl.m3u8', // RÚV — Icelandic national television
    altHlsUrls: [
      'https://live.visir.is/hls-live/visir.smil/playlist.m3u8', // Vísir — Reykjavík newsroom
    ],
  },
  {
    id: 'dushanbe', ch: '27', city: 'DUSHANBE', kind: 'hls', reception: 'grainy',
    hlsUrl: 'https://live.teleradiocom.tj/7/3m.m3u8', // Dushanbe HD — Tajik capital-city channel
    altHlsUrls: [
      'https://live.teleradiocom.tj/1/3m.m3u8', // TV Tojikiston — same head end
      'https://live.teleradiocom.tj/2/3m.m3u8', // Safina
    ],
  },
  {
    id: 'somewhere', ch: '31', city: 'SAXON HARBOR', kind: 'hls', reception: 'grainy',
    hlsUrl: 'https://cdn-004.whatsupcams.com/hls/hr_pula01.m3u8', // a harbor on the Adriatic nobody's heard of — no understudy; when it's dark, it's dark
  },
  {
    id: 'vientiane', ch: '44', city: 'VIENTIANE', kind: 'hls', reception: 'chaotic',
    hlsUrl: 'https://livefta.malimarcdn.com/ftaedge00/laonet.sdp/playlist.m3u8', // Lao Net TV — variety shows, karaoke, no context
    altHlsUrls: [
      'https://livefta.malimarcdn.com/ftaedge00/ningtv.sdp/playlist.m3u8', // Ning TV
      'https://livefta.malimarcdn.com/ftaedge00/ohmuanglao.stream/playlist.m3u8', // Oh Muang Lao
      'https://livefta.malimarcdn.com/ftaedge00/ichannel.sdp/playlist.m3u8', // ISTV
    ],
  },
  {
    id: 'unknown', ch: '88', city: 'UNKNOWN', kind: 'custom', reception: 'chaotic',
  },
]

export const DEFAULT_CHANNEL_ID = 'reykjavik' // calm first impression before a favorite exists
