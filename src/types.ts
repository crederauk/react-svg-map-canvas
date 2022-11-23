export type ColorDef = {
  fill?: string,
  stroke?: string,
  strokeWidth?: number,
};

export type ColorDefs = Record<string, ColorDef>

export interface StraightSegment {
  mode: 'straight',
  from: {
    x: number,
    y: number
  },
  to: {
    x: number,
    y: number,
  },
}

export type LineDef = (StraightSegment | {
  mode: 'quadraticCurve',
})[];

export interface TransitPath {
  id: string;
  path: LineDef;
}

export interface Station {
  id: string;
  label?: string,
  labelPosition?: 'top' | 'top-right' | 'right' | 'bottom-right' | 'bottom' | 'bottom-left' | 'left' | 'top-left',
  interchange?: boolean,
  location: number;
  hidden?: boolean;
}

export interface TransitProps {
  paths: TransitPath[],
  stations?: Record<string, Station[]>,
  vehicles?: {
    pathId: string;
    location: number,
    direction: 'start' | 'end',
  }[],
  color?: ColorDef,
}
