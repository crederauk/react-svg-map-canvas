import React, { EventHandler, FC, MouseEvent, MouseEventHandler, useEffect, useRef, useState } from 'react'
import { ReactZoomPanPinchHandlers, TransformComponent, TransformWrapper } from '@pronestor/react-zoom-pan-pinch'
import './styles'
import { getAngleAtPathPt, intersect, lineToAngle, lineToPathDef } from './utils'
import { ColorDef, LineDef, TransitProps } from './types'
import * as Styled from './styles'

interface MapCanvasProps {
  canvasWidth?: string | number,
  canvasHeight?: string | number,
  width?: string | number,
  height?: string | number,
  controls?: ({ zoomIn, zoomOut, resetTransform }: Pick<ReactZoomPanPinchHandlers, 'zoomIn' | 'zoomOut' | 'resetTransform'>) => JSX.Element,
  colors?: ColorDef,
  concreteGroundPaths?: LineDef[],
  transits?: TransitProps[],
}

const defaultColors = {
  ocean: {
    fill: '#9AC0F8',
  },
  concreteGround: {
    fill: '#F8F9FA',
  },
  bakerloo: {
    stroke: '#996633',
  },
}

const objectValueGetterReducer = (obj: { [x: string]: any }, key: string) => {
  if (obj === undefined) {
    return undefined;
  }
  return obj[key] === undefined || obj[key] === null ? undefined : obj[key];
};

export const objectValueGetter = (obj: { [x: string]: any }, path: string): any =>
  path.split('.').reduce(objectValueGetterReducer, obj);

export const MapCanvas: FC<MapCanvasProps> = ({
  canvasWidth,
  canvasHeight,
  width = 1200,
  height = 850,
  controls,
  colors,
  concreteGroundPaths,
  transits
}) => {
  if (canvasWidth === undefined) {
    canvasWidth = width;
  }
  if (canvasHeight === undefined) {
    canvasHeight = height;
  }

  const [transitPathRefs, setTransitPathRefs] = useState<(SVGPathElement | null)[]>([]);

  const handleClick = (event: MouseEvent) => {
    console.log(event.pageX);
    console.log(event.pageY);
  }

  const getColor = (path: string) => {
    return (colors ? objectValueGetter(colors, path) : undefined) || objectValueGetter(defaultColors, path)
  }

  const refSetter = (newRef: SVGPathElement | null, index: number) => {
    if (index >= transitPathRefs.length) {
      console.log('x');
      setTransitPathRefs([...transitPathRefs, newRef]);
    } else {
      console.log('y');
      if (newRef !== transitPathRefs[index]) {
        const newRefs = [...transitPathRefs];
        newRefs[index] = newRef;
        setTransitPathRefs(newRefs);
      }
    }
  }

  return (
    <Styled.MapWrapper>
      <TransformWrapper
        wheel={{ step: 0.05 }}
      >
        {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
          <>
            <TransformComponent>
              <svg viewBox={`0 0 ${canvasWidth} ${canvasHeight}`} width={width} height={height}>
                {/* layer 0: da ocean */}
                <rect x={0} y={0} width={canvasWidth} height={canvasHeight} fill={getColor('ocean.fill')} />

                {/* layer 10: 'natural' ground */}
                {/* layer 20: concrete ground */}
                { concreteGroundPaths?.map((path) => (
                  <path
                    d={lineToPathDef(path)}
                    fill={getColor('concreteGround.fill')}
                    stroke={getColor('concreteGround.stroke')}
                    strokeWidth={getColor('concreteGround.strokeWidth')}
                    paintOrder="stroke"
                  />
                )) }

                {/* layer 30: paths */}
                {/* layer 38: road markings (direction, zebra crossings, etc.) */}
                {/* layer 40: roads */}
                {/* layer 50: highways */}
                {/* layer 52: road markings (traffic lights, etc.) */}
                {/* layer 60: buildings */}
                {/* layer 70: transit */}
                { transits?.map((transit, index) => (
                  <path ref={(newRef) => refSetter(newRef, index)} d={lineToPathDef(transit.path)} fill="none" stroke={defaultColors.bakerloo.stroke} strokeWidth={3} />
                )) }
                {/* layer 72: transit markings (stations, vehicle locations, etc.) */}
                { transits?.map((transit, index) => {
                  const ref = transitPathRefs[index];
                  if (!ref || !transit.stations) {
                    return null;
                  }
                  const pathLength = ref.getTotalLength() || 0;
                  return transit.stations.map((station) => {
                    const ptOnPath = ref.getPointAtLength(pathLength * station.location);
                    const labelPosition = station.labelPosition || 'left';
                    let labelPositionX = 0;
                    let labelPositionY = 0;
                    let labelTextAnchor = 'middle';
                    let labelDominantBaseline = 'middle';
                    if (labelPosition.includes('top')) {
                      labelPositionY = -5;
                      labelDominantBaseline = 'auto';
                      labelTextAnchor = 'start';
                    } else if (labelPosition.includes('bottom')) {
                      labelPositionY = 5;
                      labelDominantBaseline = 'hanging';
                      labelTextAnchor = 'end';
                    }
                    if (labelPosition.includes('left')) {
                      labelPositionX = -7;
                      labelTextAnchor = 'end';
                    } else if (labelPosition.includes('right')) {
                      labelPositionX = 7;
                      labelTextAnchor = 'start';
                    }
                    if (labelPosition === 'bottom-left') {
                      labelPositionX = -6;
                      labelPositionY = 0;
                    }
                    const angle = getAngleAtPathPt(ref, pathLength * station.location);
                    return (
                      <React.Fragment key={station.location}>
                        <defs>
                          <linearGradient id="transitRegularStation" gradientTransform="rotate(90)">
                            <stop offset="65%" stopColor={defaultColors.bakerloo.stroke} />
                            <stop offset="65%" stopColor="transparent" />
                          </linearGradient>
                        </defs>
                        {station.interchange ? (
                          <circle cx={ptOnPath.x} cy={ptOnPath.y} r={3} fill="#fff" stroke="#000" strokeWidth={1.2} />
                        ) : (
                          <Styled.TransitRegularStation
                            x={ptOnPath.x - 1.5}
                            y={ptOnPath.y - 5}
                            width={3}
                            height={10}
                            fill="url('#transitRegularStation')"
                            transform={`rotate(${angle})`}
                          />
                        )}
                        {station.label ? (
                          <Styled.TransitStationLabelText
                            x={ptOnPath.x + labelPositionX}
                            y={ptOnPath.y + labelPositionY}
                            textAnchor={labelTextAnchor}
                            dominantBaseline={labelDominantBaseline}
                            fontSize={6}
                            transform="rotate(-25)"
                          >
                            {station.label}
                          </Styled.TransitStationLabelText>
                        ) : null }
                      </React.Fragment>
                    )
                  });
                }) }
                { transits?.map((transit, index) => {
                  const ref = transitPathRefs[index];
                  if (!ref || !transit.vehicles) {
                    return null;
                  }
                  const pathLength = ref.getTotalLength() || 0;
                  return transit.vehicles.map((vehicle) => {
                    const ptOnPath = ref.getPointAtLength(pathLength * vehicle.location);
                    const angle = getAngleAtPathPt(ref, pathLength * vehicle.location);
                    return (
                      <Styled.TransitVehicleContainer key={vehicle.location} transform={`rotate(${vehicle.direction === 'start' ? angle : angle})`}>
                        <circle cx={ptOnPath.x} cy={ptOnPath.y} r={4} fill="#777" stroke="#fff" strokeWidth={0.5} />
                        <text
                          x={ptOnPath.x + 0.2}
                          y={ptOnPath.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={4}
                          fontWeight={900}
                          fill="#fff"
                        >
                          {'>'}
                        </text>
                      </Styled.TransitVehicleContainer>
                    )
                  });
                }) }
              </svg>
            </TransformComponent>
            {controls
              ? controls({ zoomIn, zoomOut, resetTransform })
              : (
                <Styled.Controls>
                  <button onClick={() => zoomIn()}>+</button>
                  <button onClick={() => zoomOut()}>-</button>
                </Styled.Controls>
              )
            }
          </>
        )}
      </TransformWrapper>
    </Styled.MapWrapper>
  );
};
