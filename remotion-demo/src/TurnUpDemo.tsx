import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {loadFont as loadFredoka} from '@remotion/google-fonts/Fredoka';
import {loadFont as loadManrope} from '@remotion/google-fonts/Manrope';

const {fontFamily: fredoka} = loadFredoka('normal', {weights: ['500', '600', '700']});
const {fontFamily: manrope} = loadManrope('normal', {weights: ['400', '500', '600', '700', '800']});

const C = {
  ink: '#0d1a24',
  deep: '#071219',
  panel: '#132737',
  gold: '#f0bc64',
  teal: '#73bbaa',
  cloud: '#f4f0e7',
  muted: '#aebfc2',
};

const LogoMark = ({size = 74}: {size?: number}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <rect x="2" y="2" width="60" height="60" rx="16" fill="#132532" stroke={C.gold} strokeWidth="2" />
    <path d="M16 35v4c0 6.075 4.925 11 11 11h8c7.18 0 13-5.82 13-13V21" stroke={C.gold} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m41 28 7-8 7 8" stroke={C.gold} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="16" cy="31" r="4" fill={C.teal} stroke="#132532" strokeWidth="2" />
  </svg>
);

const Wordmark = ({size = 62}: {size?: number}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 18, fontFamily: fredoka, fontSize: size, fontWeight: 700, letterSpacing: -2}}>
    <LogoMark size={size * 1.08} />
    <span style={{color: C.cloud}}>turn<span style={{color: C.gold}}>Up</span><span style={{fontFamily: manrope, fontSize: size * 0.43, fontWeight: 700, color: C.muted, letterSpacing: -1}}>.io</span></span>
  </div>
);

type Shot = {start: number; duration: number; file: string; title?: string};

const shots: Shot[] = [
  {start: 60, duration: 90, file: 'landing', title: 'YOUR PEOPLE. YOUR TABLE.'},
  {start: 150, duration: 60, file: 'game-picker', title: 'FOUR CLASSICS. ONE ROOM.'},
  {start: 210, duration: 66, file: 'ludo-lobby', title: 'PICK YOUR COLOR. BRING YOUR CREW.'},
  {start: 276, duration: 96, file: 'uno-game', title: 'UNO // EVERY TURN CHANGES IT.'},
  {start: 372, duration: 96, file: 'monopoly-game', title: 'MONOPOLY // MAKE YOUR MOVE.'},
  {start: 468, duration: 96, file: 'snakes-game', title: 'SNAKES & LADDERS // UP. DOWN. AGAIN.'},
  {start: 564, duration: 96, file: 'ludo-game', title: 'LUDO // RACE HOME TOGETHER.'},
  {start: 660, duration: 66, file: 'ludo-roll', title: 'LIVE TURNS. REAL-TIME.'},
];

const SiteShot = ({shot}: {shot: Shot}) => {
  const frame = useCurrentFrame();
  const local = frame;
  const {fps} = useVideoConfig();
  const fade = interpolate(local, [0, 10, shot.duration - 10, shot.duration], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const entrance = spring({frame: local - 3, fps, config: {damping: 22, stiffness: 90}});
  const zoom = interpolate(local, [0, shot.duration], [1.025, 1.065], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const titleLift = spring({frame: local - 7, fps, config: {damping: 18, stiffness: 130}});

  return (
    <AbsoluteFill style={{opacity: fade, pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: C.deep}} />
      <div style={{position: 'absolute', left: 36, top: 14, width: 1848, height: 1039.5, overflow: 'hidden', borderRadius: 15, border: '1px solid #ffffff27', boxShadow: '0 24px 90px #000b', opacity: entrance, transform: `scale(${interpolate(entrance, [0, 1], [0.985, 1])})`}}>
        <Img
          src={staticFile(`footage/${shot.file}.png`)}
          style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom})`, transformOrigin: 'center center'}}
        />
        <AbsoluteFill style={{background: 'linear-gradient(180deg, #06111a2b 0%, transparent 24%, transparent 76%, #06111a35 100%)'}} />
      </div>
      {shot.title && (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 40, display: 'flex', alignItems: 'center', padding: '0 68px', gap: 15, opacity: titleLift}}>
          <div style={{width: 5, height: 20, background: C.gold, borderRadius: 4, boxShadow: `0 0 22px ${C.gold}88`}} />
          <div style={{fontFamily: manrope, fontWeight: 800, color: C.cloud, fontSize: 19, letterSpacing: 1.25}}>{shot.title}</div>
          <div style={{marginLeft: 'auto', fontFamily: manrope, color: C.muted, fontSize: 12, letterSpacing: 1.5, fontWeight: 700}}>TURNUP.IO</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

const Opening = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const inSpring = spring({frame: frame - 4, fps, config: {damping: 17, stiffness: 90}});
  const subtitle = spring({frame: frame - 23, fps, config: {damping: 20, stiffness: 110}});
  const light = interpolate(frame, [0, 30, 60], [0.08, 0.28, 0.13], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fade = interpolate(frame, [0, 44, 60], [1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: C.deep, overflow: 'hidden', opacity: fade}}>
      <Img src={staticFile('footage/ludo-game.png')} style={{position: 'absolute', inset: -30, width: 'calc(100% + 60px)', height: 'calc(100% + 60px)', objectFit: 'cover', filter: 'blur(8px) brightness(.38)', transform: `scale(${interpolate(frame, [0, 60], [1.1, 1.03], {extrapolateRight: 'clamp'})})`}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, rgba(48,107,99,${light}) 0%, #0712199a 72%)`}} />
      <div style={{position: 'absolute', top: 100, left: 0, right: 0, display: 'grid', justifyItems: 'center', opacity: inSpring, transform: `translateY(${(1 - inSpring) * 28}px) scale(${0.94 + inSpring * 0.06})`}}>
        <Wordmark size={63} />
        <div style={{width: 78, height: 3, background: C.gold, marginTop: 48, borderRadius: 4, boxShadow: `0 0 28px ${C.gold}80`}} />
        <div style={{fontFamily: fredoka, fontWeight: 700, color: C.cloud, fontSize: 100, lineHeight: 0.98, letterSpacing: -4, textAlign: 'center', marginTop: 32}}>The table<br/><span style={{color: C.gold}}>is yours.</span></div>
        <div style={{fontFamily: manrope, fontSize: 17, color: C.muted, fontWeight: 800, letterSpacing: 4, marginTop: 28, opacity: subtitle}}>TURNUP.IO  ·  REAL-TIME MULTIPLAYER</div>
      </div>
      <div style={{position: 'absolute', left: 66, right: 66, bottom: 44, height: 1, background: 'linear-gradient(90deg, transparent, #f0bc6470, transparent)', opacity: inSpring}} />
      <div style={{position: 'absolute', left: 70, bottom: 57, fontFamily: manrope, fontSize: 13, fontWeight: 700, color: '#d5dcd8b0', letterSpacing: 2, opacity: subtitle}}>BRING YOUR CREW. PICK YOUR GAME. LET IT ROLL.</div>
      <div style={{position: 'absolute', right: 70, bottom: 57, fontFamily: manrope, fontSize: 13, color: C.gold, fontWeight: 800, letterSpacing: 2, opacity: subtitle}}>01 / 04</div>
    </AbsoluteFill>
  );
};

const Closing = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const fade = interpolate(frame, [0, 12, 70, 84], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const reveal = spring({frame: frame - 12, fps, config: {damping: 20, stiffness: 90}});
  return (
    <AbsoluteFill style={{opacity: fade, overflow: 'hidden', background: C.deep}}>
      <Img src={staticFile('footage/landing.png')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(.24) saturate(.75)', transform: `scale(${interpolate(frame, [0, 144], [1.04, 1.12], {extrapolateRight: 'clamp'})}`}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, #0d1a244d 0%, #06111ad9 70%), linear-gradient(180deg, #07121955, #071219bd)'}} />
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', opacity: reveal, transform: `translateY(${(1 - reveal) * 25}px)`}}>
        <Wordmark size={56} />
        <div style={{fontFamily: fredoka, color: C.cloud, fontSize: 78, fontWeight: 700, lineHeight: 1.03, letterSpacing: -3, textAlign: 'center', marginTop: 48}}>Bring everyone<br/><span style={{color: C.gold}}>to the table.</span></div>
        <div style={{marginTop: 42, border: `1px solid ${C.gold}85`, background: `${C.gold}18`, borderRadius: 999, padding: '15px 31px', fontFamily: manrope, color: C.cloud, fontSize: 18, fontWeight: 800, letterSpacing: 1.2, boxShadow: `0 12px 42px ${C.gold}1f`}}>PLAY NOW <span style={{color: C.gold, marginLeft: 11}}>TURNUP.IO&nbsp; ↗</span></div>
        <div style={{fontFamily: manrope, color: '#d5dcd88c', fontWeight: 700, fontSize: 12, letterSpacing: 3, marginTop: 27}}>ONE SHARED TABLE. ENDLESS REMATCHES.</div>
      </div>
    </AbsoluteFill>
  );
};

export const TurnUpDemo = () => (
  <AbsoluteFill style={{background: C.deep, overflow: 'hidden'}}>
    <Opening />
    <Sequence from={12} durationInFrames={150}>
      <Audio src={staticFile('sounds/game-start.mp3')} volume={0.5} />
    </Sequence>
    {shots.map((shot) => (
      <Sequence key={shot.file} from={shot.start} durationInFrames={shot.duration}>
        <SiteShot shot={shot} />
      </Sequence>
    ))}
    <Sequence from={672} durationInFrames={30}>
      <Audio src={staticFile('sounds/dice.mp3')} volume={0.8} />
    </Sequence>
    <Sequence from={726} durationInFrames={84}>
      <Closing />
    </Sequence>
  </AbsoluteFill>
);
