import * as React from "react";
import styled from "styled-components";

const Base = styled.div`
  position: relative;
  background-color: white;
  width: 400px;
  padding: 12px;
  border-radius: 5px;
  box-shadow: 1px 1px 4px 0px rgba(0, 0, 0, 0.2);
  display: flex;
  z-index: 100;
`;

const Avatar = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #f3f3f3;
  margin-right: 24px;
`;

const Main = styled.div`
  flex: 1 1 auto;
`;

const Title = styled.div`
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 6px;
  color: #444;
`;

const Description = styled.div`
  width: 200px;
  height: 12px;
  border-radius: 3px;
  background-color: #f3f3f3;
`;

type Props = {
  style?: React.CSSProperties;
  className?: string;
  title: string;
  index: number;
  onClick?: () => void;
  id: string;
};

function Item({ style, className, title, onClick }: Props, ref: any) {
  return (
    <Base ref={ref} style={style} className={className} onClick={onClick}>
      <Avatar />
      <Main>
        <Title>{title}</Title>
        <Description />
      </Main>
    </Base>
  );
}

export default React.forwardRef(Item);
