import * as React from "react";
import styled from "styled-components";

type InfoProps = {
  style?: React.CSSProperties;
  className?: string;
  title: string;
  index: number;
};

const Base = styled.div`
  width: 400px;
  opacity: 0;
  transform: translateY(200px);
`;

const InfoHeader = styled.div`
  font-weight: bold;
`;

const InfoDecription = styled.div`
  font-size: 14px;
  color: grey;
`;

const Info = React.forwardRef(function Info(
  { style, className, title }: InfoProps,
  ref: any
) {
  return (
    <Base ref={ref} style={style} className={className}>
      <InfoHeader>{title}</InfoHeader>
      <InfoDecription>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam vulputate
        consectetur odio sit amet egestas.
      </InfoDecription>
    </Base>
  );
});

export default Info;
