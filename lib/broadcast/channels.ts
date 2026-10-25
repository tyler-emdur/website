// The Broadcast world's channel lineup: real, hand-picked signals from
// around the world — harbor cams, traffic cams, obscure public streams,
// foreign broadcasters — plus one that was never supposed to be there.
//
// No YouTube. Every channel here is a direct, CORS-open HLS manifest —
// played with a plain <video>, no iframe, no platform chrome, no branding.
// A fixed, curated lineup we know and trust, checked server-side so the
// client never has to guess whether a channel is alive before showing it.
//
// Nothing goes on this dial from memory. Every URL below came out of a
// published index — the provider's own camera pages, or iptv-org's country
// lists — and then had to answer `scripts/probe-stream.mjs` for CORS, for a
// playlist that is carrying segments, and for not being a recording. Thirty
// candidates once assembled by analogy with the working ones returned
// twenty-three dead, and a plausible-looking stream URL is exactly the kind of
// value this repo forbids inventing.
export type ChannelKind = 'hls' | 'custom'
export type Reception = 'clean' | 'grainy' | 'unstable'

export interface BroadcastChannel {
  id: string
  ch: string // two-digit dial position, as printed on the set
  city: string // the only label the viewer ever sees — no flags, no explanation
  kind: ChannelKind
  // Fallback only, and only for a slot that cannot be measured at all. The
  // screen derives reception from what the station's manifest actually declares
  // (lib/broadcast/reception.ts); the hand-written labels that used to sit on
  // every channel here were guesses about a real thing, and four of them were
  // wrong. Dushanbe keeps one because its host resolves but never completes a
  // connection, and a bake machine in one city cannot tell a dark station from
  // one that declines to talk to it.
  reception?: Reception
  hlsUrl?: string
  // Backup feeds for the same dial position — different stations from the same
  // place, tried in order when the primary goes dark. The viewer never learns
  // the channel changed underneath them; the city stays the city.
  altHlsUrls?: string[]
}

export const CHANNELS: BroadcastChannel[] = [
  {
    id: 'delhi', ch: '02', city: 'DELHI', kind: 'hls',
    // The Doordarshan feed that used to lead here (cdn-2.pishow.tv/live/12)
    // answered a hard 404 in every probe, so every tune to 02 paid a failed
    // request before the cascade quietly handed the slot to this one anyway.
    hlsUrl: 'https://d3qs3d2rkhfqrt.cloudfront.net/out/v1/ceda14583477426aa162a65392d8ea07/index.m3u8', // DD India
    altHlsUrls: [
      'https://d3qs3d2rkhfqrt.cloudfront.net/out/v1/0811cd8c37ca4c409d5385a6cd2fa18b/index.m3u8', // DD News HD — same head end
    ],
  },
  {
    id: 'istanbul', ch: '05', city: 'ISTANBUL', kind: 'hls',
    hlsUrl: 'https://tv-trtworld.medya.trt.com.tr/master.m3u8', // TRT World — Turkish international broadcaster
    // These two used to be DW English and France 24: a German newsroom and a
    // French one, labelled ISTANBUL, against the contract stated above. Both
    // replacements are Istanbul newsrooms — Habertürk in Beyoğlu, TELE1 in
    // Sarıyer — found in iptv-org's Turkey list and checked for CORS.
    altHlsUrls: [
      'https://tv.ensonhaber.com/haberturk/haberturk.m3u8', // Habertürk — Istanbul, via the only feed published for it
      // TELE1, Sarıyer. It flaps: 200 one minute, 404 for the next ten, with no
      // pattern in the headers it is asked with. Third in the cascade and never
      // reached unless TRT and Habertürk are both down, so an understudy that
      // is sometimes there is still worth more than a newsroom in Bonn.
      'https://tele1-live.ercdn.net/tele1/tele1.m3u8',
    ],
  },
  {
    id: 'ulaanbaatar', ch: '08', city: 'ULAANBAATAR', kind: 'hls',
    hlsUrl: 'https://live.mnb.mn/hls/mnb.stream.m3u8', // Mongolian National Broadcaster, TV1
    altHlsUrls: [
      'https://live.mnb.mn/hls/mnb_sport.stream.m3u8', // MNB Sport
    ],
  },
  {
    id: 'opatija', ch: '12', city: 'OPATIJA', kind: 'hls',
    hlsUrl: 'https://cdn-006.whatsupcams.com/hls/hr_opatija01.m3u8', // Adriatic promenade cam, off-season
    altHlsUrls: [
      // Two more cameras on the same seafront, a different operator, found by
      // walking the provider's directory. Both run eleven-second segments three
      // deep, so they come in slowly and stall easily — which the tuner now
      // says out loud before the picture arrives.
      'https://wowza.3tcable.hr/Madona/Madona.stream/chunklist.m3u8', // Lungomare, the promenade itself
      'https://wowza.3tcable.hr/VoloskoMul/VoloskoMul.stream/chunklist.m3u8', // Volosko, the old harbour up the coast
      // And only when all three eyes on Opatija are shut, a foreign signal
      // drifting in. It used to be second in this list and it was also the
      // understudy on 05, so two positions on a dial about different places
      // could show the same German newsroom at once.
      'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8',
    ],
  },
  {
    id: 'taipei', ch: '17', city: 'TAIPEI', kind: 'hls',
    hlsUrl: 'https://jtmctrafficcctv2.gov.taipei/NVR/86104b6f-41b6-433b-9086-8736467eb5bf/live.m3u8', // Taipei city traffic CCTV, Xinyi District
    altHlsUrls: [
      'https://live.streamingfast.net/osmflivech1.m3u8', // GOOD TV — Taipei broadcaster
      'https://5ddce30eb4b55.streamlock.net/bltvhd/bltv1/playlist.m3u8', // Beautiful Life TV — Buddhist channel, New Taipei
    ],
  },
  {
    id: 'reykjavik', ch: '23', city: 'REYKJAVIK', kind: 'hls',
    // Do not put RÚV (ruv-web-live.akamaized.net) back on this dial position.
    // It geo-restricts outside Iceland, and it does it by streaming a valid
    // HLS manifest of a "not allowed outside Iceland" slate — real segments of
    // a real picture of a sentence, which no manifest check can see. The
    // liveness test in /api/broadcast now rejects empty windows, dead variants
    // and recordings, and it still cannot catch this one. That is why it is
    // written down here instead.
    hlsUrl: 'https://live.visir.is/hls-live/visir.smil/playlist.m3u8', // Vísir — Reykjavík newsroom
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
    id: 'somewhere', ch: '31', city: 'SAXON HARBOR', kind: 'hls',
    hlsUrl: 'https://cdn-004.whatsupcams.com/hls/hr_pula01.m3u8', // a harbor on the Adriatic nobody's heard of — no understudy; when it's dark, it's dark
  },
  {
    id: 'kronplatz', ch: '36', city: 'KRONPLATZ', kind: 'hls',
    // 2275m, above Bruneck. Found on the provider's own camera page; the host
    // had to be located by probe, because the page gives the camera an ID and
    // not a URL. The dial was all harbours and newsrooms until this one.
    hlsUrl: 'https://cdn-006.whatsupcams.com/hls/it_kronplatz07.m3u8',
  },
  {
    id: 'vientiane', ch: '44', city: 'VIENTIANE', kind: 'hls',
    hlsUrl: 'https://livefta.malimarcdn.com/ftaedge00/laonet.sdp/playlist.m3u8', // Lao Net TV — variety shows, karaoke, no context
    altHlsUrls: [
      'https://livefta.malimarcdn.com/ftaedge00/ningtv.sdp/playlist.m3u8', // Ning TV
      'https://livefta.malimarcdn.com/ftaedge00/ohmuanglao.stream/playlist.m3u8', // Oh Muang Lao
      'https://livefta.malimarcdn.com/ftaedge00/ichannel.sdp/playlist.m3u8', // ISTV
    ],
  },
  {
    id: 'unknown', ch: '88', city: 'UNKNOWN', kind: 'custom',
    // No manifest and no reception label: this one is ours, and it is drawn
    // rather than received. There used to be a fourth reception state here
    // called `chaotic`, set on this channel and two others. It had never once
    // been applied — 88 renders <Channel88 /> before any filter is reached, and
    // nothing measured ever derived to it.
  },
]

export const DEFAULT_CHANNEL_ID = 'reykjavik' // calm first impression before a favorite exists
