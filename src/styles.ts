import styled from 'styled-components';

export const TransitRegularStation = styled.rect`
  transform-box: fill-box;
  transform-origin: center center;
`;

interface TransitStationLabelTextProps {
  transformOrigin: string;
}

export const TransitStationLabelText = styled.text<TransitStationLabelTextProps>`
  transform-box: fill-box;
  transform-origin: ${({ transformOrigin }) => transformOrigin };
`;

export const TransitVehicleContainer = styled.g`
  transform-box: fill-box;
  transform-origin: center center;
`;

export const MapWrapper = styled.div`
  display: inline-block;
  position: relative;
  width: 100%;
  height: 100%;
`;

export const Controls = styled.div`
  position: absolute;
  top: 0;
  left: 0;
`;