import styled from 'styled-components';

export const TransitRegularStation = styled.rect`
  transform-box: fill-box;
  transform-origin: center center;
`;

export const TransitStationLabelText = styled.text`
  transform-box: fill-box;
  transform-origin: right center;
`;

export const TransitVehicleContainer = styled.g`
  transform-box: fill-box;
  transform-origin: center center;
`;

export const MapWrapper = styled.div`
  display: inline-block;
  position: relative;
`;

export const Controls = styled.div`
  position: absolute;
  top: 0;
  left: 0;
`;