import React, { FC, useMemo, useState } from 'react'
import { ReactZoomPanPinchHandlers, TransformComponent, TransformWrapper } from '@pronestor/react-zoom-pan-pinch'
import './styles'
import { getAngleAtPathPt, lineToPathDef } from './utils'
import { ColorDefs, EventHandlers, LineDef, TransitProps } from './types'
import * as Styled from './styles'

interface MapCanvasProps {
  canvasWidth?: string | number,
  canvasHeight?: string | number,
  width?: string | number,
  height?: string | number,
  controls?: ({ zoomIn, zoomOut, resetTransform }: Pick<ReactZoomPanPinchHandlers, 'zoomIn' | 'zoomOut' | 'resetTransform'>) => JSX.Element,
  colors?: ColorDefs,
  concreteGroundPaths?: LineDef[],
  transits?: Record<string, TransitProps>,
  eventHandlers?: EventHandlers,
}

const defaultColors: ColorDefs = {
  ocean: {
    fill: '#9AC0F8',
  },
  concreteGround: {
    fill: '#F8F9FA',
  },
  transit: {
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
  transits,
  eventHandlers,
}) => {
  if (canvasWidth === undefined) {
    canvasWidth = width;
  }
  if (canvasHeight === undefined) {
    canvasHeight = height;
  }

  const [transitPathRefs, setTransitPathRefs] = useState<Record<string, (SVGPathElement | null)>>({});

  const getColor = (path: string) => {
    return (colors ? objectValueGetter(colors, path) : undefined) || objectValueGetter(defaultColors, path)
  }

  const refSetter = (newRef: SVGPathElement | null, id: string) => {
    if (transitPathRefs?.[id] !== newRef) {
      setTransitPathRefs((oldTransitPathRefs => ({
        ...oldTransitPathRefs,
        [id]: newRef
      })));
    }
  }

  const canvas = useMemo(() => {
    return (
      <svg viewBox={`0 0 ${canvasWidth} ${canvasHeight}`} width={width} height={height}>
        <style>{`
          .transit-station-label.on-hover {
            display: none;
          }
          .transit-station:hover + .transit-station-label.on-hover {
            display: initial;
          }
        `}</style>
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
      { Object.entries(transits || {}).map(([transitId, transit]) => (
        transit.paths.map(transitPath =>
          <path
            key={`transit-path-${transitPath.id}`}
            ref={(newRef) => refSetter(newRef, transitPath.id)}
            d={lineToPathDef(transitPath.path)}
            fill="none"
            stroke={transit?.color?.stroke || getColor('transit.stroke')}
            strokeWidth={3}
            onClick={() => eventHandlers?.['onClick-transit-path']?.({
              transitId,
              transitPathId: transitPath.id,
            })}
            cursor={eventHandlers?.['onClick-transit-path'] ? 'pointer' : 'default'}
          />
        )
      )) }
      {/* layer 72: transit markings (stations, vehicle locations, etc.) */}
      { Object.entries(transits || {}).map(([transitId, transit]) => {
        if (!transit.stations) {
          return null;
        }
        return Object.entries(transit.stations).flatMap(([pathId, stations]) => {
          return stations.map(station => {

            if (station.hidden) {
              return null;
            }

            if (station.location === undefined) {
              return null;
            }

            const ref = transitPathRefs[pathId];
            if (!ref) {
              return null;
            }

            const pathLength = ref.getTotalLength() || 0;
            const ptOnPath = ref.getPointAtLength(pathLength * station.location);
            const labelPosition = station.labelPosition || 'left';
            let labelPositionX = 0;
            let labelPositionY = 0;
            let labelTextAnchor = 'middle';
            let labelDominantBaseline = 'middle';
            let transformOriginHorizontal;
            if (labelPosition.includes('top')) {
              labelPositionY = -5;
              labelDominantBaseline = 'auto';
              labelTextAnchor = 'start';
              transformOriginHorizontal = 'left';
            } else if (labelPosition.includes('bottom')) {
              labelPositionY = 5;
              labelDominantBaseline = 'hanging';
              labelTextAnchor = 'end';
              transformOriginHorizontal = 'right';
            }
            if (labelPosition.includes('left')) {
              labelPositionX = -7;
              labelTextAnchor = 'end';
              transformOriginHorizontal = 'right';
            } else if (labelPosition.includes('right')) {
              labelPositionX = 7;
              labelTextAnchor = 'start';
              transformOriginHorizontal = 'left';
            }
            if (labelPosition === 'bottom-left') {
              labelPositionX = -6;
              labelPositionY = 0;
            }
            const angle = getAngleAtPathPt(ref, pathLength * station.location);
            return (
              <React.Fragment key={`${pathId}-${station.location}`}>
                <defs>
                  <linearGradient id={`transitRegularStation${pathId}`} gradientTransform="rotate(90)">
                    <stop offset="65%" stopColor={transit?.color?.stroke || getColor('transit.stroke')} />
                    <stop offset="65%" stopColor="transparent" />
                  </linearGradient>
                </defs>
                {station.interchange ? (
                  <circle
                    cx={ptOnPath.x}
                    cy={ptOnPath.y}
                    r={3}
                    fill="#fff"
                    stroke="#000"
                    strokeWidth={1.2}
                    onClick={() => eventHandlers?.['onClick-transit-station']?.({
                      transitId,
                      stationId: station.id,
                    })}
                    cursor={eventHandlers?.['onClick-transit-station'] ? 'pointer' : 'default'}
                    className="transit-station"
                  />
                ) : (
                  <Styled.TransitRegularStation
                    x={ptOnPath.x - 1.5}
                    y={ptOnPath.y - 5}
                    width={3}
                    height={10}
                    fill={`url('#transitRegularStation${pathId}')`}
                    transform={`rotate(${angle})`}
                    onClick={() => eventHandlers?.['onClick-transit-station']?.({
                      transitId,
                      stationId: station.id,
                    })}
                    cursor={eventHandlers?.['onClick-transit-station'] ? 'pointer' : 'default'}
                    className="transit-station"
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
                    transformOrigin={`${transformOriginHorizontal} center`}
                    className={`transit-station-label ${transit.stationLabelOnHover ? 'on-hover' : ''}`}
                  >
                    {station.label}
                  </Styled.TransitStationLabelText>
                ) : null }
              </React.Fragment>
            )
          });
        })
      }) }
      { Object.entries(transits || {}).map(([transitId, transit]) => {
        if (!transit.vehicles) {
          return null;
        }
        return transit.vehicles.map((vehicle) => {
          const ref = transitPathRefs[vehicle.pathId];
          if (!ref) {
            return null;
          }
          const pathLength = ref.getTotalLength() || 0;
          const ptOnPath = ref.getPointAtLength(pathLength * vehicle.location);
          const angle = getAngleAtPathPt(ref, pathLength * vehicle.location);
          return (
            <Styled.TransitVehicleContainer key={`${vehicle.pathId}-${vehicle.location}`} transform={`rotate(${vehicle.direction === 'start' ? angle + 180 : angle})`}>
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
    );
  }, [
    canvasWidth,
    canvasHeight,
    width,
    height,
    transits,
    colors,
    concreteGroundPaths,
    transitPathRefs,
    setTransitPathRefs,
    colors
  ]);

  return (
    <Styled.MapWrapper>
      <TransformWrapper
        wheel={{ step: 0.05 }}
      >
        {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
          <>
            <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: '100%', height: '100%' }}>
              {canvas}
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
