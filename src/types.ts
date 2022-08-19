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

export interface TransitProps {
  path: LineDef,
  stations?: {
    location: number,
    label?: string,
    labelPosition?: 'top' | 'top-right' | 'right' | 'bottom-right' | 'bottom' | 'bottom-left' | 'left' | 'top-left',
    interchange?: boolean,
  }[],
  vehicles?: {
    location: number,
    direction: 'start' | 'end',
  }[],
  color?: ColorDef,
}
