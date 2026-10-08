import {Composition} from 'remotion';
import {TurnUpDemo} from './TurnUpDemo';

export const RemotionRoot = () => (
  <Composition
    id="TurnUpDemo"
    component={TurnUpDemo}
    durationInFrames={810}
    fps={30}
    width={1920}
    height={1080}
  />
);
